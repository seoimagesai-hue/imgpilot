/**
 * Guest same-format resize via Sharp.
 */
import {randomUUID} from "node:crypto";
import sharp, {type OutputInfo, type Sharp} from "sharp";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  computeGuestResizeTarget,
  type GuestResizeOptions,
} from "@/server/guest/resize-policy";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {GuestDomainError} from "@/server/guest/errors";
import {getGuestSourceObject} from "@/server/guest/source-cache";
import {buildGuestOutputStorageKey} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {
  MAX_DECODED_MEMORY_ESTIMATE_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_PIXELS_FOR_PROCESSING,
  estimateDecodedMemoryBytes,
  formatMimeForProcessing,
  isProcessingSourceFormat,
  type ProcessingSourceFormat,
} from "@/server/images/processing-policy";
import {RESIZE_KERNEL} from "@/server/images/resize-policy";
import {buildSafeFilenameSuffix} from "@/server/images/validation";

export type GuestResizeResultSummary = {
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  mimeType: string;
  method: string;
  preset: string;
  preventUpscale: boolean;
  maintainAspectRatio: boolean;
  scaled: boolean;
  durationMs: number;
};

function encodeSameFormat(pipeline: Sharp, format: ProcessingSourceFormat): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({
        quality: 82,
        mozjpeg: true,
        optimiseScans: false,
        optimizeScans: false,
      });
    case "png":
      return pipeline.png({compressionLevel: 8, effort: 3});
    case "webp":
      return pipeline.webp({quality: 82, effort: 3});
    case "avif":
      throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
}

export async function executeGuestResizeJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestResizeOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (params.options.method === "exact_size") {
    // Locked in consumer UI; reject until a later prompt unlocks it.
    throw new GuestDomainError("OPERATION_NOT_SUPPORTED");
  }

  const startedAt = Date.now();
  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType;
  const formatHint =
    mime === "image/jpeg" || mime === "image/jpg"
      ? "jpeg"
      : mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : null;
  if (!formatHint || !isProcessingSourceFormat(formatHint)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
  if (params.upload.isAnimated) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  const sourceWidth = params.upload.width;
  const sourceHeight = params.upload.height;
  if (sourceWidth == null || sourceHeight == null) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }
  if (
    estimateDecodedMemoryBytes(sourceWidth, sourceHeight) > MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }

  let target;
  try {
    target = computeGuestResizeTarget(sourceWidth, sourceHeight, params.options);
  } catch {
    throw new GuestDomainError("INVALID_REQUEST");
  }

  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await getGuestSourceObject(params.upload.storageKey, maxBytes);

  let pipeline = sharp(source.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  });

  pipeline = pipeline.resize({
    width: target.width,
    height: target.height,
    fit: "fill",
    withoutEnlargement: params.options.preventUpscale,
    kernel: RESIZE_KERNEL,
  });
  pipeline = encodeSameFormat(pipeline, formatHint);

  let output: Buffer;
  let meta: OutputInfo;
  try {
    const result = await pipeline.toBuffer({resolveWithObject: true});
    output = result.data;
    meta = result.info;
  } catch {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  if (output.byteLength <= 0 || output.byteLength > MAX_OUTPUT_BYTES) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }
  const outW = meta.width;
  const outH = meta.height;
  if (!outW || !outH) throw new GuestDomainError("INTERNAL_ERROR");

  const suffix = buildSafeFilenameSuffix(
    `resized.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  );
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix: suffix || `${randomUUID()}.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  });

  await storage.putObjectBuffer({
    storageKey: outputKey,
    body: output,
    contentType: formatMimeForProcessing(formatHint),
    maxBytes: MAX_OUTPUT_BYTES,
  });
  await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});

  const resultSummary: GuestResizeResultSummary = {
    inputBytes: Number(params.upload.sizeBytes ?? source.sizeBytes),
    outputBytes: output.byteLength,
    width: outW,
    height: outH,
    sourceWidth,
    sourceHeight,
    mimeType: formatMimeForProcessing(formatHint),
    method: params.options.method,
    preset: params.options.preset,
    preventUpscale: params.options.preventUpscale,
    maintainAspectRatio: params.options.maintainAspectRatio,
    scaled: target.scaled,
    durationMs: Date.now() - startedAt,
  };
  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputStorageKey: outputKey,
      resultSummary,
      errorCode: null,
    })
    .where(eq(guestJobs.id, params.job.id))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}
