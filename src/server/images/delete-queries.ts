import {and, eq, inArray, isNull, ne, or, sql} from "drizzle-orm";
import {getTableColumns} from "drizzle-orm";
import {getDb} from "@/db";
import {images, projects, type Image} from "@/db/schema";
import {
  DELETABLE_STATUSES,
  isDeletionUnavailableStatus,
} from "@/server/images/lifecycle-errors";

export async function getOwnedImageForLifecycle(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<Image | null> {
  const db = getDb();
  const [row] = await db
    .select(getTableColumns(images))
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(eq(images.id, imageId), eq(images.projectId, projectId), eq(projects.userId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export type DeleteAcquireResult =
  | {kind: "acquired"; image: Image; storageKey: string; attempt: number}
  | {kind: "already_deleted"; image: Image}
  | {kind: "in_progress"; image: Image}
  | {kind: "deletion_failed"; image: Image}
  | {kind: "not_found"}
  | {kind: "not_deletable"; image: Image}
  | {kind: "replacement_active"};

/**
 * Conditionally acquire deletion: hide from product immediately (deletedAt + deletion_pending).
 * Does not touch R2.
 */
export async function acquireImageDeletion(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<DeleteAcquireResult> {
  const current = await getOwnedImageForLifecycle(userId, projectId, imageId);
  if (!current) return {kind: "not_found"};

  if (current.status === "deleted" && current.deletedAt) {
    return {kind: "already_deleted", image: current};
  }
  if (current.status === "deletion_failed") {
    return {kind: "deletion_failed", image: current};
  }
  if (
    current.status === "deletion_pending" ||
    current.status === "storage_deleting" ||
    (current.deletedAt && isDeletionUnavailableStatus(current.status))
  ) {
    return {kind: "in_progress", image: current};
  }

  if (!(DELETABLE_STATUSES as readonly string[]).includes(current.status)) {
    return {kind: "not_deletable", image: current};
  }

  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "deletion_pending",
      deletedAt: now,
      deletionRequestedAt: now,
      deletedBy: userId,
      deletionFailureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        isNull(images.deletedAt),
        inArray(images.status, [...DELETABLE_STATUSES]),
      ),
    )
    .returning();

  if (!updated) {
    const again = await getOwnedImageForLifecycle(userId, projectId, imageId);
    if (!again) return {kind: "not_found"};
    if (again.status === "deleted") return {kind: "already_deleted", image: again};
    if (again.status === "deletion_failed") return {kind: "deletion_failed", image: again};
    if (isDeletionUnavailableStatus(again.status)) return {kind: "in_progress", image: again};
    return {kind: "not_deletable", image: again};
  }

  return {
    kind: "acquired",
    image: updated,
    storageKey: updated.storageKey,
    attempt: updated.deletionAttempts,
  };
}

export async function markStorageDeleting(
  imageId: string,
  projectId: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "storage_deleting",
      deletionStartedAt: now,
      deletionAttempts: sql`${images.deletionAttempts} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        or(eq(images.status, "deletion_pending"), eq(images.status, "deletion_failed")),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function markImageDeletedComplete(
  imageId: string,
  projectId: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "deleted",
      storageDeletedAt: now,
      deletionFailureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        or(
          eq(images.status, "storage_deleting"),
          eq(images.status, "deletion_pending"),
          eq(images.status, "deletion_failed"),
        ),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function markDeletionFailed(
  imageId: string,
  projectId: string,
  failureCode: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "deletion_failed",
      deletionFailureCode: failureCode,
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        ne(images.status, "deleted"),
        or(
          eq(images.status, "storage_deleting"),
          eq(images.status, "deletion_pending"),
          eq(images.status, "deletion_failed"),
        ),
      ),
    )
    .returning();
  return updated ?? null;
}
