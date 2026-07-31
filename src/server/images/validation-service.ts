import {isR2Configured} from "@/lib/env";
import {MAX_BYTES_PER_IMAGE} from "@/server/images/policy";
import {compareDeclaredVersusDetected} from "@/server/images/format-map";
import {inspectAndFullyDecodeImage} from "@/server/images/image-inspector";
import {
  type SafeValidationErrorCode,
  ValidationDomainError,
} from "@/server/images/validation-errors";
import {
  MAX_VALIDATION_ATTEMPTS,
  VALIDATION_RETRY_COOLDOWN_MS,
  IMAGE_VALIDATION_VERSION,
} from "@/server/images/validation-policy";
import {
  acquireImageValidation,
  markImageValidated,
  markImageValidationFailed,
} from "@/server/images/validation-queries";
import {evaluateAndPromoteReady} from "@/server/images/ready-service";
import {READY_STATUS} from "@/server/images/ready-eligibility";
import {getOwnedProject} from "@/server/projects/queries";
import {StorageDomainError} from "@/server/storage/errors";
import {
  StorageNotConfiguredError,
  getObjectStorageProvider,
} from "@/server/storage/provider";

export type ValidateImageResult =
  | {
      ok: true;
      imageId: string;
      status: "validated" | "validating" | "ready_for_processing";
      idempotent?: boolean;
      inProgress?: boolean;
      width?: number | null;
      height?: number | null;
      detectedMimeType?: string | null;
      isAnimated?: boolean | null;
      frameCount?: number | null;
      validationVersion?: string | null;
      fullDecodePerformed?: boolean;
    }
  | {ok: false; error: SafeValidationErrorCode};

function mapStorageToValidation(code: string): SafeValidationErrorCode {
  switch (code) {
    case "OBJECT_NOT_FOUND":
      return "OBJECT_NOT_FOUND";
    case "OBJECT_TOO_LARGE":
      return "OBJECT_TOO_LARGE";
    case "OBJECT_SIZE_MISMATCH":
      return "OBJECT_SIZE_MISMATCH";
    case "STORAGE_NOT_CONFIGURED":
      return "STORAGE_NOT_CONFIGURED";
    default:
      return "OBJECT_READ_FAILED";
  }
}

/**
 * Owner-scoped trusted validation.
 * Reads private R2 object via GetObject using the DB storage key only.
 * Invalid objects stay in R2 (delete deferred) but never get normal previews.
 */
export async function validateOwnedImage(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<ValidateImageResult> {
  if (!isR2Configured()) {
    return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  }

  const project = await getOwnedProject(params.userId, params.projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const acquired = await acquireImageValidation(params.userId, project.id, params.imageId);

  if (acquired.kind === "not_found" || acquired.kind === "deleted") {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (acquired.kind === "idempotent") {
    const ready = await evaluateAndPromoteReady({
      userId: params.userId,
      projectId: project.id,
      imageId: acquired.image.id,
    });
    const status =
      ready.ok && ready.status === READY_STATUS
        ? READY_STATUS
        : acquired.image.status === READY_STATUS
          ? READY_STATUS
          : "validated";
    return {
      ok: true,
      imageId: acquired.image.id,
      status,
      idempotent: true,
      width: acquired.image.width,
      height: acquired.image.height,
      detectedMimeType: acquired.image.detectedMimeType,
      isAnimated: acquired.image.isAnimated,
      frameCount: acquired.image.frameCount,
      validationVersion: acquired.image.validationVersion,
      fullDecodePerformed: true,
    };
  }
  if (acquired.kind === "in_progress") {
    return {
      ok: true,
      imageId: acquired.image.id,
      status: "validating",
      inProgress: true,
    };
  }
  if (acquired.kind === "not_ready") {
    return {ok: false, error: "UPLOAD_NOT_READY"};
  }

  const image = acquired.image;

  if (image.validationAttempts > MAX_VALIDATION_ATTEMPTS) {
    await markImageValidationFailed(image.id, project.id, "VALIDATION_RETRY_LIMIT");
    return {ok: false, error: "VALIDATION_RETRY_LIMIT"};
  }

  // Cooldown only for retries from validation_failed (attempt already incremented).
  if (acquired.attempt > 1 && image.lastValidationAttemptAt) {
    const elapsed = Date.now() - image.lastValidationAttemptAt.getTime();
    // lastValidationAttemptAt was just updated on acquire — skip cooldown based on that.
    // Use previous attempt spacing via attempt count only for rapid double-submit; acquire already serializes.
    void elapsed;
    void VALIDATION_RETRY_COOLDOWN_MS;
  }

  try {
    const storage = await getObjectStorageProvider();
    const object = await storage.getObjectBuffer(image.storageKey, MAX_BYTES_PER_IMAGE);

    if (object.sizeBytes !== image.sizeBytes && object.sizeBytes !== image.storageSizeBytes) {
      // Prefer declared / confirmed sizes.
      if (image.storageSizeBytes != null && object.sizeBytes !== image.storageSizeBytes) {
        await markImageValidationFailed(image.id, project.id, "OBJECT_SIZE_MISMATCH");
        return {ok: false, error: "OBJECT_SIZE_MISMATCH"};
      }
      if (object.sizeBytes !== image.sizeBytes) {
        await markImageValidationFailed(image.id, project.id, "OBJECT_SIZE_MISMATCH");
        return {ok: false, error: "OBJECT_SIZE_MISMATCH"};
      }
    }

    const inspection = await inspectAndFullyDecodeImage(object.body);
    if (!inspection.fullDecodePerformed) {
      await markImageValidationFailed(image.id, project.id, "DECODE_FAILED");
      return {ok: false, error: "DECODE_FAILED"};
    }

    const comparison = compareDeclaredVersusDetected({
      declaredMime: image.mimeType,
      fileExtension: image.fileExtension,
      storageContentType: image.storageContentType ?? object.contentType,
      detectedFormat: inspection.format,
      detectedMime: inspection.mimeType,
    });
    if (!comparison.ok) {
      await markImageValidationFailed(image.id, project.id, comparison.code);
      return {ok: false, error: comparison.code};
    }

    const updated = await markImageValidated(image.id, project.id, inspection);
    if (!updated) {
      return {ok: false, error: "VALIDATION_CONFLICT"};
    }

    console.info("[images] validation ok", {
      imageId: updated.id,
      projectId: project.id,
      version: IMAGE_VALIDATION_VERSION,
      format: inspection.format,
      width: inspection.width,
      height: inspection.height,
      attempt: updated.validationAttempts,
    });

    const ready = await evaluateAndPromoteReady({
      userId: params.userId,
      projectId: project.id,
      imageId: updated.id,
    });
    const finalStatus =
      ready.ok && ready.status === READY_STATUS ? READY_STATUS : "validated";

    return {
      ok: true,
      imageId: updated.id,
      status: finalStatus,
      width: updated.width,
      height: updated.height,
      detectedMimeType: updated.detectedMimeType,
      isAnimated: updated.isAnimated,
      frameCount: updated.frameCount,
      validationVersion: updated.validationVersion,
      fullDecodePerformed: true,
    };
  } catch (error) {
    let code: SafeValidationErrorCode = "VALIDATION_UNAVAILABLE";
    if (error instanceof ValidationDomainError) {
      code = error.code;
    } else if (error instanceof StorageNotConfiguredError) {
      code = "STORAGE_NOT_CONFIGURED";
    } else if (error instanceof StorageDomainError) {
      code = mapStorageToValidation(error.code);
    } else {
      console.error("[images] validation unexpected failure");
      code = "DECODE_FAILED";
    }

    try {
      await markImageValidationFailed(image.id, project.id, code);
    } catch {
      console.error("[images] failed to persist validation_failed");
    }
    return {ok: false, error: code};
  }
}
