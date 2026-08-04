/**
 * Single-image processing service.
 * Create/enqueue via API; execute via worker (Prompt 16) reusing this engine.
 * Original R2 object is never overwritten.
 */
import {eq, sql, and, inArray, desc} from "drizzle-orm";
import {getDb} from "@/db";
import {processingJobs, type ProcessingJob} from "@/db/schema";
import {isR2Configured, getR2SignedUrlTtlSeconds} from "@/lib/env";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import {imageHasOpenReplacement} from "@/server/images/ready-queries";
import {READY_STATUS, evaluateReadyEligibility} from "@/server/images/ready-eligibility";
import {ProcessingDomainError, type SafeProcessingErrorCode} from "@/server/images/processing-errors";
import {optimizeSameFormat, resizeSameFormat, convertFormat} from "@/server/images/processing-optimizer";
import {
  MAX_ACTIVE_JOBS_PER_PROJECT,
  MAX_OUTPUT_BYTES,
  MAX_PROCESSING_ATTEMPTS,
  MAX_SOURCE_BYTES_FOR_PROCESSING,
  MAX_SOURCE_PIXELS_FOR_PROCESSING,
  PROCESSING_OPERATION,
  estimateDecodedMemoryBytes,
  getProcessingPolicy,
  isProcessingSourceFormat,
  MAX_DECODED_MEMORY_ESTIMATE_BYTES,
} from "@/server/images/processing-policy";
import {
  RESIZE_OPERATION,
  isResizePresetId,
  type ResizePresetId,
  getResizePolicy,
} from "@/server/images/resize-policy";
import {
  CONVERT_OPERATION,
  conversionPresetForTarget,
  getConversionPolicy,
  isConversionAllowed,
  isConversionTargetFormat,
  targetFromConversionPreset,
  type ConversionTargetFormat,
} from "@/server/images/conversion-policy";
import {
  ACTIVE_JOB_STATUSES,
  acquireQueuedJob,
  findActiveJobForImage,
  findJobByIdempotencyKey,
  getActiveDerivativeForImage,
  getDerivativeForJob,
  getOwnedImageForProcessing,
  getOwnedProcessingJob,
  insertDerivative,
  insertProcessingJob,
  listActiveDerivativesForImage,
  listJobsForImage,
  markActiveJobsStaleForImage,
  markDerivativesStaleForImage,
  updateDerivative,
  updateProcessingJob,
} from "@/server/images/processing-queries";
import {getOwnedProject} from "@/server/projects/queries";
import {ensureProjectQuotaState, getProjectQuotaState, bumpQuotaState} from "@/server/images/quota-queries";
import {buildDerivativeStorageKey} from "@/server/storage/keys";
import {StorageDomainError} from "@/server/storage/errors";
import {StorageNotConfiguredError, getObjectStorageProvider} from "@/server/storage/provider";

export type ProcessingOperation =
  | typeof PROCESSING_OPERATION
  | typeof RESIZE_OPERATION
  | typeof CONVERT_OPERATION
  | "generate_metadata";

function derivativeKindForOperation(
  operation: ProcessingOperation,
): "optimized_same_format" | "resized" | "converted" {
  if (operation === RESIZE_OPERATION) return "resized";
  if (operation === CONVERT_OPERATION) return "converted";
  return "optimized_same_format";
}

export type ProcessingJobDto = {
  id: string;
  imageId: string;
  projectId: string;
  operation: string;
  preset: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  sourceByteSize: number;
  sourceDetectedFormat: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  outputByteSize: number | null;
  outputDetectedFormat: string | null;
  outputWidth: number | null;
  outputHeight: number | null;
  outputChecksum: string | null;
  processingDurationMs: number | null;
  byteDifference: number | null;
  percentDifference: number | null;
  lastErrorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

function toJobDto(job: ProcessingJob): ProcessingJobDto {
  const byteDifference =
    job.outputByteSize != null ? job.outputByteSize - job.sourceByteSize : null;
  const percentDifference =
    byteDifference != null && job.sourceByteSize > 0
      ? Math.round((byteDifference / job.sourceByteSize) * 10_000) / 100
      : null;

  return {
    id: job.id,
    imageId: job.imageId,
    projectId: job.projectId,
    operation: job.operation,
    preset: job.preset ?? null,
    status: job.status,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    sourceByteSize: job.sourceByteSize,
    sourceDetectedFormat: job.sourceDetectedFormat,
    sourceWidth: job.sourceWidth,
    sourceHeight: job.sourceHeight,
    outputByteSize: job.outputByteSize,
    outputDetectedFormat: job.outputDetectedFormat,
    outputWidth: job.outputWidth,
    outputHeight: job.outputHeight,
    outputChecksum: job.outputChecksum ?? null,
    processingDurationMs: job.processingDurationMs ?? null,
    byteDifference,
    percentDifference,
    lastErrorCode: job.lastErrorCode,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

async function countActiveProjectJobs(projectId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(processingJobs)
    .where(
      and(
        eq(processingJobs.projectId, projectId),
        inArray(processingJobs.status, [...ACTIVE_JOB_STATUSES]),
      ),
    );
  return Number(row?.count ?? 0);
}

export async function createProcessingJob(params: {
  userId: string;
  projectId: string;
  imageId: string;
  idempotencyKey?: string;
  operation?: ProcessingOperation;
  preset?: string | null;
}): Promise<{ok: true; job: ProcessingJobDto} | {ok: false; error: SafeProcessingErrorCode}> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const operation: ProcessingOperation = params.operation ?? PROCESSING_OPERATION;
  let preset: string | null = null;
  if (operation === RESIZE_OPERATION) {
    if (!isResizePresetId(params.preset)) {
      return {ok: false, error: "INVALID_REQUEST"};
    }
    preset = params.preset;
  } else if (operation === CONVERT_OPERATION) {
    // Accept either raw target format (webp) or preset form (to_webp).
    const target =
      targetFromConversionPreset(params.preset) ??
      (isConversionTargetFormat(params.preset) ? params.preset : null);
    if (!target) return {ok: false, error: "INVALID_REQUEST"};
    preset = conversionPresetForTarget(target);
  } else if (params.preset != null) {
    return {ok: false, error: "INVALID_REQUEST"};
  }

  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const {resolveEntitlementUserIdForProject} = await import("@/server/organizations/access");
  const {assertMonthlyAllowance, getProjectQuotaLimitsForUser} = await import(
    "@/server/billing/entitlements"
  );
  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const allowance = await assertMonthlyAllowance(entitlementUserId, "processing");
  if (!allowance.ok) {
    return {
      ok: false,
      error:
        allowance.error === "FEATURE_NOT_INCLUDED"
          ? "FEATURE_NOT_INCLUDED"
          : allowance.error === "SUBSCRIPTION_RESTRICTED"
            ? "SUBSCRIPTION_RESTRICTED"
            : "PROCESSING_LIMIT_REACHED",
    };
  }
  const planLimits = await getProjectQuotaLimitsForUser(entitlementUserId);
  const maxGenerated = planLimits.maxGeneratedStorageBytes;

  if (params.idempotencyKey) {
    const existing = await findJobByIdempotencyKey(project.id, params.idempotencyKey);
    if (existing) return {ok: true, job: toJobDto(existing)};
  }

  const image = await getOwnedImageForProcessing(params.userId, project.id, params.imageId);
  if (!image) return {ok: false, error: "IMAGE_NOT_FOUND"};
  if (image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (image.status !== READY_STATUS) return {ok: false, error: "IMAGE_NOT_READY"};

  const openReplacement = await imageHasOpenReplacement(image.id, project.id);
  const eligibility = evaluateReadyEligibility({
    ...image,
    hasOpenReplacement: openReplacement,
    projectExists: true,
    ownerExists: true,
  });
  if (!eligibility.eligible) return {ok: false, error: "IMAGE_NOT_READY"};

  if (!image.storageKey) return {ok: false, error: "IMAGE_NOT_READY"};
  if (!isProcessingSourceFormat(image.detectedFormat)) {
    return {ok: false, error: "SOURCE_FORMAT_UNSUPPORTED"};
  }
  if (image.isAnimated) return {ok: false, error: "SOURCE_ANIMATION_UNSUPPORTED"};

  if (operation === CONVERT_OPERATION) {
    const target = targetFromConversionPreset(preset);
    if (!target || !isConversionAllowed(image.detectedFormat, target)) {
      return {ok: false, error: "CONVERSION_UNSUPPORTED"};
    }
  }
  const sourceBytes = image.storageSizeBytes ?? image.sizeBytes;
  if (sourceBytes > MAX_SOURCE_BYTES_FOR_PROCESSING) {
    return {ok: false, error: "SOURCE_SIZE_LIMIT_EXCEEDED"};
  }
  if (image.pixelCount != null && image.pixelCount > MAX_SOURCE_PIXELS_FOR_PROCESSING) {
    return {ok: false, error: "SOURCE_PIXEL_LIMIT_EXCEEDED"};
  }
  if (
    image.width != null &&
    image.height != null &&
    estimateDecodedMemoryBytes(image.width, image.height) > MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    return {ok: false, error: "SOURCE_PIXEL_LIMIT_EXCEEDED"};
  }

  const active = await findActiveJobForImage(image.id, project.id, {
    operation,
    preset,
  });
  if (active) return {ok: false, error: "PROCESSING_JOB_CONFLICT"};

  // Return existing completed derivative job for same op/preset/source revision (no duplicate).
  const existingDeriv = await getActiveDerivativeForImage(image.id, project.id, {
    kind: derivativeKindForOperation(operation),
    preset,
  });
  if (existingDeriv) {
    if (existingDeriv.sourceStorageKey === image.storageKey) {
      const existingJob = await getOwnedProcessingJob(
        params.userId,
        project.id,
        existingDeriv.processingJobId,
      );
      if (existingJob?.status === "completed") {
        return {ok: true, job: toJobDto(existingJob)};
      }
    }
    return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
  }

  const activeCount = await countActiveProjectJobs(project.id);
  if (activeCount >= MAX_ACTIVE_JOBS_PER_PROJECT) {
    return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
  }

  await ensureProjectQuotaState(project.id);
  const quota = await getProjectQuotaState(project.id);
  if (quota?.inconsistencyFlag) return {ok: false, error: "OUTPUT_QUOTA_EXCEEDED"};
  const generated =
    (quota?.generatedOutputBytes ?? 0) + (quota?.reservedGeneratedBytes ?? 0);
  const reserveBytes = Math.min(sourceBytes, MAX_OUTPUT_BYTES);
  if (generated + reserveBytes > maxGenerated) {
    return {ok: false, error: "OUTPUT_QUOTA_EXCEEDED"};
  }

  try {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: reserveBytes});
  } catch {
    return {ok: false, error: "OUTPUT_QUOTA_EXCEEDED"};
  }

  try {
    const job = await insertProcessingJob({
      id: crypto.randomUUID(),
      projectId: project.id,
      imageId: image.id,
      createdBy: params.userId,
      operation,
      preset,
      status: "queued",
      sourceStorageKey: image.storageKey,
      sourceByteSize: sourceBytes,
      sourceDetectedFormat: image.detectedFormat,
      sourceMimeType: image.detectedMimeType ?? image.mimeType,
      sourceWidth: image.width,
      sourceHeight: image.height,
      sourceEtag: image.etag,
      attemptCount: 0,
      maxAttempts: MAX_PROCESSING_ATTEMPTS,
      idempotencyKey: params.idempotencyKey ?? null,
    });
    return {ok: true, job: toJobDto(job)};
  } catch {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
  }
}

export async function executeProcessingJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
  /** Prompt 16 — worker that already claimed this job via SKIP LOCKED lease. */
  workerId?: string;
  alreadyClaimed?: boolean;
}): Promise<{ok: true; job: ProcessingJobDto} | {ok: false; error: SafeProcessingErrorCode}> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const existing = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  if (!existing) return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  if (existing.status === "completed") {
    return {ok: true, job: toJobDto(existing)};
  }
  if (existing.status === "cancelled") return {ok: false, error: "PROCESSING_JOB_CANCELLED"};
  if (existing.status === "stale") return {ok: false, error: "PROCESSING_JOB_STALE"};
  if (existing.attemptCount >= existing.maxAttempts && existing.status === "failed") {
    return {ok: false, error: "PROCESSING_RETRY_LIMIT_REACHED"};
  }

  let acquired: ProcessingJob | null = null;
  if (params.alreadyClaimed) {
    if (
      !params.workerId ||
      existing.leaseOwner !== params.workerId ||
      !["processing", "uploading_output", "verifying_output"].includes(existing.status)
    ) {
      return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
    }
    acquired = existing;
  } else {
    acquired = await acquireQueuedJob(existing.id, project.id, params.workerId);
  }
  if (!acquired) {
    const again = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
    if (again?.status === "completed") return {ok: true, job: toJobDto(again)};
    if (again && (ACTIVE_JOB_STATUSES as readonly string[]).includes(again.status)) {
      return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
    }
    return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
  }

  const isMetadata = acquired.operation === "generate_metadata";
  const reserveBytes = isMetadata
    ? 0
    : Math.min(acquired.sourceByteSize, MAX_OUTPUT_BYTES);
  const startedMs = Date.now();

  if (acquired.attemptCount > acquired.maxAttempts) {
    if (reserveBytes > 0) {
      await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(
        () => undefined,
      );
    }
    await updateProcessingJob(acquired.id, project.id, {
      status: "failed",
      failedAt: new Date(),
      lastErrorCode: "PROCESSING_RETRY_LIMIT_REACHED",
      lastErrorMessageSafe: "PROCESSING_RETRY_LIMIT_REACHED",
    });
    return {ok: false, error: "PROCESSING_RETRY_LIMIT_REACHED"};
  }

  // Prompt 17 — AI metadata branch (no Sharp derivative, no generated-output quota)
  if (isMetadata) {
    const {executeMetadataGenerationJob} = await import("@/server/images/ai-metadata-service");
    const meta = await executeMetadataGenerationJob({
      userId: params.userId,
      projectId: project.id,
      jobId: acquired.id,
    });
    const fresh = await getOwnedProcessingJob(params.userId, project.id, acquired.id);
    if (meta.ok && fresh) return {ok: true, job: toJobDto(fresh)};
    if (fresh) return {ok: true, job: toJobDto(fresh)};
    return {ok: false, error: "PROCESSING_FAILED"};
  }

  const image = await getOwnedImageForProcessing(params.userId, project.id, acquired.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    await failJob(acquired.id, project.id, "IMAGE_NOT_FOUND");
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (image.storageKey !== acquired.sourceStorageKey) {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    await failJob(acquired.id, project.id, "SOURCE_REVISION_CHANGED", "stale");
    return {ok: false, error: "SOURCE_REVISION_CHANGED"};
  }
  if (image.status !== READY_STATUS) {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    await failJob(acquired.id, project.id, "IMAGE_NOT_READY", "stale");
    return {ok: false, error: "IMAGE_NOT_READY"};
  }
  const openReplacement = await imageHasOpenReplacement(image.id, project.id);
  if (openReplacement) {
    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    await failJob(acquired.id, project.id, "SOURCE_REVISION_CHANGED", "stale");
    return {ok: false, error: "SOURCE_REVISION_CHANGED"};
  }

  let outputKey: string | null = null;

  try {
    const storage = await getObjectStorageProvider();
    // Always read the immutable original — never another derivative.
    const source = await storage.getObjectBuffer(
      acquired.sourceStorageKey,
      MAX_SOURCE_BYTES_FOR_PROCESSING,
    );

    const isResize = acquired.operation === RESIZE_OPERATION;
    const isConvert = acquired.operation === CONVERT_OPERATION;
    if (isResize && !isResizePresetId(acquired.preset)) {
      throw new ProcessingDomainError("INVALID_REQUEST");
    }
    if (isConvert) {
      const target = targetFromConversionPreset(acquired.preset);
      if (!target || !isConversionAllowed(acquired.sourceDetectedFormat, target)) {
        throw new ProcessingDomainError("CONVERSION_UNSUPPORTED");
      }
    }

    const processed = isConvert
      ? await convertFormat({
          body: source.body,
          expectedFormat: acquired.sourceDetectedFormat,
          expectedWidth: acquired.sourceWidth,
          expectedHeight: acquired.sourceHeight,
          isAnimated: image.isAnimated,
          targetFormat: targetFromConversionPreset(acquired.preset) as ConversionTargetFormat,
        })
      : isResize
        ? await resizeSameFormat({
            body: source.body,
            expectedFormat: acquired.sourceDetectedFormat,
            expectedWidth: acquired.sourceWidth,
            expectedHeight: acquired.sourceHeight,
            isAnimated: image.isAnimated,
            preset: acquired.preset as ResizePresetId,
          })
        : await optimizeSameFormat({
            body: source.body,
            expectedFormat: acquired.sourceDetectedFormat,
            expectedWidth: acquired.sourceWidth,
            expectedHeight: acquired.sourceHeight,
            isAnimated: image.isAnimated,
          });

    await updateProcessingJob(acquired.id, project.id, {status: "uploading_output"});

    const safeSuffix = `out.${processed.format === "jpeg" ? "jpg" : processed.format}`;
    const variant = isResize
      ? (acquired.preset as string)
      : isConvert
        ? (acquired.preset as string)
        : "optimize";
    outputKey = buildDerivativeStorageKey({
      userId: params.userId,
      projectId: project.id,
      imageId: acquired.imageId,
      jobId: acquired.id,
      attempt: acquired.attemptCount,
      safeFilenameSuffix: safeSuffix,
      variant,
    });

    let uploaded;
    try {
      uploaded = await storage.putObjectBuffer({
        storageKey: outputKey,
        body: processed.body,
        contentType: processed.mimeType,
        maxBytes: MAX_OUTPUT_BYTES,
      });
    } catch (error) {
      if (error instanceof StorageDomainError && error.code === "OBJECT_TOO_LARGE") {
        throw new ProcessingDomainError("OUTPUT_SIZE_LIMIT_EXCEEDED");
      }
      throw new ProcessingDomainError("OUTPUT_UPLOAD_FAILED");
    }

    await updateProcessingJob(acquired.id, project.id, {status: "verifying_output"});

    const head = await storage.readObjectMetadata(outputKey);
    if (!head || head.sizeBytes !== processed.byteSize) {
      throw new ProcessingDomainError("OUTPUT_VERIFICATION_FAILED");
    }

    const imageAgain = await getOwnedImageForProcessing(
      params.userId,
      project.id,
      acquired.imageId,
    );
    if (!imageAgain || imageAgain.storageKey !== acquired.sourceStorageKey) {
      await cleanupKey(outputKey);
      await failJob(acquired.id, project.id, "SOURCE_REVISION_CHANGED", "stale");
      return {ok: false, error: "SOURCE_REVISION_CHANGED"};
    }
    if (imageAgain.deletedAt || isDeletionUnavailableStatus(imageAgain.status)) {
      await cleanupKey(outputKey);
      await failJob(acquired.id, project.id, "IMAGE_NOT_FOUND", "stale");
      return {ok: false, error: "IMAGE_NOT_FOUND"};
    }

    const kind = derivativeKindForOperation(
      acquired.operation as ProcessingOperation,
    );
    const previousActive = await getActiveDerivativeForImage(acquired.imageId, project.id, {
      kind,
      preset: acquired.preset ?? null,
    });
    if (previousActive) {
      await updateDerivative(previousActive.id, project.id, {status: "stale"});
    }

    const durationMs = Math.max(0, Date.now() - startedMs);

    await insertDerivative({
      id: crypto.randomUUID(),
      projectId: project.id,
      imageId: acquired.imageId,
      processingJobId: acquired.id,
      storageKey: outputKey,
      kind,
      preset: acquired.preset ?? null,
      format: processed.format,
      mimeType: processed.mimeType,
      byteSize: head.sizeBytes,
      width: processed.width,
      height: processed.height,
      etag: head.etag ?? uploaded.etag,
      checksum: processed.checksum,
      status: "active",
      sourceStorageKey: acquired.sourceStorageKey,
    });

    const completed = await updateProcessingJob(acquired.id, project.id, {
      status: "completed",
      outputStorageKey: outputKey,
      outputByteSize: head.sizeBytes,
      outputDetectedFormat: processed.format,
      outputMimeType: processed.mimeType,
      outputWidth: processed.width,
      outputHeight: processed.height,
      outputEtag: head.etag ?? uploaded.etag,
      outputChecksum: processed.checksum,
      processingDurationMs: durationMs,
      completedAt: new Date(),
      lastErrorCode: null,
      lastErrorMessageSafe: null,
    });

    await bumpQuotaState(project.id, {
      reservedGeneratedBytes: -reserveBytes,
      generatedOutputBytes: head.sizeBytes,
    }).catch(() => {
      console.error("[processing] generated quota bump failed");
    });

    const {recordUsage} = await import("@/server/billing/entitlements");
    await recordUsage({
      userId: acquired.createdBy,
      projectId: project.id,
      category: "processing",
      entityId: acquired.id,
      idempotencyKey: `processing_completed:${acquired.id}`,
    });

    return {ok: true, job: toJobDto(completed!)};
  } catch (error) {
    let code: SafeProcessingErrorCode = "PROCESSING_FAILED";
    if (error instanceof ProcessingDomainError) code = error.code;
    else if (error instanceof StorageNotConfiguredError) code = "STORAGE_NOT_CONFIGURED";
    else if (error instanceof StorageDomainError) {
      if (error.code === "OBJECT_NOT_FOUND") code = "SOURCE_OBJECT_MISSING";
      else if (error.code === "OBJECT_TOO_LARGE") code = "SOURCE_SIZE_LIMIT_EXCEEDED";
      else code = "STORAGE_UNAVAILABLE";
    } else {
      console.error("[processing] unexpected failure");
    }

    if (outputKey) {
      const cleaned = await cleanupKey(outputKey);
      if (!cleaned) {
        await updateProcessingJob(acquired.id, project.id, {
          status: "cleanup_failed",
          failedAt: new Date(),
          outputStorageKey: outputKey,
          lastErrorCode: code,
          lastErrorMessageSafe: code,
          cleanupStartedAt: new Date(),
        });
        return {ok: false, error: code};
      }
    }

    await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
    await failJob(acquired.id, project.id, code);
    return {ok: false, error: code};
  }
}

async function failJob(
  jobId: string,
  projectId: string,
  code: string,
  status: "failed" | "stale" = "failed",
) {
  await updateProcessingJob(jobId, projectId, {
    status,
    failedAt: new Date(),
    lastErrorCode: code,
    lastErrorMessageSafe: code,
  });
}

async function cleanupKey(storageKey: string): Promise<boolean> {
  try {
    const storage = await getObjectStorageProvider();
    await storage.deleteObject(storageKey);
    const still = await storage.objectExists(storageKey);
    return !still;
  } catch {
    console.error("[processing] derivative cleanup failed");
    return false;
  }
}

export async function getProcessingJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<{ok: true; job: ProcessingJobDto} | {ok: false; error: SafeProcessingErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const job = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  if (!job) return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  return {ok: true, job: toJobDto(job)};
}

export async function retryProcessingJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<{ok: true; job: ProcessingJobDto} | {ok: false; error: SafeProcessingErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const job = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  if (!job) return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  if (job.status === "completed") return {ok: false, error: "PROCESSING_JOB_ALREADY_COMPLETED"};
  if (job.status === "cancelled") return {ok: false, error: "PROCESSING_JOB_CANCELLED"};
  if (job.status === "stale") return {ok: false, error: "PROCESSING_JOB_STALE"};
  if (job.status !== "failed" && job.status !== "cleanup_failed") {
    return {ok: false, error: "PROCESSING_JOB_CONFLICT"};
  }
  if (job.attemptCount >= job.maxAttempts) {
    return {ok: false, error: "PROCESSING_RETRY_LIMIT_REACHED"};
  }

  await updateProcessingJob(job.id, project.id, {
    status: "queued",
    outputStorageKey: null,
    outputByteSize: null,
    outputChecksum: null,
    processingDurationMs: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    heartbeatAt: null,
    lastErrorCode: null,
    lastErrorMessageSafe: null,
  });

  const reserveBytes = Math.min(job.sourceByteSize, MAX_OUTPUT_BYTES);
  await ensureProjectQuotaState(project.id);
  await bumpQuotaState(project.id, {reservedGeneratedBytes: reserveBytes}).catch(() => undefined);

  // Prompt 16: retry only re-queues — worker executes; browser never runs Sharp
  const refreshed = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  return {ok: true, job: toJobDto(refreshed!)};
}

export async function cancelQueuedProcessingJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<{ok: true; job: ProcessingJobDto} | {ok: false; error: SafeProcessingErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const job = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  if (!job) return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  if (job.status !== "queued") return {ok: false, error: "PROCESSING_JOB_CONFLICT"};

  const updated = await updateProcessingJob(job.id, project.id, {
    status: "cancelled",
    cancelledAt: new Date(),
  });
  const reserveBytes = Math.min(job.sourceByteSize, MAX_OUTPUT_BYTES);
  await bumpQuotaState(project.id, {reservedGeneratedBytes: -reserveBytes}).catch(() => undefined);
  return {ok: true, job: toJobDto(updated!)};
}

export async function createDerivativePreviewUrl(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<{ok: true; url: string; expiresAt: string} | {ok: false; error: SafeProcessingErrorCode}> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const job = await getOwnedProcessingJob(params.userId, project.id, params.jobId);
  if (!job) return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  if (job.status !== "completed") return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};

  const derivative = await getDerivativeForJob(job.id, project.id);
  if (!derivative || derivative.status !== "active" || !derivative.storageKey) {
    return {ok: false, error: "PROCESSING_JOB_NOT_FOUND"};
  }

  try {
    const storage = await getObjectStorageProvider();
    const ttl = Math.min(getR2SignedUrlTtlSeconds(), 300);
    const signed = await storage.createSignedReadUrl(derivative.storageKey, ttl);
    return {ok: true, url: signed.url, expiresAt: signed.expiresAt.toISOString()};
  } catch {
    return {ok: false, error: "STORAGE_UNAVAILABLE"};
  }
}

export async function onImageDeletionInvalidateProcessing(params: {
  projectId: string;
  imageId: string;
}): Promise<void> {
  await markActiveJobsStaleForImage(params.imageId, params.projectId, "IMAGE_NOT_FOUND");
  const rows = await listActiveDerivativesForImage(params.imageId, params.projectId);
  for (const row of rows) {
    await updateDerivative(row.id, params.projectId, {
      status: "cleanup_pending",
    });
    if (row.storageKey) {
      const cleaned = await cleanupKey(row.storageKey);
      if (cleaned) {
        await updateDerivative(row.id, params.projectId, {
          status: "deleted",
          deletedAt: new Date(),
        });
        if (row.byteSize != null) {
          await bumpQuotaState(params.projectId, {
            generatedOutputBytes: -row.byteSize,
          }).catch(() => undefined);
        }
      } else {
        await updateDerivative(row.id, params.projectId, {status: "cleanup_failed"});
      }
    }
  }
}

export async function onReplacementInvalidateProcessing(params: {
  projectId: string;
  imageId: string;
}): Promise<void> {
  await markActiveJobsStaleForImage(
    params.imageId,
    params.projectId,
    "SOURCE_REVISION_CHANGED",
  );
  await markDerivativesStaleForImage(params.imageId, params.projectId);
}

export async function getLatestJobForImage(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<ProcessingJobDto | null> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return null;
  const image = await getOwnedImageForProcessing(params.userId, project.id, params.imageId);
  if (!image) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(processingJobs)
    .where(and(eq(processingJobs.imageId, image.id), eq(processingJobs.projectId, project.id)))
    .orderBy(desc(processingJobs.createdAt))
    .limit(1);
  return row ? toJobDto(row) : null;
}

export async function listImageProcessingJobs(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<ProcessingJobDto[]> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return [];
  const image = await getOwnedImageForProcessing(params.userId, project.id, params.imageId);
  if (!image) return [];
  const rows = await listJobsForImage(image.id, project.id);
  return rows.map(toJobDto);
}

export {getProcessingPolicy, getResizePolicy, getConversionPolicy, toJobDto};
