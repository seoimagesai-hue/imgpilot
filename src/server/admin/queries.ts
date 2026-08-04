import {and, count, desc, eq, gte, ilike, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  adminAuditLogs,
  billingAccounts,
  billingEntitlementSnapshots,
  billingSubscriptions,
  billingUsageLedger,
  guestCleanupQueue,
  guestSessions,
  processingJobs,
  stripeEvents,
  users,
} from "@/db/schema";
import {scrubGuestSessionRow, type ScrubbedGuestSession} from "@/server/admin/redaction";
import {readCleanupSchedulerHeartbeat} from "@/server/ops/cleanup-scheduler";

export type OverviewCounts = {
  usersTotal: number;
  usersActive: number;
  usersSuspended: number;
  guestSessionsCount: number;
  subscriptionsCount: number;
  usageLedgerToday: number;
  failedProcessingJobs: number;
  guestCleanupPending: number;
  cleanupHeartbeat: ReturnType<typeof readCleanupSchedulerHeartbeat>;
};

export async function overviewCounts(): Promise<OverviewCounts> {
  const db = getDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  async function safeCount(label: string, run: () => Promise<number>): Promise<number> {
    try {
      return await run();
    } catch (err) {
      console.error(`[admin] overview count failed: ${label}`, err instanceof Error ? err.message : err);
      return 0;
    }
  }

  const [
    usersTotal,
    usersActive,
    usersSuspended,
    guestSessionsCount,
    subscriptionsCount,
    usageLedgerToday,
    failedProcessingJobs,
    guestCleanupPending,
  ] = await Promise.all([
    safeCount("usersTotal", async () => {
      const [row] = await db.select({count: count()}).from(users);
      return row?.count ?? 0;
    }),
    safeCount("usersActive", async () => {
      const [row] = await db
        .select({count: count()})
        .from(users)
        .where(eq(users.accountStatus, "active"));
      return row?.count ?? 0;
    }),
    safeCount("usersSuspended", async () => {
      const [row] = await db
        .select({count: count()})
        .from(users)
        .where(eq(users.accountStatus, "suspended"));
      return row?.count ?? 0;
    }),
    safeCount("guestSessions", async () => {
      const [row] = await db.select({count: count()}).from(guestSessions);
      return row?.count ?? 0;
    }),
    safeCount("subscriptions", async () => {
      const [row] = await db.select({count: count()}).from(billingSubscriptions);
      return row?.count ?? 0;
    }),
    safeCount("usageToday", async () => {
      const [row] = await db
        .select({count: count()})
        .from(billingUsageLedger)
        .where(gte(billingUsageLedger.recordedAt, todayStart));
      return row?.count ?? 0;
    }),
    safeCount("failedJobs", async () => {
      const [row] = await db
        .select({count: count()})
        .from(processingJobs)
        .where(eq(processingJobs.status, "failed"));
      return row?.count ?? 0;
    }),
    safeCount("cleanupPending", async () => {
      const [row] = await db
        .select({count: count()})
        .from(guestCleanupQueue)
        .where(eq(guestCleanupQueue.status, "pending"));
      return row?.count ?? 0;
    }),
  ]);

  let cleanupHeartbeat: ReturnType<typeof readCleanupSchedulerHeartbeat> = {
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastStatus: "skipped",
  };
  try {
    cleanupHeartbeat = readCleanupSchedulerHeartbeat();
  } catch (err) {
    console.error(
      "[admin] cleanup heartbeat read failed",
      err instanceof Error ? err.message : err,
    );
  }

  return {
    usersTotal,
    usersActive,
    usersSuspended,
    guestSessionsCount,
    subscriptionsCount,
    usageLedgerToday,
    failedProcessingJobs,
    guestCleanupPending,
    cleanupHeartbeat,
  };
}

export type SafeUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: Date;
  suspendedAt: Date | null;
};

export async function listUsers(params: {
  q?: string;
  status?: "active" | "suspended";
  limit: number;
  offset: number;
}): Promise<{rows: SafeUserRow[]; total: number}> {
  const db = getDb();
  const conditions = [];

  if (params.status) {
    conditions.push(eq(users.accountStatus, params.status));
  }
  if (params.q?.trim()) {
    const pattern = `%${params.q.trim()}%`;
    conditions.push(or(ilike(users.email, pattern), ilike(users.name, pattern)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
        suspendedAt: users.suspendedAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(users).where(where),
  ]);

  return {rows, total: totalRow[0]?.count ?? 0};
}

export type UserDetail = SafeUserRow & {
  emailVerified: Date | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  updatedAt: Date;
  entitlement: {
    planCode: string;
    subscriptionStatus: string;
    entitlementState: string;
  } | null;
  billingAccount: {hasStripeCustomer: boolean} | null;
};

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      accountStatus: users.accountStatus,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      suspendedAt: users.suspendedAt,
      suspendedBy: users.suspendedBy,
      suspensionReason: users.suspensionReason,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [entitlement, billingAccount] = await Promise.all([
    db
      .select({
        planCode: billingEntitlementSnapshots.planCode,
        subscriptionStatus: billingEntitlementSnapshots.subscriptionStatus,
        entitlementState: billingEntitlementSnapshots.entitlementState,
      })
      .from(billingEntitlementSnapshots)
      .where(eq(billingEntitlementSnapshots.userId, userId))
      .limit(1),
    db
      .select({stripeCustomerId: billingAccounts.stripeCustomerId})
      .from(billingAccounts)
      .where(eq(billingAccounts.userId, userId))
      .limit(1),
  ]);

  return {
    ...user,
    entitlement: entitlement[0] ?? null,
    billingAccount: billingAccount[0]
      ? {hasStripeCustomer: Boolean(billingAccount[0].stripeCustomerId)}
      : null,
  };
}

export type SubscriptionRow = {
  id: string;
  userId: string;
  userEmail: string;
  planCode: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: Date;
};

export async function listSubscriptions(params: {
  limit: number;
  offset: number;
}): Promise<{rows: SubscriptionRow[]; total: number}> {
  const db = getDb();
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: billingSubscriptions.id,
        userId: billingSubscriptions.userId,
        userEmail: users.email,
        planCode: billingSubscriptions.planCode,
        status: billingSubscriptions.status,
        billingInterval: billingSubscriptions.billingInterval,
        currentPeriodEnd: billingSubscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: billingSubscriptions.cancelAtPeriodEnd,
        updatedAt: billingSubscriptions.updatedAt,
      })
      .from(billingSubscriptions)
      .innerJoin(users, eq(billingSubscriptions.userId, users.id))
      .orderBy(desc(billingSubscriptions.updatedAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(billingSubscriptions),
  ]);

  return {rows, total: totalRow[0]?.count ?? 0};
}

export type StripeEventRow = {
  id: string;
  stripeEventId: string;
  eventType: string;
  eventCreatedAt: Date;
  livemode: boolean;
  processingStatus: string;
  attemptCount: number;
  processedAt: Date | null;
  failureCode: string | null;
  failureMessageSafe: string | null;
};

export async function listStripeEvents(params: {
  limit: number;
  offset: number;
}): Promise<{rows: StripeEventRow[]; total: number}> {
  const db = getDb();
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: stripeEvents.id,
        stripeEventId: stripeEvents.stripeEventId,
        eventType: stripeEvents.eventType,
        eventCreatedAt: stripeEvents.eventCreatedAt,
        livemode: stripeEvents.livemode,
        processingStatus: stripeEvents.processingStatus,
        attemptCount: stripeEvents.attemptCount,
        processedAt: stripeEvents.processedAt,
        failureCode: stripeEvents.failureCode,
        failureMessageSafe: stripeEvents.failureMessageSafe,
      })
      .from(stripeEvents)
      .orderBy(desc(stripeEvents.eventCreatedAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(stripeEvents),
  ]);

  return {rows, total: totalRow[0]?.count ?? 0};
}

export type AuditLogRow = {
  id: string;
  adminUserId: string;
  adminEmail: string | null;
  action: string;
  targetEntityType: string;
  targetEntityId: string | null;
  reason: string | null;
  beforeSummary: string | null;
  afterSummary: string | null;
  correlationId: string | null;
  createdAt: Date;
};

export async function listAuditLogs(params: {
  limit: number;
  offset: number;
}): Promise<{rows: AuditLogRow[]; total: number}> {
  const db = getDb();
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: adminAuditLogs.id,
        adminUserId: adminAuditLogs.adminUserId,
        adminEmail: users.email,
        action: adminAuditLogs.action,
        targetEntityType: adminAuditLogs.targetEntityType,
        targetEntityId: adminAuditLogs.targetEntityId,
        reason: adminAuditLogs.reason,
        beforeSummary: adminAuditLogs.beforeSummary,
        afterSummary: adminAuditLogs.afterSummary,
        correlationId: adminAuditLogs.correlationId,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminUserId, users.id))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(adminAuditLogs),
  ]);

  return {rows, total: totalRow[0]?.count ?? 0};
}

export async function listGuestSessions(params: {
  limit: number;
  offset: number;
}): Promise<{rows: ScrubbedGuestSession[]; total: number}> {
  const db = getDb();
  const now = new Date();
  const [raw, totalRow] = await Promise.all([
    db
      .select({
        id: guestSessions.id,
        publicId: guestSessions.publicId,
        cohort: guestSessions.cohort,
        locale: guestSessions.locale,
        toolCode: guestSessions.toolCode,
        operationsUsed: guestSessions.operationsUsed,
        createdAt: guestSessions.createdAt,
        expiresAt: guestSessions.expiresAt,
        scrubbedAt: guestSessions.scrubbedAt,
      })
      .from(guestSessions)
      .orderBy(desc(guestSessions.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(guestSessions),
  ]);

  return {
    rows: raw.map((row) => scrubGuestSessionRow(row, now)),
    total: totalRow[0]?.count ?? 0,
  };
}

export type UsageAggregateRow = {
  category: string;
  totalQuantity: number;
  entryCount: number;
};

export async function usageAggregates(): Promise<UsageAggregateRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      category: billingUsageLedger.category,
      totalQuantity: sql<number>`coalesce(sum(${billingUsageLedger.quantity}), 0)::int`,
      entryCount: count(),
    })
    .from(billingUsageLedger)
    .groupBy(billingUsageLedger.category)
    .orderBy(desc(sql`coalesce(sum(${billingUsageLedger.quantity}), 0)`));

  return rows.map((row) => ({
    category: row.category,
    totalQuantity: Number(row.totalQuantity ?? 0),
    entryCount: Number(row.entryCount ?? 0),
  }));
}

export type JobStatusAggregate = {
  status: string;
  count: number;
};

export async function jobsAggregates(): Promise<JobStatusAggregate[]> {
  const db = getDb();
  const rows = await db
    .select({
      status: processingJobs.status,
      count: count(),
    })
    .from(processingJobs)
    .groupBy(processingJobs.status)
    .orderBy(desc(count()));

  return rows.map((row) => ({
    status: row.status,
    count: Number(row.count ?? 0),
  }));
}

export async function recentUsageLedger(params: {
  limit: number;
  offset: number;
}): Promise<{
  rows: {
    id: string;
    userId: string;
    category: string;
    quantity: number;
    status: string;
    recordedAt: Date;
  }[];
  total: number;
}> {
  const db = getDb();
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: billingUsageLedger.id,
        userId: billingUsageLedger.userId,
        category: billingUsageLedger.category,
        quantity: billingUsageLedger.quantity,
        status: billingUsageLedger.status,
        recordedAt: billingUsageLedger.recordedAt,
      })
      .from(billingUsageLedger)
      .orderBy(desc(billingUsageLedger.recordedAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({count: count()}).from(billingUsageLedger),
  ]);

  return {rows, total: totalRow[0]?.count ?? 0};
}
