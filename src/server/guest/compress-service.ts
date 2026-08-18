/**
 * Guest same-format compress via Sharp — quality-parameterized.
 * Does not mutate dashboard fixed-quality optimizeSameFormat defaults.
 */
import {createHash, randomUUID} from "node:crypto";
import sharp, {type OutputInfo, type Sharp} from "sharp";
import {getDb} from "@/db";
import {guestJobs, guestUploads, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  computeGuestCompressSizeSaved,
  pngLevelFromGuestQuality,
  type GuestCompressOptions,
} from "@/server/guest/compress-policy";
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
import {buildSafeFilenameSuffix} from "@/server/images/validation";
import {eq} from "drizzle-orm";

export type GuestCompressResultSummary = {
  inputBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
  quality: number;
  preset: string;
  width: number;
  height: number;
  mimeType: string;
  durationMs: number;
};

function checksumOf(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function encodeWithQuality(
  pipeline: Sharp,
  format: ProcessingSourceFormat,
  quality: number,
): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({
        quality,
        mozjpeg: true,
        optimiseScans: false,
        optimizeScans: false,
      });
    case "png":
      return pipeline.png({compressionLevel: pngLevelFromGuestQuality(quality), effort: 3});
    case "webp":
      return pipeline.webp({quality, effort: 3});
    case "avif":
      throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
}

async function compressBuffer(params: {
  body: Buffer;
  format: ProcessingSourceFormat;
  width: number | null;
  height: number | null;
  isAnimated: boolean | null;
  quality: number;
}): Promise<{
  body: Buffer;
  mimeType: string;
  width: number;
  height: number;
  byteSize: number;
  checksum: string;
}> {
  if (params.isAnimated) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }
  if (
    params.width != null &&
    params.height != null &&
    estimateDecodedMemoryBytes(params.width, params.height) > MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }

  let pipeline = sharp(params.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  });
  pipeline = encodeWithQuality(pipeline, params.format, params.quality);

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
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) throw new GuestDomainError("INTERNAL_ERROR");

  const outFormat = meta.format === "jpg" ? "jpeg" : meta.format;
  if (outFormat !== params.format) throw new GuestDomainError("INTERNAL_ERROR");

  return {
    body: output,
    mimeType: formatMimeForProcessing(params.format),
    width,
    height,
    byteSize: output.byteLength,
    checksum: checksumOf(output),
  };
}

/**
 * Run compress for an existing guest job row (status should be running).
 * Writes a new output object under guest/{session}/outputs/{jobId}/…
 */
export async function executeGuestCompressJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestCompressOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
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

  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await getGuestSourceObject(params.upload.storageKey, maxBytes);

  const compressed = await compressBuffer({
    body: source.body,
    format: formatHint,
    width: params.upload.width,
    height: params.upload.height,
    isAnimated: params.upload.isAnimated,
    quality: params.options.quality,
  });

  const suffix = buildSafeFilenameSuffix(
    `compressed.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  );
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix: suffix || `${randomUUID()}.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  });

  await storage.putObjectBuffer({
    storageKey: outputKey,
    body: compressed.body,
    contentType: compressed.mimeType,
    maxBytes: MAX_OUTPUT_BYTES,
  });
  await enqueueGuestCleanup({
    storageKey: outputKey,
    sessionId: params.session.id,
  });

  const inputBytes = Number(params.upload.sizeBytes ?? source.sizeBytes);
  const saved = computeGuestCompressSizeSaved(inputBytes, compressed.byteSize);
  const resultSummary: GuestCompressResultSummary = {
    ...saved,
    quality: params.options.quality,
    preset: params.options.preset,
    width: compressed.width,
    height: compressed.height,
    mimeType: compressed.mimeType,
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
