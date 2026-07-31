import {eq, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {imageReplacements, images, projects} from "@/db/schema";
import type {SafeQuotaErrorCode} from "@/server/images/quota-errors";
import {
  availableImageSlots,
  availableStorageBytes,
  canReserveNewUploadSlots,
  canReserveStorageBytes,
  clampNonNegative,
  computeEffectiveUsageBytes,
  isBatchSizeWithinLimit,
  isFileSizeWithinLimit,
  sumDeclaredBytes,
  trustedSizeDelta,
  type QuotaUsageSnapshot,
} from "@/server/images/quota-policy";
import {
  bumpQuotaState,
  ensureProjectQuotaState,
  getProjectQuotaState,
  getReservationById,
  getReservationByImageIdAndKind,
  getReservationByReplacementId,
  insertReservation,
  setQuotaStateReconciled,
  toUsageSnapshot as stateToSnapshot,
  updateReservationStatus,
} from "@/server/images/quota-queries";
import {getOwnedProject} from "@/server/projects/queries";

export type ProjectQuotaUsageDto = {
  activeImageCount: number;
  reservedImageSlots: number;
  logicalImageSlots: number;
  activeOriginalBytes: number;
  reservedUploadBytes: number;
  replacementCandidateBytes: number;
  cleanupPendingBytes: number;
  effectiveUsageBytes: number;
  availableImageSlots: number;
  availableStorageBytes: number;
  inconsistencyFlag: boolean;
};

function trustedImageBytes(row: {storageSizeBytes: number | null; sizeBytes: number}): number {
  return clampNonNegative(row.storageSizeBytes ?? row.sizeBytes);
}

export async function getOwnedProjectQuotaUsage(
  userId: string,
  projectId: string,
): Promise<ProjectQuotaUsageDto | null> {
  const project = await getOwnedProject(userId, projectId);
  if (!project) return null;

  const state = await ensureProjectQuotaState(projectId);
  const usage = stateToSnapshot(state);
  return toPublicDto(usage, state.inconsistencyFlag);
}

function toPublicDto(usage: QuotaUsageSnapshot, inconsistencyFlag: boolean): ProjectQuotaUsageDto {
  return {
    activeImageCount: usage.activeImageCount,
    reservedImageSlots: usage.reservedImageSlots,
    logicalImageSlots: usage.activeImageCount + usage.reservedImageSlots,
    activeOriginalBytes: usage.activeOriginalBytes,
    reservedUploadBytes: usage.reservedUploadBytes,
    replacementCandidateBytes: usage.replacementCandidateBytes,
    cleanupPendingBytes: usage.cleanupPendingBytes,
    effectiveUsageBytes: computeEffectiveUsageBytes(usage),
    availableImageSlots: availableImageSlots(usage),
    availableStorageBytes: availableStorageBytes(usage),
    inconsistencyFlag,
  };
}

export type ReserveNewUploadItem = {
  clientId: string;
  imageId: string;
  declaredBytes: number;
  expiresAt: Date;
};

export type ReserveNewUploadsResult =
  | {
      ok: true;
      reservations: Array<{clientId: string; imageId: string; reservationId: string}>;
    }
  | {ok: false; error: SafeQuotaErrorCode; clientId?: string};

export async function reserveNewUploads(
  userId: string,
  projectId: string,
  items: ReserveNewUploadItem[],
): Promise<ReserveNewUploadsResult> {
  const project = await getOwnedProject(userId, projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  if (!isBatchSizeWithinLimit(items.length)) {
    return {ok: false, error: "UPLOAD_BATCH_LIMIT_EXCEEDED"};
  }

  for (const item of items) {
    if (!isFileSizeWithinLimit(item.declaredBytes)) {
      return {ok: false, error: "FILE_SIZE_LIMIT_EXCEEDED", clientId: item.clientId};
    }
  }

  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      await ensureProjectQuotaState(projectId, tx);
      const state = await getProjectQuotaState(projectId, true, tx);
      if (!state) return {ok: false as const, error: "QUOTA_ACCOUNTING_CONFLICT" as const};

      const usage = stateToSnapshot(state);
      const totalBytes = sumDeclaredBytes(items);

      if (!canReserveNewUploadSlots(usage, items.length)) {
        return {ok: false as const, error: "PROJECT_IMAGE_LIMIT_REACHED" as const};
      }
      if (!canReserveStorageBytes(usage, totalBytes)) {
        return {ok: false as const, error: "PROJECT_STORAGE_LIMIT_REACHED" as const};
      }

      const reservations: Array<{clientId: string; imageId: string; reservationId: string}> = [];

      for (const item of items) {
        const reservation = await insertReservation(
          {
            projectId,
            imageId: item.imageId,
            kind: "new_upload",
            declaredBytes: item.declaredBytes,
            expiresAt: item.expiresAt,
            idempotencyKey: `new-upload:${projectId}:${item.imageId}`,
          },
          tx,
        );
        reservations.push({
          clientId: item.clientId,
          imageId: item.imageId,
          reservationId: reservation.id,
        });
      }

      await bumpQuotaState(
        projectId,
        {
          reservedImageSlots: items.length,
          reservedUploadBytes: totalBytes,
        },
        tx,
      );

      return {ok: true as const, reservations};
    });
  } catch (error) {
    console.error(
      "[quota] reserveNewUploads failed",
      error instanceof Error ? error.message : "unknown",
    );
    return {ok: false, error: "QUOTA_ACCOUNTING_CONFLICT"};
  }
}

export type ReserveReplacementResult =
  | {ok: true; reservationId: string}
  | {ok: false; error: SafeQuotaErrorCode};

export async function reserveReplacementUpload(params: {
  userId: string;
  projectId: string;
  replacementId: string;
  imageId: string;
  declaredBytes: number;
  expiresAt: Date;
}): Promise<ReserveReplacementResult> {
  const project = await getOwnedProject(params.userId, params.projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  if (!isFileSizeWithinLimit(params.declaredBytes)) {
    return {ok: false, error: "FILE_SIZE_LIMIT_EXCEEDED"};
  }

  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      await ensureProjectQuotaState(params.projectId, tx);
      const state = await getProjectQuotaState(params.projectId, true, tx);
      if (!state) return {ok: false as const, error: "QUOTA_ACCOUNTING_CONFLICT" as const};

      const usage = stateToSnapshot(state);
      if (!canReserveStorageBytes(usage, params.declaredBytes)) {
        return {ok: false as const, error: "INSUFFICIENT_STORAGE_FOR_REPLACEMENT" as const};
      }

      const reservation = await insertReservation(
        {
          projectId: params.projectId,
          imageId: params.imageId,
          replacementId: params.replacementId,
          kind: "replacement_upload",
          declaredBytes: params.declaredBytes,
          expiresAt: params.expiresAt,
          idempotencyKey: `replacement:${params.projectId}:${params.replacementId}`,
        },
        tx,
      );

      await bumpQuotaState(
        params.projectId,
        {reservedUploadBytes: params.declaredBytes},
        tx,
      );

      return {ok: true as const, reservationId: reservation.id};
    });
  } catch (error) {
    console.error(
      "[quota] reserveReplacementUpload failed",
      error instanceof Error ? error.message : "unknown",
    );
    return {ok: false, error: "QUOTA_ACCOUNTING_CONFLICT"};
  }
}

export type ConsumeReservationResult =
  | {ok: true; trustedBytes: number}
  | {ok: false; error: SafeQuotaErrorCode};

export async function consumeNewUploadReservation(params: {
  projectId: string;
  imageId: string;
  reservationId?: string;
  trustedBytes: number;
}): Promise<ConsumeReservationResult> {
  if (params.trustedBytes <= 0) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const state = await getProjectQuotaState(params.projectId, true, tx);
      if (!state) return {ok: false as const, error: "QUOTA_ACCOUNTING_CONFLICT" as const};

      const reservation = params.reservationId
        ? await getReservationById(params.projectId, params.reservationId, tx)
        : await getReservationByImageIdAndKind(params.projectId, params.imageId, "new_upload", tx);

      if (!reservation) {
        return {ok: false as const, error: "QUOTA_RESERVATION_NOT_FOUND" as const};
      }
      if (reservation.imageId !== params.imageId) {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }
      if (reservation.status === "consumed") {
        return {ok: false as const, error: "QUOTA_RESERVATION_ALREADY_CONSUMED" as const};
      }
      if (reservation.status !== "reserved") {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }
      if (reservation.expiresAt.getTime() < Date.now()) {
        await updateReservationStatus(
          {
            reservationId: reservation.id,
            projectId: params.projectId,
            fromStatus: "reserved",
            toStatus: "expired",
          },
          tx,
        );
        return {ok: false as const, error: "QUOTA_RESERVATION_EXPIRED" as const};
      }

      const declared = reservation.declaredBytes;
      const delta = trustedSizeDelta(declared, params.trustedBytes);
      const usage = stateToSnapshot(state);

      if (delta > 0 && !canReserveStorageBytes(usage, delta)) {
        return {ok: false as const, error: "UPLOAD_REJECTED_BY_QUOTA" as const};
      }

      const updated = await updateReservationStatus(
        {
          reservationId: reservation.id,
          projectId: params.projectId,
          fromStatus: "reserved",
          toStatus: "consumed",
          trustedConfirmedBytes: params.trustedBytes,
        },
        tx,
      );
      if (!updated) {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }

      await bumpQuotaState(
        params.projectId,
        {
          reservedImageSlots: -1,
          reservedUploadBytes: -declared,
          activeImageCount: 1,
          activeOriginalBytes: params.trustedBytes,
        },
        tx,
      );

      return {ok: true as const, trustedBytes: params.trustedBytes};
    });
  } catch {
    console.error("[quota] consumeNewUploadReservation failed");
    return {ok: false, error: "QUOTA_ACCOUNTING_CONFLICT"};
  }
}

export async function consumeReplacementReservation(params: {
  projectId: string;
  replacementId: string;
  imageId: string;
  reservationId?: string;
  trustedBytes: number;
}): Promise<ConsumeReservationResult> {
  if (params.trustedBytes <= 0) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const state = await getProjectQuotaState(params.projectId, true, tx);
      if (!state) return {ok: false as const, error: "QUOTA_ACCOUNTING_CONFLICT" as const};

      const reservation = params.reservationId
        ? await getReservationById(params.projectId, params.reservationId, tx)
        : await getReservationByReplacementId(params.projectId, params.replacementId, tx);

      if (!reservation) {
        return {ok: false as const, error: "QUOTA_RESERVATION_NOT_FOUND" as const};
      }
      if (reservation.replacementId !== params.replacementId) {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }
      if (reservation.status === "consumed") {
        return {ok: false as const, error: "QUOTA_RESERVATION_ALREADY_CONSUMED" as const};
      }
      if (reservation.status !== "reserved") {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }
      if (reservation.expiresAt.getTime() < Date.now()) {
        await updateReservationStatus(
          {
            reservationId: reservation.id,
            projectId: params.projectId,
            fromStatus: "reserved",
            toStatus: "expired",
          },
          tx,
        );
        return {ok: false as const, error: "QUOTA_RESERVATION_EXPIRED" as const};
      }

      const declared = reservation.declaredBytes;
      const delta = trustedSizeDelta(declared, params.trustedBytes);
      const usage = stateToSnapshot(state);

      if (delta > 0 && !canReserveStorageBytes(usage, delta)) {
        return {ok: false as const, error: "UPLOAD_REJECTED_BY_QUOTA" as const};
      }

      const updated = await updateReservationStatus(
        {
          reservationId: reservation.id,
          projectId: params.projectId,
          fromStatus: "reserved",
          toStatus: "consumed",
          trustedConfirmedBytes: params.trustedBytes,
        },
        tx,
      );
      if (!updated) {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }

      await bumpQuotaState(
        params.projectId,
        {
          reservedUploadBytes: -declared,
          replacementCandidateBytes: params.trustedBytes,
        },
        tx,
      );

      return {ok: true as const, trustedBytes: params.trustedBytes};
    });
  } catch {
    console.error("[quota] consumeReplacementReservation failed");
    return {ok: false, error: "QUOTA_ACCOUNTING_CONFLICT"};
  }
}

export async function releaseReservation(params: {
  projectId: string;
  reservationId: string;
  reason?: "released" | "expired" | "cancelled";
}): Promise<{ok: true} | {ok: false; error: SafeQuotaErrorCode}> {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const state = await getProjectQuotaState(params.projectId, true, tx);
      if (!state) return {ok: false as const, error: "QUOTA_ACCOUNTING_CONFLICT" as const};

      const reservation = await getReservationById(params.projectId, params.reservationId, tx);
      if (!reservation) {
        return {ok: false as const, error: "QUOTA_RESERVATION_NOT_FOUND" as const};
      }
      if (reservation.status !== "reserved") {
        return {ok: false as const, error: "QUOTA_RESERVATION_ALREADY_CONSUMED" as const};
      }

      const toStatus = params.reason ?? "released";
      const updated = await updateReservationStatus(
        {
          reservationId: reservation.id,
          projectId: params.projectId,
          fromStatus: "reserved",
          toStatus,
        },
        tx,
      );
      if (!updated) {
        return {ok: false as const, error: "QUOTA_RESERVATION_CONFLICT" as const};
      }

      const delta: Parameters<typeof bumpQuotaState>[1] = {
        reservedUploadBytes: -reservation.declaredBytes,
      };
      if (reservation.kind === "new_upload") {
        delta.reservedImageSlots = -1;
      }

      await bumpQuotaState(params.projectId, delta, tx);
      return {ok: true as const};
    });
  } catch {
    console.error("[quota] releaseReservation failed");
    return {ok: false, error: "QUOTA_ACCOUNTING_CONFLICT"};
  }
}

export async function onImageDeletionAcquired(params: {
  projectId: string;
  imageId: string;
  declaredOrTrustedBytes: number;
  wasPendingUpload: boolean;
}): Promise<void> {
  if (params.wasPendingUpload) {
    const reservation = await getReservationByImageIdAndKind(
      params.projectId,
      params.imageId,
      "new_upload",
    );
    if (reservation) {
      await releaseReservation({
        projectId: params.projectId,
        reservationId: reservation.id,
        reason: "cancelled",
      });
      return;
    }

    const db = getDb();
    await db.transaction(async (tx) => {
      await ensureProjectQuotaState(params.projectId, tx);
      await getProjectQuotaState(params.projectId, true, tx);
      await bumpQuotaState(
        params.projectId,
        {
          reservedImageSlots: -1,
          reservedUploadBytes: -clampNonNegative(params.declaredOrTrustedBytes),
        },
        tx,
      );
    });
    return;
  }

  await onDeleteAcquired({
    projectId: params.projectId,
    trustedBytes: params.declaredOrTrustedBytes,
  });
}

export async function onDeleteAcquired(params: {
  projectId: string;
  trustedBytes: number;
}): Promise<void> {
  const bytes = clampNonNegative(params.trustedBytes);
  const db = getDb();
  await db.transaction(async (tx) => {
    await ensureProjectQuotaState(params.projectId, tx);
    await getProjectQuotaState(params.projectId, true, tx);
    await bumpQuotaState(
      params.projectId,
      {
        activeImageCount: -1,
        activeOriginalBytes: -bytes,
        cleanupPendingBytes: bytes,
      },
      tx,
    );
  });
}

export async function onDeleteCleanupSuccess(params: {
  projectId: string;
  trustedBytes: number;
}): Promise<void> {
  const bytes = clampNonNegative(params.trustedBytes);
  const db = getDb();
  await db.transaction(async (tx) => {
    await ensureProjectQuotaState(params.projectId, tx);
    await getProjectQuotaState(params.projectId, true, tx);
    await bumpQuotaState(params.projectId, {cleanupPendingBytes: -bytes}, tx);
  });
}

export async function onReplacementPromoted(params: {
  projectId: string;
  newTrustedBytes: number;
  oldTrustedBytes: number;
}): Promise<void> {
  const newBytes = clampNonNegative(params.newTrustedBytes);
  const oldBytes = clampNonNegative(params.oldTrustedBytes);
  const db = getDb();
  await db.transaction(async (tx) => {
    await ensureProjectQuotaState(params.projectId, tx);
    await getProjectQuotaState(params.projectId, true, tx);
    await bumpQuotaState(
      params.projectId,
      {
        replacementCandidateBytes: -newBytes,
        activeOriginalBytes: newBytes - oldBytes,
        cleanupPendingBytes: oldBytes,
      },
      tx,
    );
  });
}

export async function onCandidateCleanupSuccess(params: {
  projectId: string;
  bytes: number;
}): Promise<void> {
  const bytes = clampNonNegative(params.bytes);
  const db = getDb();
  await db.transaction(async (tx) => {
    await ensureProjectQuotaState(params.projectId, tx);
    await getProjectQuotaState(params.projectId, true, tx);
    await bumpQuotaState(
      params.projectId,
      {
        replacementCandidateBytes: -bytes,
      },
      tx,
    );
  });
}

export async function onOldObjectCleanupSuccess(params: {
  projectId: string;
  bytes: number;
}): Promise<void> {
  const bytes = clampNonNegative(params.bytes);
  const db = getDb();
  await db.transaction(async (tx) => {
    await ensureProjectQuotaState(params.projectId, tx);
    await getProjectQuotaState(params.projectId, true, tx);
    await bumpQuotaState(params.projectId, {cleanupPendingBytes: -bytes}, tx);
  });
}

export type ReconcileReport = {
  projectId: string;
  dryRun: boolean;
  previous: QuotaUsageSnapshot;
  computed: QuotaUsageSnapshot;
  changed: boolean;
  inconsistencyFlag: boolean;
};

const RECONCILE_BATCH_LIMIT = 500;

const EMPTY_USAGE: QuotaUsageSnapshot = {
  activeImageCount: 0,
  reservedImageSlots: 0,
  activeOriginalBytes: 0,
  reservedUploadBytes: 0,
  replacementCandidateBytes: 0,
  cleanupPendingBytes: 0,
};

async function computeQuotaFromSource(projectId: string): Promise<QuotaUsageSnapshot> {
  const db = getDb();

  const [imageAgg] = await db
    .select({
      activeImageCount: sql<number>`count(*) filter (where ${images.deletedAt} is null and ${images.status} not in ('deletion_pending','storage_deleting','deletion_failed','deleted','pending_upload','upload_failed'))::int`,
      reservedImageSlots: sql<number>`count(*) filter (where ${images.status} = 'pending_upload' and (${images.uploadExpiresAt} is null or ${images.uploadExpiresAt} > now()))::int`,
      activeOriginalBytes: sql<number>`coalesce(sum(case when ${images.deletedAt} is null and ${images.status} not in ('deletion_pending','storage_deleting','deletion_failed','deleted','pending_upload','upload_failed') then coalesce(${images.storageSizeBytes}, ${images.sizeBytes}) else 0 end), 0)::bigint`,
      reservedUploadBytes: sql<number>`coalesce(sum(case when ${images.status} = 'pending_upload' and (${images.uploadExpiresAt} is null or ${images.uploadExpiresAt} > now()) then ${images.sizeBytes} else 0 end), 0)::bigint`,
      cleanupImageBytes: sql<number>`coalesce(sum(case when ${images.status} in ('deletion_pending','storage_deleting','deletion_failed') then coalesce(${images.storageSizeBytes}, ${images.sizeBytes}) else 0 end), 0)::bigint`,
    })
    .from(images)
    .where(eq(images.projectId, projectId));

  const [replacementAgg] = await db
    .select({
      candidateBytes: sql<number>`coalesce(sum(case when ${imageReplacements.status} in ('uploaded','validating','validated','promotion_pending','failed') then coalesce(${imageReplacements.newByteSize}, ${imageReplacements.newDeclaredSizeBytes}) when ${imageReplacements.status} in ('pending','uploading') and (${imageReplacements.uploadExpiresAt} is null or ${imageReplacements.uploadExpiresAt} > now()) then ${imageReplacements.newDeclaredSizeBytes} else 0 end), 0)::bigint`,
      reservedReplacementBytes: sql<number>`coalesce(sum(case when ${imageReplacements.status} in ('pending','uploading') and (${imageReplacements.uploadExpiresAt} is null or ${imageReplacements.uploadExpiresAt} > now()) then ${imageReplacements.newDeclaredSizeBytes} else 0 end), 0)::bigint`,
      cleanupReplacementBytes: sql<number>`coalesce(sum(case when ${imageReplacements.status} in ('promoted','old_storage_deleting','old_storage_cleanup_failed') then coalesce(${imageReplacements.oldByteSize}, 0) else 0 end), 0)::bigint`,
    })
    .from(imageReplacements)
    .where(eq(imageReplacements.projectId, projectId));

  const activeImageCount = Number(imageAgg?.activeImageCount ?? 0);
  const reservedImageSlots = Number(imageAgg?.reservedImageSlots ?? 0);
  const activeOriginalBytes = Number(imageAgg?.activeOriginalBytes ?? 0);
  const imageReservedBytes = Number(imageAgg?.reservedUploadBytes ?? 0);
  const replacementReservedBytes = Number(replacementAgg?.reservedReplacementBytes ?? 0);
  const candidateFromOpen = Number(replacementAgg?.candidateBytes ?? 0) - replacementReservedBytes;
  const cleanupPendingBytes =
    Number(imageAgg?.cleanupImageBytes ?? 0) + Number(replacementAgg?.cleanupReplacementBytes ?? 0);

  return {
    activeImageCount,
    reservedImageSlots,
    activeOriginalBytes,
    reservedUploadBytes: imageReservedBytes + replacementReservedBytes,
    replacementCandidateBytes: Math.max(0, candidateFromOpen),
    cleanupPendingBytes,
  };
}

export async function reconcileProjectQuota(params: {
  userId: string;
  projectId: string;
  dryRun?: boolean;
}): Promise<ReconcileReport | {ok: false; error: "PROJECT_NOT_FOUND"}> {
  const project = await getOwnedProject(params.userId, params.projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  await ensureProjectQuotaState(params.projectId);
  const current = await getProjectQuotaState(params.projectId);
  const previous = current ? stateToSnapshot(current) : EMPTY_USAGE;

  const computed = await computeQuotaFromSource(params.projectId);
  const changed =
    previous.activeImageCount !== computed.activeImageCount ||
    previous.reservedImageSlots !== computed.reservedImageSlots ||
    previous.activeOriginalBytes !== computed.activeOriginalBytes ||
    previous.reservedUploadBytes !== computed.reservedUploadBytes ||
    previous.replacementCandidateBytes !== computed.replacementCandidateBytes ||
    previous.cleanupPendingBytes !== computed.cleanupPendingBytes;

  if (!params.dryRun && changed) {
    await setQuotaStateReconciled(params.projectId, {
      ...computed,
      inconsistencyFlag: false,
    });
  }

  return {
    projectId: params.projectId,
    dryRun: Boolean(params.dryRun),
    previous,
    computed,
    changed,
    inconsistencyFlag: false,
  };
}

export async function reconcileAllProjectsQuota(params: {
  dryRun?: boolean;
  projectId?: string;
}): Promise<ReconcileReport[]> {
  const db = getDb();
  let projectIds: string[];

  if (params.projectId) {
    projectIds = [params.projectId];
  } else {
    const rows = await db
      .select({id: projects.id})
      .from(projects)
      .limit(RECONCILE_BATCH_LIMIT);
    projectIds = rows.map((r) => r.id);
  }

  const reports: ReconcileReport[] = [];
  for (const projectId of projectIds) {
    await ensureProjectQuotaState(projectId);
    const previousState = await getProjectQuotaState(projectId);
    const previous = previousState ? stateToSnapshot(previousState) : EMPTY_USAGE;

    const computed = await computeQuotaFromSource(projectId);
    const changed =
      previous.activeImageCount !== computed.activeImageCount ||
      previous.reservedImageSlots !== computed.reservedImageSlots ||
      previous.activeOriginalBytes !== computed.activeOriginalBytes ||
      previous.reservedUploadBytes !== computed.reservedUploadBytes ||
      previous.replacementCandidateBytes !== computed.replacementCandidateBytes ||
      previous.cleanupPendingBytes !== computed.cleanupPendingBytes;

    if (!params.dryRun && changed) {
      await setQuotaStateReconciled(projectId, {
        ...computed,
        inconsistencyFlag: false,
      });
    }

    reports.push({
      projectId,
      dryRun: Boolean(params.dryRun),
      previous,
      computed,
      changed,
      inconsistencyFlag: false,
    });
  }

  return reports;
}

/** @internal exported for tests */
export {trustedImageBytes, toPublicDto, computeQuotaFromSource};
