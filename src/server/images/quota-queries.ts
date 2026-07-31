import {and, eq, sql} from "drizzle-orm";
import {getDb, type Database} from "@/db";
import {
  projectQuotaState,
  quotaReservations,
  type ProjectQuotaState,
  type QuotaReservation,
} from "@/db/schema";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export function toUsageSnapshot(state: ProjectQuotaState) {
  return {
    activeImageCount: state.activeImageCount,
    reservedImageSlots: state.reservedImageSlots,
    activeOriginalBytes: state.activeOriginalBytes,
    reservedUploadBytes: state.reservedUploadBytes,
    replacementCandidateBytes: state.replacementCandidateBytes,
    cleanupPendingBytes: state.cleanupPendingBytes,
  };
}

export async function ensureProjectQuotaState(
  projectId: string,
  db: DbOrTx = getDb(),
): Promise<ProjectQuotaState> {
  const existing = await getProjectQuotaState(projectId, false, db);
  if (existing) return existing;

  const [inserted] = await db
    .insert(projectQuotaState)
    .values({projectId})
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const again = await getProjectQuotaState(projectId, false, db);
  if (!again) {
    throw new Error("Failed to ensure project quota state");
  }
  return again;
}

export async function getProjectQuotaState(
  projectId: string,
  forUpdate = false,
  db: DbOrTx = getDb(),
): Promise<ProjectQuotaState | null> {
  const query = db
    .select()
    .from(projectQuotaState)
    .where(eq(projectQuotaState.projectId, projectId))
    .limit(1);

  const [row] = forUpdate ? await query.for("update") : await query;
  return row ?? null;
}

export async function insertReservation(
  values: {
    id?: string;
    projectId: string;
    imageId?: string | null;
    replacementId?: string | null;
    kind: "new_upload" | "replacement_upload";
    declaredBytes: number;
    expiresAt: Date;
    idempotencyKey?: string | null;
  },
  db: DbOrTx = getDb(),
): Promise<QuotaReservation> {
  const now = new Date();
  const [row] = await db
    .insert(quotaReservations)
    .values({
      id: values.id ?? crypto.randomUUID(),
      projectId: values.projectId,
      imageId: values.imageId ?? null,
      replacementId: values.replacementId ?? null,
      kind: values.kind,
      status: "reserved",
      declaredBytes: values.declaredBytes,
      expiresAt: values.expiresAt,
      idempotencyKey: values.idempotencyKey ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Failed to insert quota reservation");
  return row;
}

export async function updateReservationStatus(
  params: {
    reservationId: string;
    projectId: string;
    fromStatus?: QuotaReservation["status"];
    toStatus: QuotaReservation["status"];
    trustedConfirmedBytes?: number | null;
  },
  db: DbOrTx = getDb(),
): Promise<QuotaReservation | null> {
  const now = new Date();
  const set: Partial<typeof quotaReservations.$inferInsert> = {
    status: params.toStatus,
    updatedAt: now,
  };
  if (params.toStatus === "consumed") {
    set.consumedAt = now;
    if (params.trustedConfirmedBytes != null) {
      set.trustedConfirmedBytes = params.trustedConfirmedBytes;
    }
  }
  if (
    params.toStatus === "released" ||
    params.toStatus === "expired" ||
    params.toStatus === "cancelled"
  ) {
    set.releasedAt = now;
  }

  const conditions = [
    eq(quotaReservations.id, params.reservationId),
    eq(quotaReservations.projectId, params.projectId),
  ];
  if (params.fromStatus) {
    conditions.push(eq(quotaReservations.status, params.fromStatus));
  }

  const [row] = await db
    .update(quotaReservations)
    .set(set)
    .where(and(...conditions))
    .returning();
  return row ?? null;
}

export async function getReservationById(
  projectId: string,
  reservationId: string,
  db: DbOrTx = getDb(),
): Promise<QuotaReservation | null> {
  const [row] = await db
    .select()
    .from(quotaReservations)
    .where(
      and(
        eq(quotaReservations.id, reservationId),
        eq(quotaReservations.projectId, projectId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getReservationByImageIdAndKind(
  projectId: string,
  imageId: string,
  kind: "new_upload" | "replacement_upload",
  db: DbOrTx = getDb(),
): Promise<QuotaReservation | null> {
  const [row] = await db
    .select()
    .from(quotaReservations)
    .where(
      and(
        eq(quotaReservations.projectId, projectId),
        eq(quotaReservations.imageId, imageId),
        eq(quotaReservations.kind, kind),
        eq(quotaReservations.status, "reserved"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getReservationByReplacementId(
  projectId: string,
  replacementId: string,
  db: DbOrTx = getDb(),
): Promise<QuotaReservation | null> {
  const [row] = await db
    .select()
    .from(quotaReservations)
    .where(
      and(
        eq(quotaReservations.projectId, projectId),
        eq(quotaReservations.replacementId, replacementId),
        eq(quotaReservations.status, "reserved"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function bumpQuotaState(
  projectId: string,
  delta: {
    activeImageCount?: number;
    reservedImageSlots?: number;
    activeOriginalBytes?: number;
    reservedUploadBytes?: number;
    replacementCandidateBytes?: number;
    cleanupPendingBytes?: number;
  },
  db: DbOrTx = getDb(),
): Promise<ProjectQuotaState | null> {
  const now = new Date();
  const set: Record<string, unknown> = {
    updatedAt: now,
    quotaVersion: sql`${projectQuotaState.quotaVersion} + 1`,
  };

  if (delta.activeImageCount != null) {
    set.activeImageCount = sql`GREATEST(0, ${projectQuotaState.activeImageCount} + ${delta.activeImageCount})`;
  }
  if (delta.reservedImageSlots != null) {
    set.reservedImageSlots = sql`GREATEST(0, ${projectQuotaState.reservedImageSlots} + ${delta.reservedImageSlots})`;
  }
  if (delta.activeOriginalBytes != null) {
    set.activeOriginalBytes = sql`GREATEST(0, ${projectQuotaState.activeOriginalBytes} + ${delta.activeOriginalBytes})`;
  }
  if (delta.reservedUploadBytes != null) {
    set.reservedUploadBytes = sql`GREATEST(0, ${projectQuotaState.reservedUploadBytes} + ${delta.reservedUploadBytes})`;
  }
  if (delta.replacementCandidateBytes != null) {
    set.replacementCandidateBytes = sql`GREATEST(0, ${projectQuotaState.replacementCandidateBytes} + ${delta.replacementCandidateBytes})`;
  }
  if (delta.cleanupPendingBytes != null) {
    set.cleanupPendingBytes = sql`GREATEST(0, ${projectQuotaState.cleanupPendingBytes} + ${delta.cleanupPendingBytes})`;
  }

  const [row] = await db
    .update(projectQuotaState)
    .set(set)
    .where(eq(projectQuotaState.projectId, projectId))
    .returning();
  return row ?? null;
}

export async function setQuotaStateReconciled(
  projectId: string,
  values: {
    activeImageCount: number;
    reservedImageSlots: number;
    activeOriginalBytes: number;
    reservedUploadBytes: number;
    replacementCandidateBytes: number;
    cleanupPendingBytes: number;
    inconsistencyFlag: boolean;
  },
  db: DbOrTx = getDb(),
): Promise<ProjectQuotaState | null> {
  const now = new Date();
  const [row] = await db
    .update(projectQuotaState)
    .set({
      activeImageCount: values.activeImageCount,
      reservedImageSlots: values.reservedImageSlots,
      activeOriginalBytes: values.activeOriginalBytes,
      reservedUploadBytes: values.reservedUploadBytes,
      replacementCandidateBytes: values.replacementCandidateBytes,
      cleanupPendingBytes: values.cleanupPendingBytes,
      inconsistencyFlag: values.inconsistencyFlag,
      lastReconciledAt: now,
      updatedAt: now,
      quotaVersion: sql`${projectQuotaState.quotaVersion} + 1`,
    })
    .where(eq(projectQuotaState.projectId, projectId))
    .returning();
  return row ?? null;
}
