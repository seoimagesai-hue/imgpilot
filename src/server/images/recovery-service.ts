import {and, eq, inArray, lt, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {imageReplacements, images} from "@/db/schema";
import {
  RECOVERY_BATCH_LIMIT,
  STALE_DELETION_MS,
  STALE_REPLACEMENT_MS,
} from "@/server/images/lifecycle-errors";
import {retryDeletionCleanup} from "@/server/images/delete-service";
import {
  cancelOwnedReplacement,
  retryOldStorageCleanup,
} from "@/server/images/replace-service";
import {getObjectStorageProvider} from "@/server/storage/provider";

export type RecoveryOptions = {
  dryRun?: boolean;
  limit?: number;
  now?: Date;
};

export type RecoveryReport = {
  dryRun: boolean;
  scanned: {
    staleDeletions: number;
    deletionFailed: number;
    oldCleanupFailed: number;
    cancelCleanupFailed: number;
    abandonedCandidates: number;
  };
  actions: string[];
};

/**
 * Bounded recovery for delete/replace saga orphans.
 * Exact trusted keys only. Never deletes the active image storage key.
 * Ready for future scheduling — not scheduled in this prompt.
 */
export async function recoverImageLifecycle(options: RecoveryOptions = {}): Promise<RecoveryReport> {
  const dryRun = Boolean(options.dryRun);
  const limit = Math.min(options.limit ?? RECOVERY_BATCH_LIMIT, RECOVERY_BATCH_LIMIT);
  const now = options.now ?? new Date();
  const staleDeletionBefore = new Date(now.getTime() - STALE_DELETION_MS);
  const staleReplacementBefore = new Date(now.getTime() - STALE_REPLACEMENT_MS);
  const actions: string[] = [];
  const scanned = {
    staleDeletions: 0,
    deletionFailed: 0,
    oldCleanupFailed: 0,
    cancelCleanupFailed: 0,
    abandonedCandidates: 0,
  };

  const db = getDb();

  const deletionRows = await db
    .select({
      id: images.id,
      projectId: images.projectId,
      deletedBy: images.deletedBy,
      status: images.status,
      storageKey: images.storageKey,
    })
    .from(images)
    .where(
      or(
        eq(images.status, "deletion_failed"),
        and(
          inArray(images.status, ["deletion_pending", "storage_deleting"]),
          or(
            lt(images.deletionStartedAt, staleDeletionBefore),
            and(
              sql`${images.deletionStartedAt} IS NULL`,
              lt(images.deletionRequestedAt, staleDeletionBefore),
            ),
          ),
        ),
      ),
    )
    .limit(limit);

  for (const row of deletionRows) {
    if (row.status === "deletion_failed") scanned.deletionFailed += 1;
    else scanned.staleDeletions += 1;
    if (dryRun) {
      actions.push(`dry-run delete-cleanup image=${row.id}`);
      continue;
    }
    if (!row.deletedBy) {
      actions.push(`skip delete-cleanup missing deletedBy image=${row.id}`);
      continue;
    }
    const result = await retryDeletionCleanup({
      userId: row.deletedBy,
      projectId: row.projectId,
      imageId: row.id,
    });
    actions.push(
      result.ok
        ? `delete-cleanup ok image=${row.id} status=${result.status}`
        : `delete-cleanup fail image=${row.id} error=${result.error}`,
    );
  }

  const oldCleanupRows = await db
    .select()
    .from(imageReplacements)
    .where(
      inArray(imageReplacements.status, [
        "old_storage_cleanup_failed",
        "promoted",
        "old_storage_deleting",
      ]),
    )
    .limit(limit);

  for (const row of oldCleanupRows) {
    scanned.oldCleanupFailed += 1;
    if (dryRun) {
      actions.push(`dry-run old-cleanup replacement=${row.id}`);
      continue;
    }
    const result = await retryOldStorageCleanup({
      userId: row.createdBy,
      projectId: row.projectId,
      imageId: row.imageId,
      replacementId: row.id,
    });
    actions.push(
      result.ok
        ? `old-cleanup ok replacement=${row.id} status=${result.status}`
        : `old-cleanup fail replacement=${row.id} error=${result.error}`,
    );
  }

  const cancelCleanupRows = await db
    .select()
    .from(imageReplacements)
    .where(eq(imageReplacements.status, "cancel_cleanup_failed"))
    .limit(limit);

  for (const row of cancelCleanupRows) {
    scanned.cancelCleanupFailed += 1;
    if (dryRun) {
      actions.push(`dry-run cancel-cleanup replacement=${row.id}`);
      continue;
    }
    const result = await cancelOwnedReplacement({
      userId: row.createdBy,
      projectId: row.projectId,
      imageId: row.imageId,
      replacementId: row.id,
    });
    actions.push(
      result.ok
        ? `cancel-cleanup ok replacement=${row.id} status=${result.status}`
        : `cancel-cleanup fail replacement=${row.id} error=${result.error}`,
    );
  }

  const abandoned = await db
    .select()
    .from(imageReplacements)
    .where(
      and(
        inArray(imageReplacements.status, ["pending", "uploading", "uploaded", "failed"]),
        lt(imageReplacements.updatedAt, staleReplacementBefore),
      ),
    )
    .limit(limit);

  for (const row of abandoned) {
    scanned.abandonedCandidates += 1;
    if (dryRun) {
      actions.push(`dry-run abandon-cancel replacement=${row.id}`);
      continue;
    }
    const result = await cancelOwnedReplacement({
      userId: row.createdBy,
      projectId: row.projectId,
      imageId: row.imageId,
      replacementId: row.id,
    });
    actions.push(
      result.ok
        ? `abandon-cancel ok replacement=${row.id}`
        : `abandon-cancel fail replacement=${row.id} error=${result.error}`,
    );
  }

  // Safety probe: never touch storage without a trusted key path in dry-run.
  if (!dryRun) {
    await getObjectStorageProvider();
  }

  return {dryRun, scanned, actions};
}
