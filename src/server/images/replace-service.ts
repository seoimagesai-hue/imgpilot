import {getR2SignedUrlTtlSeconds, isR2Configured} from "@/lib/env";
import {MAX_BYTES_PER_IMAGE, getExtension} from "@/server/images/policy";
import {compareDeclaredVersusDetected} from "@/server/images/format-map";
import {inspectAndFullyDecodeImage} from "@/server/images/image-inspector";
import {
  type SafeLifecycleErrorCode,
  isDeletionUnavailableStatus,
  isReplaceableStatus,
} from "@/server/images/lifecycle-errors";
import {
  acquireReplacementCancellation,
  acquireReplacementValidation,
  getActiveReplacementForImage,
  getOwnedImageRow,
  getOwnedReplacement,
  insertReplacementCandidate,
  markCancelCleanupFailed,
  markCandidateObjectDeleted,
  markOldStorageCleanupFailed,
  markOldStorageDeleting,
  markReplacementComplete,
  markReplacementUploaded,
  markReplacementUploading,
  markReplacementValidated,
  markReplacementValidationFailed,
  promoteReplacementInTransaction,
} from "@/server/images/replace-queries";
import {buildSafeFilenameSuffix, fileDescriptorSchema} from "@/server/images/validation";
import {IMAGE_VALIDATION_VERSION} from "@/server/images/validation-policy";
import {ValidationDomainError} from "@/server/images/validation-errors";
import {getOwnedProject} from "@/server/projects/queries";
import {
  consumeReplacementReservation,
  onCandidateCleanupSuccess,
  onOldObjectCleanupSuccess,
  onReplacementPromoted,
  releaseReservation,
  reserveReplacementUpload,
} from "@/server/images/quota-service";
import {
  onReplacementPromotedEvaluateReady,
  onReplacementStartedDemoteReady,
} from "@/server/images/ready-service";
import {onReplacementInvalidateProcessing} from "@/server/images/processing-service";
import {onImageInvalidateBulkItems} from "@/server/images/bulk-service";
import {getReservationByReplacementId} from "@/server/images/quota-queries";
import {StorageDomainError} from "@/server/storage/errors";
import {buildReplacementStorageKey} from "@/server/storage/keys";
import {
  StorageNotConfiguredError,
  getObjectStorageProvider,
} from "@/server/storage/provider";

export type BeginReplacementResult =
  | {
      ok: true;
      replacementId: string;
      imageId: string;
      method: "PUT";
      uploadUrl: string;
      headers: Record<string, string>;
      expiresAt: string;
    }
  | {ok: false; error: SafeLifecycleErrorCode};

export async function beginOwnedImageReplacement(params: {
  userId: string;
  projectId: string;
  imageId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<BeginReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const image = await getOwnedImageRow(params.userId, project.id, params.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (!isReplaceableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_REPLACEABLE"};
  }

  const existing = await getActiveReplacementForImage(project.id, image.id);
  if (existing) return {ok: false, error: "REPLACEMENT_ALREADY_ACTIVE"};

  const parsed = fileDescriptorSchema.safeParse({
    originalFilename: params.originalFilename,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });
  if (!parsed.success) return {ok: false, error: "INVALID_REQUEST"};

  const replacementId = crypto.randomUUID();
  const safeSuffix = buildSafeFilenameSuffix(parsed.data.originalFilename);
  const newStorageKey = buildReplacementStorageKey({
    userId: params.userId,
    projectId: project.id,
    imageId: image.id,
    replacementId,
    safeFilenameSuffix: safeSuffix,
  });
  const ttlSeconds = getR2SignedUrlTtlSeconds();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const quotaReserve = await reserveReplacementUpload({
    userId: params.userId,
    projectId: project.id,
    replacementId,
    imageId: image.id,
    declaredBytes: parsed.data.sizeBytes,
    expiresAt,
  });

  if (!quotaReserve.ok) {
    const quotaError = quotaReserve.error;
    if (
      quotaError === "INSUFFICIENT_STORAGE_FOR_REPLACEMENT" ||
      quotaError === "PROJECT_STORAGE_LIMIT_REACHED" ||
      quotaError === "FILE_SIZE_LIMIT_EXCEEDED" ||
      quotaError === "UPLOAD_REJECTED_BY_QUOTA"
    ) {
      return {ok: false, error: quotaError};
    }
    if (quotaError === "PROJECT_NOT_FOUND") return {ok: false, error: "PROJECT_NOT_FOUND"};
    return {ok: false, error: "STORAGE_UNAVAILABLE"};
  }

  try {
    await insertReplacementCandidate({
      id: replacementId,
      imageId: image.id,
      projectId: project.id,
      createdBy: params.userId,
      status: "pending",
      newStorageKey,
      newOriginalFilename: parsed.data.originalFilename.trim(),
      newDeclaredMime: parsed.data.mimeType.toLowerCase(),
      newFileExtension: getExtension(parsed.data.originalFilename),
      newDeclaredSizeBytes: parsed.data.sizeBytes,
      uploadExpiresAt: expiresAt,
      attemptCount: 1,
    });
  } catch {
    await releaseReservation({
      projectId: project.id,
      reservationId: quotaReserve.reservationId,
      reason: "cancelled",
    }).catch(() => {
      console.error("[quota] release replacement reservation after insert failure");
    });
    // Unique open-replacement index race
    return {ok: false, error: "REPLACEMENT_ALREADY_ACTIVE"};
  }

  await onReplacementStartedDemoteReady({
    projectId: project.id,
    imageId: image.id,
  }).catch(() => {
    console.error("[ready] demote on replacement start failed");
  });

  await onReplacementInvalidateProcessing({
    projectId: project.id,
    imageId: image.id,
  }).catch(() => {
    console.error("[processing] invalidate on replacement start failed");
  });

  await onImageInvalidateBulkItems({
    projectId: project.id,
    imageId: image.id,
    reason: "SOURCE_REVISION_CHANGED",
  }).catch(() => {
    console.error("[bulk] invalidate on replacement start failed");
  });

  const {onImageInvalidateMetadata} = await import("@/server/images/ai-metadata-service");
  await onImageInvalidateMetadata({
    projectId: project.id,
    imageId: image.id,
    reason: "IMAGE_SOURCE_CHANGED",
  }).catch(() => {
    console.error("[metadata] invalidate on replacement start failed");
  });

  await markReplacementUploading(replacementId, project.id);

  try {
    const storage = await getObjectStorageProvider();
    const target = await storage.createUploadTarget({
      projectId: project.id,
      userId: params.userId,
      imageId: image.id,
      mimeType: parsed.data.mimeType.toLowerCase(),
      sizeBytes: parsed.data.sizeBytes,
      originalFilename: parsed.data.originalFilename,
      storageKey: newStorageKey,
    });
    return {
      ok: true,
      replacementId,
      imageId: image.id,
      method: "PUT",
      uploadUrl: target.uploadUrl,
      headers: target.headers,
      expiresAt: target.expiresAt.toISOString(),
    };
  } catch (error) {
    await releaseReservation({
      projectId: project.id,
      reservationId: quotaReserve.reservationId,
      reason: "cancelled",
    }).catch(() => {
      console.error("[quota] release replacement reservation after presign failure");
    });
    if (error instanceof StorageNotConfiguredError) {
      return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
    }
    console.error("[images] replacement authorize failed");
    return {ok: false, error: "STORAGE_UNAVAILABLE"};
  }
}

export type ConfirmReplacementResult =
  | {ok: true; replacementId: string; status: "uploaded"; idempotent?: boolean}
  | {ok: false; error: SafeLifecycleErrorCode};

export async function confirmOwnedReplacementUpload(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<ConfirmReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const replacement = await getOwnedReplacement(params.userId, project.id, params.replacementId);
  if (!replacement || replacement.imageId !== params.imageId) {
    return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  }

  if (replacement.status === "uploaded" || replacement.status === "validating" || replacement.status === "validated") {
    return {ok: true, replacementId: replacement.id, status: "uploaded", idempotent: true};
  }

  if (replacement.status !== "pending" && replacement.status !== "uploading") {
    return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
  }

  if (replacement.uploadExpiresAt && replacement.uploadExpiresAt.getTime() < Date.now()) {
    await markReplacementValidationFailed(replacement.id, project.id, "UPLOAD_EXPIRED");
    return {ok: false, error: "UPLOAD_EXPIRED"};
  }

  const storage = await getObjectStorageProvider();
  try {
    const meta = await storage.readObjectMetadata(replacement.newStorageKey);
    if (!meta) return {ok: false, error: "OBJECT_NOT_FOUND"};
    if (meta.sizeBytes <= 0 || meta.sizeBytes !== replacement.newDeclaredSizeBytes) {
      try {
        await storage.deleteObject(replacement.newStorageKey);
      } catch {
        console.error("[images] replacement size-mismatch cleanup failed");
      }
      await markReplacementValidationFailed(replacement.id, project.id, "OBJECT_SIZE_MISMATCH");
      return {ok: false, error: "OBJECT_SIZE_MISMATCH"};
    }
    if (meta.sizeBytes > MAX_BYTES_PER_IMAGE) {
      try {
        await storage.deleteObject(replacement.newStorageKey);
      } catch {
        /* ignore */
      }
      await markReplacementValidationFailed(replacement.id, project.id, "OBJECT_TOO_LARGE");
      return {ok: false, error: "OBJECT_TOO_LARGE"};
    }

    const quotaConsume = await consumeReplacementReservation({
      projectId: project.id,
      replacementId: replacement.id,
      imageId: replacement.imageId,
      trustedBytes: meta.sizeBytes,
    });
    if (!quotaConsume.ok) {
      try {
        await storage.deleteObject(replacement.newStorageKey);
      } catch {
        console.error("[images] replacement quota-rejected cleanup failed");
      }
      await markReplacementValidationFailed(replacement.id, project.id, quotaConsume.error);
      if (
        quotaConsume.error === "UPLOAD_REJECTED_BY_QUOTA" ||
        quotaConsume.error === "INSUFFICIENT_STORAGE_FOR_REPLACEMENT" ||
        quotaConsume.error === "PROJECT_STORAGE_LIMIT_REACHED"
      ) {
        return {ok: false, error: quotaConsume.error};
      }
      return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
    }

    const updated = await markReplacementUploaded(replacement.id, project.id, {
      byteSize: meta.sizeBytes,
      etag: meta.etag,
      contentType: meta.contentType,
    });
    if (!updated) return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
    return {ok: true, replacementId: replacement.id, status: "uploaded"};
  } catch (error) {
    if (error instanceof StorageDomainError) {
      return {ok: false, error: error.code as SafeLifecycleErrorCode};
    }
    console.error("[images] replacement confirm failed");
    return {ok: false, error: "CONFIRMATION_FAILED"};
  }
}

export type ValidateReplacementResult =
  | {
      ok: true;
      replacementId: string;
      status: "validated" | "validating";
      idempotent?: boolean;
      inProgress?: boolean;
      width?: number | null;
      height?: number | null;
      detectedMimeType?: string | null;
      validationVersion?: string | null;
      fullDecodePerformed?: boolean;
    }
  | {ok: false; error: SafeLifecycleErrorCode; failureCode?: string};

export async function validateOwnedReplacement(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<ValidateReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const image = await getOwnedImageRow(params.userId, project.id, params.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }

  const acquired = await acquireReplacementValidation(
    params.userId,
    project.id,
    params.replacementId,
  );

  if (acquired.kind === "not_found") return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  if (acquired.kind === "idempotent") {
    return {
      ok: true,
      replacementId: acquired.replacement.id,
      status: "validated",
      idempotent: true,
      width: acquired.replacement.newWidth,
      height: acquired.replacement.newHeight,
      detectedMimeType: acquired.replacement.newDetectedMime,
      validationVersion: acquired.replacement.validationVersion,
      fullDecodePerformed: true,
    };
  }
  if (acquired.kind === "in_progress") {
    return {
      ok: true,
      replacementId: acquired.replacement.id,
      status: "validating",
      inProgress: true,
    };
  }
  if (acquired.kind === "invalid_state") {
    return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
  }
  if (acquired.replacement.imageId !== params.imageId) {
    return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  }

  const replacement = acquired.replacement;
  const storage = await getObjectStorageProvider();

  try {
    const obj = await storage.getObjectBuffer(replacement.newStorageKey, MAX_BYTES_PER_IMAGE);
    const inspection = await inspectAndFullyDecodeImage(obj.body);
    const mimeCheck = compareDeclaredVersusDetected({
      declaredMime: replacement.newDeclaredMime,
      fileExtension: replacement.newFileExtension,
      storageContentType: replacement.newStorageContentType,
      detectedFormat: inspection.format,
      detectedMime: inspection.mimeType,
    });
    if (!mimeCheck.ok) {
      await markReplacementValidationFailed(replacement.id, project.id, mimeCheck.code);
      return {
        ok: false,
        error: "REPLACEMENT_VALIDATION_FAILED",
        failureCode: mimeCheck.code,
      };
    }

    const updated = await markReplacementValidated(replacement.id, project.id, inspection);
    if (!updated) return {ok: false, error: "REPLACEMENT_INVALID_STATE"};

    return {
      ok: true,
      replacementId: replacement.id,
      status: "validated",
      width: inspection.width,
      height: inspection.height,
      detectedMimeType: inspection.mimeType,
      validationVersion: IMAGE_VALIDATION_VERSION,
      fullDecodePerformed: true,
    };
  } catch (error) {
    const code =
      error instanceof ValidationDomainError
        ? error.code
        : error instanceof StorageDomainError
          ? error.code
          : "DECODE_FAILED";
    await markReplacementValidationFailed(replacement.id, project.id, code);
    return {ok: false, error: "REPLACEMENT_VALIDATION_FAILED", failureCode: code};
  }
}

export type PromoteReplacementResult =
  | {
      ok: true;
      imageId: string;
      replacementId: string;
      status: "complete" | "old_storage_cleanup_failed" | "promoted";
      cleanupPending?: boolean;
    }
  | {ok: false; error: SafeLifecycleErrorCode};

async function cleanupOldObject(params: {
  replacementId: string;
  projectId: string;
  oldStorageKey: string;
  activeStorageKey: string;
  oldTrustedBytes: number;
}): Promise<{
  status: "complete" | "old_storage_cleanup_failed";
  cleanupPending?: boolean;
}> {
  if (params.oldStorageKey === params.activeStorageKey) {
    await markOldStorageCleanupFailed(params.replacementId, "STORAGE_CLEANUP_FAILED");
    return {status: "old_storage_cleanup_failed", cleanupPending: true};
  }

  await markOldStorageDeleting(params.replacementId);
  const storage = await getObjectStorageProvider();
  try {
    await storage.deleteObject(params.oldStorageKey);
    const exists = await storage.objectExists(params.oldStorageKey);
    if (exists) {
      await markOldStorageCleanupFailed(params.replacementId, "STORAGE_CLEANUP_FAILED");
      return {status: "old_storage_cleanup_failed", cleanupPending: true};
    }
    await markReplacementComplete(params.replacementId);
    await onOldObjectCleanupSuccess({
      projectId: params.projectId,
      bytes: params.oldTrustedBytes,
    }).catch(() => {
      console.error("[quota] onOldObjectCleanupSuccess failed");
    });
    return {status: "complete"};
  } catch {
    console.error("[images] old storage cleanup failed");
    await markOldStorageCleanupFailed(params.replacementId, "STORAGE_CLEANUP_FAILED");
    return {status: "old_storage_cleanup_failed", cleanupPending: true};
  }
}

export async function promoteOwnedReplacement(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<PromoteReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const promoted = await promoteReplacementInTransaction({
    userId: params.userId,
    projectId: project.id,
    imageId: params.imageId,
    replacementId: params.replacementId,
  });

  if (!promoted.ok) {
    if (promoted.error === "not_found") return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
    if (promoted.error === "not_ready") return {ok: false, error: "REPLACEMENT_NOT_READY"};
    return {ok: false, error: "REPLACEMENT_PROMOTION_CONFLICT"};
  }

  const newTrustedBytes =
    promoted.replacement.newByteSize ?? promoted.replacement.newDeclaredSizeBytes;
  const oldTrustedBytes = promoted.oldTrustedBytes;

  await onReplacementPromoted({
    projectId: project.id,
    newTrustedBytes,
    oldTrustedBytes,
  }).catch(() => {
    console.error("[quota] onReplacementPromoted failed");
  });

  await onReplacementPromotedEvaluateReady({
    userId: params.userId,
    projectId: project.id,
    imageId: params.imageId,
  });

  const cleanup = await cleanupOldObject({
    replacementId: promoted.replacement.id,
    projectId: project.id,
    oldStorageKey: promoted.oldStorageKey,
    activeStorageKey: promoted.image.storageKey,
    oldTrustedBytes,
  });

  return {
    ok: true,
    imageId: promoted.image.id,
    replacementId: promoted.replacement.id,
    status: cleanup.status === "complete" ? "complete" : "old_storage_cleanup_failed",
    cleanupPending: cleanup.cleanupPending,
  };
}

export async function retryOldStorageCleanup(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<PromoteReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const replacement = await getOwnedReplacement(params.userId, project.id, params.replacementId);
  if (!replacement || replacement.imageId !== params.imageId) {
    return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  }
  if (
    replacement.status !== "old_storage_cleanup_failed" &&
    replacement.status !== "promoted" &&
    replacement.status !== "old_storage_deleting"
  ) {
    return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
  }
  if (!replacement.oldStorageKey) return {ok: false, error: "REPLACEMENT_INVALID_STATE"};

  const image = await getOwnedImageRow(params.userId, project.id, params.imageId);
  if (!image) return {ok: false, error: "IMAGE_NOT_FOUND"};
  if (replacement.oldStorageKey === image.storageKey) {
    return {ok: false, error: "STORAGE_CLEANUP_FAILED"};
  }

  const oldTrustedBytes =
    replacement.oldByteSize ?? replacement.newDeclaredSizeBytes;

  const cleanup = await cleanupOldObject({
    replacementId: replacement.id,
    projectId: project.id,
    oldStorageKey: replacement.oldStorageKey,
    activeStorageKey: image.storageKey,
    oldTrustedBytes,
  });

  return {
    ok: true,
    imageId: image.id,
    replacementId: replacement.id,
    status: cleanup.status === "complete" ? "complete" : "old_storage_cleanup_failed",
    cleanupPending: cleanup.cleanupPending,
  };
}

export type CancelReplacementResult =
  | {ok: true; replacementId: string; status: "cancelled" | "cancel_cleanup_failed"; idempotent?: boolean}
  | {ok: false; error: SafeLifecycleErrorCode};

export async function cancelOwnedReplacement(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
}): Promise<CancelReplacementResult> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "images.replace");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const acquired = await acquireReplacementCancellation(
    params.userId,
    project.id,
    params.replacementId,
  );
  if (acquired.kind === "not_found") return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  if (acquired.kind === "invalid_state") return {ok: false, error: "REPLACEMENT_INVALID_STATE"};
  if (acquired.replacement.imageId !== params.imageId) {
    return {ok: false, error: "REPLACEMENT_NOT_FOUND"};
  }
  if (acquired.kind === "already_cancelled" && acquired.replacement.candidateDeletedAt) {
    return {
      ok: true,
      replacementId: acquired.replacement.id,
      status: "cancelled",
      idempotent: true,
    };
  }

  const replacement = acquired.replacement;
  const candidateBytes = replacement.newByteSize ?? replacement.newDeclaredSizeBytes;

  if (replacement.status === "pending" || replacement.status === "uploading") {
    const reservation = await getReservationByReplacementId(project.id, replacement.id);
    if (reservation) {
      await releaseReservation({
        projectId: project.id,
        reservationId: reservation.id,
        reason: "cancelled",
      }).catch(() => {
        console.error("[quota] release replacement reservation on cancel failed");
      });
    }
  }

  const storage = await getObjectStorageProvider();
  try {
    await storage.deleteObject(replacement.newStorageKey);
    await markCandidateObjectDeleted(replacement.id);

    if (replacement.status !== "pending" && replacement.status !== "uploading") {
      await onCandidateCleanupSuccess({
        projectId: project.id,
        bytes: candidateBytes,
      }).catch(() => {
        console.error("[quota] onCandidateCleanupSuccess failed");
      });
    }

    return {ok: true, replacementId: replacement.id, status: "cancelled"};
  } catch {
    console.error("[images] candidate cancel cleanup failed");
    await markCancelCleanupFailed(replacement.id, "STORAGE_CLEANUP_FAILED");
    return {
      ok: true,
      replacementId: replacement.id,
      status: "cancel_cleanup_failed",
    };
  }
}

/** Public DTO — never includes storage keys. */
export function toReplacementClientDto(row: {
  id: string;
  imageId: string;
  status: string;
  newOriginalFilename: string;
  newDeclaredMime: string;
  newDetectedMime: string | null;
  newDetectedFormat: string | null;
  newByteSize: number | null;
  newWidth: number | null;
  newHeight: number | null;
  newPixelCount: number | null;
  newAnimated: boolean | null;
  newFrameCount: number | null;
  failureCode: string | null;
  validatedAt: Date | null;
  promotedAt: Date | null;
}) {
  return {
    id: row.id,
    imageId: row.imageId,
    status: row.status,
    originalFilename: row.newOriginalFilename,
    declaredMime: row.newDeclaredMime,
    detectedMime: row.newDetectedMime,
    detectedFormat: row.newDetectedFormat,
    byteSize: row.newByteSize,
    width: row.newWidth,
    height: row.newHeight,
    pixelCount: row.newPixelCount,
    isAnimated: row.newAnimated,
    frameCount: row.newFrameCount,
    failureCode: row.failureCode,
    validatedAt: row.validatedAt?.toISOString() ?? null,
    promotedAt: row.promotedAt?.toISOString() ?? null,
  };
}
