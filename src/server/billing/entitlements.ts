import {and, desc, eq, gte, lt, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  billingEntitlementSnapshots,
  billingSubscriptions,
  billingUsageLedger,
  type BillingEntitlementSnapshot,
} from "@/db/schema";
import {
  freePlanPeriodBounds,
  isWriteEntitlementAllowed,
  mapEntitlementState,
  type EntitlementState,
} from "./billing-policy";
import {getPlan, type PlanDefinition} from "./plan-catalog";
import {getOrCreateBillingAccount} from "./billing-customers";

export type ResolvedEntitlement = {
  userId: string;
  plan: PlanDefinition;
  planCode: string;
  subscriptionStatus: string;
  entitlementState: EntitlementState;
  billingInterval: string | null;
  periodStart: Date;
  periodEnd: Date;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEndsAt: Date | null;
  snapshot: BillingEntitlementSnapshot | null;
  writesAllowed: boolean;
};

function snapshotFromPlan(
  userId: string,
  plan: PlanDefinition,
  extras: Partial<BillingEntitlementSnapshot> = {},
): Omit<BillingEntitlementSnapshot, never> {
  const period = freePlanPeriodBounds();
  return {
    userId,
    planCode: plan.code,
    subscriptionStatus: extras.subscriptionStatus ?? "inactive",
    entitlementState: extras.entitlementState ?? "enabled",
    billingInterval: extras.billingInterval ?? null,
    periodStart: extras.periodStart ?? period.start,
    periodEnd: extras.periodEnd ?? period.end,
    trialEnd: extras.trialEnd ?? null,
    cancelAtPeriodEnd: extras.cancelAtPeriodEnd ?? false,
    gracePeriodEndsAt: extras.gracePeriodEndsAt ?? null,
    maxProjects: plan.maxProjects,
    maxImagesPerProject: plan.maxImagesPerProject,
    maxOriginalStorageBytes: plan.maxOriginalStorageBytes,
    maxGeneratedStorageBytes: plan.maxGeneratedStorageBytes,
    monthlyProcessingLimit: plan.monthlyProcessingLimit,
    monthlyAiLimit: plan.monthlyAiLimit,
    monthlyExportLimit: plan.monthlyExportLimit,
    bulkProcessingEnabled: plan.bulkProcessingEnabled,
    aiMetadataEnabled: plan.aiMetadataEnabled,
    exportEnabled: plan.exportEnabled,
    cmsExportEnabled: plan.cmsExportEnabled,
    version: extras.version ?? 1,
    calculatedAt: extras.calculatedAt ?? new Date(),
    updatedAt: extras.updatedAt ?? new Date(),
  };
}

export async function ensureFreeEntitlementSnapshot(userId: string): Promise<BillingEntitlementSnapshot> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(billingEntitlementSnapshots)
    .where(eq(billingEntitlementSnapshots.userId, userId))
    .limit(1);
  if (existing) return existing;

  await getOrCreateBillingAccount(userId);
  const plan = getPlan("free")!;
  const values = snapshotFromPlan(userId, plan);
  const [inserted] = await db
    .insert(billingEntitlementSnapshots)
    .values(values)
    .onConflictDoNothing()
    .returning();
  if (inserted) return inserted;
  const [again] = await db
    .select()
    .from(billingEntitlementSnapshots)
    .where(eq(billingEntitlementSnapshots.userId, userId))
    .limit(1);
  return again!;
}

export async function upsertEntitlementSnapshot(
  values: ReturnType<typeof snapshotFromPlan>,
): Promise<BillingEntitlementSnapshot> {
  const db = getDb();
  const [row] = await db
    .insert(billingEntitlementSnapshots)
    .values(values)
    .onConflictDoUpdate({
      target: billingEntitlementSnapshots.userId,
      set: {
        ...values,
        version: sql`${billingEntitlementSnapshots.version} + 1`,
        updatedAt: new Date(),
        calculatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function resolveEntitlement(userId: string): Promise<ResolvedEntitlement> {
  const snapshot = await ensureFreeEntitlementSnapshot(userId);
  const plan = getPlan(snapshot.planCode) ?? getPlan("free")!;
  const state = (snapshot.entitlementState as EntitlementState) || "enabled";
  const periodStart = snapshot.periodStart ?? freePlanPeriodBounds().start;
  const periodEnd = snapshot.periodEnd ?? freePlanPeriodBounds().end;

  return {
    userId,
    plan,
    planCode: plan.code,
    subscriptionStatus: snapshot.subscriptionStatus,
    entitlementState: state,
    billingInterval: snapshot.billingInterval,
    periodStart,
    periodEnd,
    trialEnd: snapshot.trialEnd,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    gracePeriodEndsAt: snapshot.gracePeriodEndsAt,
    snapshot,
    writesAllowed: isWriteEntitlementAllowed(state),
  };
}

export async function rebuildEntitlementFromSubscription(userId: string): Promise<ResolvedEntitlement> {
  const db = getDb();
  const [sub] = await db
    .select()
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.userId, userId))
    .orderBy(desc(billingSubscriptions.updatedAt))
    .limit(1);

  const free = getPlan("free")!;
  if (!sub || !sub.stripeSubscriptionId) {
    const values = snapshotFromPlan(userId, free, {
      subscriptionStatus: "inactive",
      entitlementState: "enabled",
    });
    await upsertEntitlementSnapshot(values);
    return resolveEntitlement(userId);
  }

  const plan = getPlan(sub.planCode) ?? free;
  const graceEnds =
    sub.status === "past_due"
      ? sub.updatedAt
        ? new Date(sub.updatedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : null;

  const entitlementState = mapEntitlementState({
    status: sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd: sub.currentPeriodEnd,
    gracePeriodEndsAt: graceEnds,
  });

  // Ended / canceled without active period → free restricted or free enabled?
  // Policy: after end, apply free plan limits in restricted mode if over free limits,
  // but entitlement_state restricted for paid-feature gates; free features still use free plan.
  const effectivePlan =
    entitlementState === "enabled" || entitlementState === "grace_period" ? plan : free;

  const period =
    sub.currentPeriodStart && sub.currentPeriodEnd
      ? {start: sub.currentPeriodStart, end: sub.currentPeriodEnd}
      : freePlanPeriodBounds();

  await upsertEntitlementSnapshot(
    snapshotFromPlan(userId, effectivePlan, {
      planCode: effectivePlan.code,
      subscriptionStatus: sub.status,
      entitlementState,
      billingInterval: sub.billingInterval,
      periodStart: period.start,
      periodEnd: period.end,
      trialEnd: sub.trialEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      gracePeriodEndsAt: graceEnds,
    }),
  );

  return resolveEntitlement(userId);
}

export type UsageCategory =
  | "processing"
  | "ai"
  | "export"
  | "wordpress_publish"
  | "shopify_publish"
  | "webflow_publish"
  | "cloudinary_publish"
  | "workflow_run";

export async function countUsageInPeriod(
  userId: string,
  category: UsageCategory,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${billingUsageLedger.quantity}), 0)::int`,
    })
    .from(billingUsageLedger)
    .where(
      and(
        eq(billingUsageLedger.userId, userId),
        eq(billingUsageLedger.category, category),
        eq(billingUsageLedger.status, "recorded"),
        gte(billingUsageLedger.periodStart, periodStart),
        lt(billingUsageLedger.recordedAt, periodEnd),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function recordUsage(params: {
  userId: string;
  projectId?: string | null;
  category: UsageCategory;
  entityId: string;
  idempotencyKey: string;
  quantity?: number;
}): Promise<{ok: true; duplicate: boolean} | {ok: false; error: "USAGE_RECORD_FAILED"}> {
  const entitlement = await resolveEntitlement(params.userId);
  const db = getDb();
  try {
    const [row] = await db
      .insert(billingUsageLedger)
      .values({
        id: crypto.randomUUID(),
        userId: params.userId,
        projectId: params.projectId ?? null,
        category: params.category,
        entityId: params.entityId,
        idempotencyKey: params.idempotencyKey,
        periodStart: entitlement.periodStart,
        periodEnd: entitlement.periodEnd,
        quantity: params.quantity ?? 1,
        status: "recorded",
      })
      .onConflictDoNothing()
      .returning({id: billingUsageLedger.id});
    return {ok: true, duplicate: !row};
  } catch {
    return {ok: false, error: "USAGE_RECORD_FAILED"};
  }
}

export async function assertMonthlyAllowance(
  userId: string,
  category: UsageCategory,
): Promise<{ok: true} | {ok: false; error: "PROCESSING_LIMIT_REACHED" | "AI_LIMIT_REACHED" | "EXPORT_LIMIT_REACHED" | "SUBSCRIPTION_RESTRICTED" | "FEATURE_NOT_INCLUDED"}> {
  const entitlement = await resolveEntitlement(userId);
  if (!entitlement.writesAllowed) {
    return {ok: false, error: "SUBSCRIPTION_RESTRICTED"};
  }
  if (category === "ai" && !entitlement.plan.aiMetadataEnabled) {
    return {ok: false, error: "FEATURE_NOT_INCLUDED"};
  }
  if (category === "export" && !entitlement.plan.exportEnabled) {
    return {ok: false, error: "FEATURE_NOT_INCLUDED"};
  }
  if (category === "processing" && !entitlement.plan.bulkProcessingEnabled) {
    // processing still allowed for single; bulk checked separately
  }

  const limit =
    category === "processing"
      ? entitlement.plan.monthlyProcessingLimit
      : category === "ai"
        ? entitlement.plan.monthlyAiLimit
        : entitlement.plan.monthlyExportLimit;

  if (limit < 0) return {ok: true};

  const used = await countUsageInPeriod(
    userId,
    category,
    entitlement.periodStart,
    entitlement.periodEnd,
  );
  if (used >= limit) {
    if (category === "processing") return {ok: false, error: "PROCESSING_LIMIT_REACHED"};
    if (category === "ai") return {ok: false, error: "AI_LIMIT_REACHED"};
    return {ok: false, error: "EXPORT_LIMIT_REACHED"};
  }
  return {ok: true};
}

export async function getProjectQuotaLimitsForUser(userId: string): Promise<{
  maxImagesPerProject: number;
  maxProjectStorageBytes: number;
  maxGeneratedStorageBytes: number;
  maxProjects: number;
  entitlementState: EntitlementState;
  writesAllowed: boolean;
}> {
  const e = await resolveEntitlement(userId);
  return {
    maxImagesPerProject: e.plan.maxImagesPerProject,
    maxProjectStorageBytes: e.plan.maxOriginalStorageBytes,
    maxGeneratedStorageBytes: e.plan.maxGeneratedStorageBytes,
    maxProjects: e.plan.maxProjects,
    entitlementState: e.entitlementState,
    writesAllowed: e.writesAllowed,
  };
}

export {snapshotFromPlan};
