import {and, eq, inArray, isNull, or, sql} from "drizzle-orm";
import {getTableColumns} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageReplacements,
  images,
  projects,
  type Image,
  type ImageReplacement,
  type NewImageReplacement,
} from "@/db/schema";
import {
  OPEN_REPLACEMENT_STATUSES,
  isOpenReplacementStatus,
} from "@/server/images/lifecycle-errors";
import type {TrustedImageInspection} from "@/server/images/image-inspector";
import {IMAGE_VALIDATION_VERSION} from "@/server/images/validation-policy";

export async function getOwnedImageRow(
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

export async function getOwnedReplacement(
  userId: string,
  projectId: string,
  replacementId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const [row] = await db
    .select(getTableColumns(imageReplacements))
    .from(imageReplacements)
    .innerJoin(projects, eq(imageReplacements.projectId, projects.id))
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getActiveReplacementForImage(
  projectId: string,
  imageId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(imageReplacements)
    .where(
      and(
        eq(imageReplacements.projectId, projectId),
        eq(imageReplacements.imageId, imageId),
        inArray(imageReplacements.status, [...OPEN_REPLACEMENT_STATUSES]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function hasOpenReplacementForImage(
  projectId: string,
  imageId: string,
): Promise<boolean> {
  const row = await getActiveReplacementForImage(projectId, imageId);
  return Boolean(row);
}

export async function insertReplacementCandidate(
  values: NewImageReplacement,
): Promise<ImageReplacement> {
  const db = getDb();
  const [row] = await db.insert(imageReplacements).values(values).returning();
  if (!row) throw new Error("insertReplacementCandidate failed");
  return row;
}

export async function markReplacementUploading(
  replacementId: string,
  projectId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({status: "uploading", updatedAt: now})
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        or(eq(imageReplacements.status, "pending"), eq(imageReplacements.status, "uploading")),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markReplacementUploaded(
  replacementId: string,
  projectId: string,
  meta: {
    byteSize: number;
    etag?: string;
    contentType?: string;
  },
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "uploaded",
      newByteSize: meta.byteSize,
      newEtag: meta.etag ?? null,
      newStorageContentType: meta.contentType ?? null,
      uploadConfirmedAt: now,
      failureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        inArray(imageReplacements.status, ["pending", "uploading", "uploaded"]),
      ),
    )
    .returning();
  return row ?? null;
}

export async function acquireReplacementValidation(
  userId: string,
  projectId: string,
  replacementId: string,
): Promise<
  | {kind: "acquired"; replacement: ImageReplacement; attempt: number}
  | {kind: "idempotent"; replacement: ImageReplacement}
  | {kind: "in_progress"; replacement: ImageReplacement}
  | {kind: "not_found"}
  | {kind: "invalid_state"; replacement: ImageReplacement}
> {
  const current = await getOwnedReplacement(userId, projectId, replacementId);
  if (!current) return {kind: "not_found"};
  if (current.status === "validated") return {kind: "idempotent", replacement: current};
  if (current.status === "validating") return {kind: "in_progress", replacement: current};
  if (current.status !== "uploaded" && current.status !== "failed") {
    return {kind: "invalid_state", replacement: current};
  }

  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(imageReplacements)
    .set({
      status: "validating",
      validationAttempts: sql`${imageReplacements.validationAttempts} + 1`,
      lastValidationAttemptAt: now,
      failureCode: null,
      updatedAt: now,
      newDetectedFormat: null,
      newDetectedMime: null,
      newWidth: null,
      newHeight: null,
      newPixelCount: null,
      newAnimated: null,
      newFrameCount: null,
      newOrientation: null,
      newHasAlpha: null,
      newColourSpace: null,
      validatedAt: null,
      validationVersion: null,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        inArray(imageReplacements.status, ["uploaded", "failed"]),
      ),
    )
    .returning();

  if (!updated) {
    const again = await getOwnedReplacement(userId, projectId, replacementId);
    if (!again) return {kind: "not_found"};
    if (again.status === "validated") return {kind: "idempotent", replacement: again};
    if (again.status === "validating") return {kind: "in_progress", replacement: again};
    return {kind: "invalid_state", replacement: again};
  }

  return {kind: "acquired", replacement: updated, attempt: updated.validationAttempts};
}

export async function markReplacementValidated(
  replacementId: string,
  projectId: string,
  inspection: TrustedImageInspection,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "validated",
      newDetectedFormat: inspection.format,
      newDetectedMime: inspection.mimeType,
      newWidth: inspection.width,
      newHeight: inspection.height,
      newPixelCount: inspection.pixelCount,
      newAnimated: inspection.isAnimated,
      newFrameCount: inspection.frameCount,
      newOrientation: inspection.orientation,
      newHasAlpha: inspection.hasAlpha,
      newColourSpace: inspection.colourSpace,
      validatedAt: now,
      validationVersion: IMAGE_VALIDATION_VERSION,
      failureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        eq(imageReplacements.status, "validating"),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markReplacementFailed(
  replacementId: string,
  projectId: string,
  failureCode: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "failed",
      failureCode,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        inArray(imageReplacements.status, [
          "pending",
          "uploading",
          "uploaded",
          "validating",
          "failed",
        ]),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markReplacementValidationFailed(
  replacementId: string,
  projectId: string,
  failureCode: string,
): Promise<ImageReplacement | null> {
  return markReplacementFailed(replacementId, projectId, failureCode);
}

/**
 * Promote validated candidate onto stable image row inside one DB transaction.
 * Old R2 deletion happens AFTER this commits.
 */
export async function promoteReplacementInTransaction(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<
  | {
      ok: true;
      image: Image;
      replacement: ImageReplacement;
      oldStorageKey: string;
      oldTrustedBytes: number;
    }
  | {ok: false; error: "not_found" | "conflict" | "not_ready"}
> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const owned = await tx
      .select({id: projects.id})
      .from(projects)
      .where(and(eq(projects.id, params.projectId), eq(projects.userId, params.userId)))
      .limit(1);
    if (!owned[0]) return {ok: false as const, error: "not_found" as const};

    const [candidate] = await tx
      .select()
      .from(imageReplacements)
      .where(
        and(
          eq(imageReplacements.id, params.replacementId),
          eq(imageReplacements.imageId, params.imageId),
          eq(imageReplacements.projectId, params.projectId),
        ),
      )
      .limit(1);

    if (!candidate) return {ok: false as const, error: "not_found" as const};
    if (candidate.status !== "validated" && candidate.status !== "promotion_pending") {
      return {ok: false as const, error: "not_ready" as const};
    }
    if (
      candidate.newByteSize == null ||
      !candidate.newDetectedMime ||
      !candidate.newDetectedFormat ||
      candidate.newWidth == null ||
      candidate.newHeight == null
    ) {
      return {ok: false as const, error: "not_ready" as const};
    }

    const [image] = await tx
      .select()
      .from(images)
      .where(
        and(
          eq(images.id, params.imageId),
          eq(images.projectId, params.projectId),
          isNull(images.deletedAt),
          inArray(images.status, ["validated", "validation_failed", "ready_for_processing"]),
        ),
      )
      .limit(1);

    if (!image) return {ok: false as const, error: "not_found" as const};

    const oldStorageKey = image.storageKey;
    const oldTrustedBytes = image.storageSizeBytes ?? image.sizeBytes;
    if (!candidate.newStorageKey || candidate.newStorageKey === oldStorageKey) {
      return {ok: false as const, error: "conflict" as const};
    }

    const now = new Date();
    const [updatedImage] = await tx
      .update(images)
      .set({
        storageKey: candidate.newStorageKey,
        originalFilename: candidate.newOriginalFilename,
        mimeType: candidate.newDeclaredMime,
        fileExtension: candidate.newFileExtension,
        sizeBytes: candidate.newByteSize,
        storageSizeBytes: candidate.newByteSize,
        storageContentType: candidate.newStorageContentType,
        etag: candidate.newEtag,
        detectedFormat: candidate.newDetectedFormat,
        detectedMimeType: candidate.newDetectedMime,
        width: candidate.newWidth,
        height: candidate.newHeight,
        pixelCount: candidate.newPixelCount,
        isAnimated: candidate.newAnimated,
        frameCount: candidate.newFrameCount,
        orientation: candidate.newOrientation,
        hasAlpha: candidate.newHasAlpha,
        colourSpace: candidate.newColourSpace,
        status: "validated",
        failureCode: null,
        failureMessage: null,
        validatedAt: candidate.validatedAt ?? now,
        validationVersion: candidate.validationVersion ?? IMAGE_VALIDATION_VERSION,
        confirmedAt: candidate.uploadConfirmedAt ?? now,
        uploadedAt: candidate.uploadConfirmedAt ?? now,
        replacedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(images.id, params.imageId),
          eq(images.storageKey, oldStorageKey),
          isNull(images.deletedAt),
        ),
      )
      .returning();

    if (!updatedImage) return {ok: false as const, error: "conflict" as const};

    const [updatedReplacement] = await tx
      .update(imageReplacements)
      .set({
        status: "promoted",
        oldStorageKey,
        oldByteSize: oldTrustedBytes,
        promotionStartedAt: candidate.promotionStartedAt ?? now,
        promotedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(imageReplacements.id, params.replacementId),
          inArray(imageReplacements.status, ["validated", "promotion_pending"]),
        ),
      )
      .returning();

    if (!updatedReplacement) return {ok: false as const, error: "conflict" as const};

    return {
      ok: true as const,
      image: updatedImage,
      replacement: updatedReplacement,
      oldStorageKey,
      oldTrustedBytes,
    };
  });
}

export async function markOldStorageDeleting(
  replacementId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "old_storage_deleting",
      oldStorageCleanupStartedAt: now,
      attemptCount: sql`${imageReplacements.attemptCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        inArray(imageReplacements.status, [
          "promoted",
          "old_storage_cleanup_failed",
          "old_storage_deleting",
        ]),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markReplacementComplete(
  replacementId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "complete",
      oldStorageDeletedAt: now,
      failureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        inArray(imageReplacements.status, [
          "old_storage_deleting",
          "promoted",
          "old_storage_cleanup_failed",
        ]),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markOldStorageCleanupFailed(
  replacementId: string,
  failureCode: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "old_storage_cleanup_failed",
      failureCode,
      updatedAt: now,
    })
    .where(eq(imageReplacements.id, replacementId))
    .returning();
  return row ?? null;
}

export async function acquireReplacementCancellation(
  userId: string,
  projectId: string,
  replacementId: string,
): Promise<
  | {kind: "acquired"; replacement: ImageReplacement}
  | {kind: "already_cancelled"; replacement: ImageReplacement}
  | {kind: "not_found"}
  | {kind: "invalid_state"; replacement: ImageReplacement}
> {
  const current = await getOwnedReplacement(userId, projectId, replacementId);
  if (!current) return {kind: "not_found"};
  if (current.status === "cancelled") return {kind: "already_cancelled", replacement: current};
  if (current.status === "cancel_cleanup_failed") {
    return {kind: "acquired", replacement: current};
  }
  if (
    !isOpenReplacementStatus(current.status) ||
    current.status === "promotion_pending"
  ) {
    // promoted / complete cannot cancel
    if (
      current.status === "promoted" ||
      current.status === "complete" ||
      current.status === "old_storage_deleting" ||
      current.status === "old_storage_cleanup_failed"
    ) {
      return {kind: "invalid_state", replacement: current};
    }
  }

  const cancellable = [
    "pending",
    "uploading",
    "uploaded",
    "validating",
    "validated",
    "failed",
    "cancel_cleanup_failed",
  ] as const;

  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(imageReplacements)
    .set({
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(imageReplacements.id, replacementId),
        eq(imageReplacements.projectId, projectId),
        inArray(imageReplacements.status, [...cancellable]),
      ),
    )
    .returning();

  if (!updated) {
    const again = await getOwnedReplacement(userId, projectId, replacementId);
    if (!again) return {kind: "not_found"};
    if (again.status === "cancelled") return {kind: "already_cancelled", replacement: again};
    return {kind: "invalid_state", replacement: again};
  }

  return {kind: "acquired", replacement: updated};
}

export async function markCancelCleanupFailed(
  replacementId: string,
  failureCode: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "cancel_cleanup_failed",
      failureCode,
      updatedAt: now,
      attemptCount: sql`${imageReplacements.attemptCount} + 1`,
    })
    .where(eq(imageReplacements.id, replacementId))
    .returning();
  return row ?? null;
}

export async function markCandidateObjectDeleted(
  replacementId: string,
): Promise<ImageReplacement | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(imageReplacements)
    .set({
      status: "cancelled",
      candidateDeletedAt: now,
      failureCode: null,
      updatedAt: now,
    })
    .where(eq(imageReplacements.id, replacementId))
    .returning();
  return row ?? null;
}

export {isOpenReplacementStatus};
