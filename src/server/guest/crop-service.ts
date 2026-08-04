/**
 * Guest same-format crop via Sharp.
 *
 * Orientation policy: auto-orient with sharp.rotate() before extract so
 * preview (browser EXIF-aware) and server pixel math share one coordinate system.
 */
import {createHash, randomUUID} from "node:crypto";
import sharp, {type OutputInfo, type Sharp} from "sharp";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  GUEST_CROP_MIN_EDGE_PX,
  normalizedCropToPixels,
  type GuestCropOptions,
} from "@/server/guest/crop-policy";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {GuestDomainError} from "@/server/guest/errors";
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

export type GuestCropResultSummary = {
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  mimeType: string;
  aspectRatio: string;
  pixelCrop: {left: number; top: number; width: number; height: number};
  orientationNormalized: true;
  durationMs: number;
  sourceChecksum: string;
};

function encodeSameFormat(pipeline: Sharp, format: ProcessingSourceFormat): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({quality: 90, mozjpeg: true});
    case "png":
      // Preserve alpha — no flatten.
      return pipeline.png({compressionLevel: 6, effort: 7});
    case "webp":
      return pipeline.webp({quality: 90});
    case "avif":
      throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
}

export async function executeGuestCropJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestCropOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (params.upload.isAnimated) {
    throw new GuestDomainError("VALIDATION_FAILED");
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

  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await storage.getObjectBuffer(params.upload.storageKey, maxBytes);
  const sourceChecksum = createHash("sha256").update(source.body).digest("hex");

  // Orientation normalize FIRST — trusted dimensions for crop math.
  let orientedMeta: {width?: number; height?: number};
  try {
    orientedMeta = await sharp(source.body, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
      sequentialRead: true,
      animated: false,
    })
      .rotate()
      .metadata();
  } catch {
    throw new GuestDomainError("CORRUPT_IMAGE");
  }

  const sourceWidth = orientedMeta.width;
  const sourceHeight = orientedMeta.height;
  if (!sourceWidth || !sourceHeight) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }
  if (estimateDecodedMemoryBytes(sourceWidth, sourceHeight) > MAX_DECODED_MEMORY_ESTIMATE_BYTES) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }

  let pixelCrop;
  try {
    pixelCrop = normalizedCropToPixels(
      sourceWidth,
      sourceHeight,
      params.options.normalizedCrop,
      GUEST_CROP_MIN_EDGE_PX,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "CROP_TOO_SMALL" || msg === "SOURCE_TOO_SMALL") {
      throw new GuestDomainError("VALIDATION_FAILED");
    }
    if (msg === "OUT_OF_BOUNDS" || msg === "INVALID_CROP") {
      throw new GuestDomainError("INVALID_REQUEST");
    }
    throw new GuestDomainError("INVALID_REQUEST");
  }

  let pipeline = sharp(source.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  })
    .rotate()
    .extract({
      left: pixelCrop.left,
      top: pixelCrop.top,
      width: pixelCrop.width,
      height: pixelCrop.height,
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

  // Fully decode output and verify dimensions.
  try {
    const verified = await sharp(output, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
      animated: false,
    })
      .raw()
      .toBuffer({resolveWithObject: true});
    if (
      verified.info.width !== pixelCrop.width ||
      verified.info.height !== pixelCrop.height
    ) {
      throw new GuestDomainError("INTERNAL_ERROR");
    }
    verified.data.fill(0);
  } catch (error) {
    if (error instanceof GuestDomainError) throw error;
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const outW = meta.width;
  const outH = meta.height;
  if (!outW || !outH || outW !== pixelCrop.width || outH !== pixelCrop.height) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const suffix = buildSafeFilenameSuffix(
    `cropped.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  );
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix:
      suffix || `${randomUUID()}.${formatHint === "jpeg" ? "jpg" : formatHint}`,
  });

  await storage.putObjectBuffer({
    storageKey: outputKey,
    body: output,
    contentType: formatMimeForProcessing(formatHint),
    maxBytes: MAX_OUTPUT_BYTES,
  });
  await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});

  const resultSummary: GuestCropResultSummary = {
    inputBytes: Number(params.upload.sizeBytes ?? source.sizeBytes),
    outputBytes: output.byteLength,
    width: outW,
    height: outH,
    sourceWidth,
    sourceHeight,
    mimeType: formatMimeForProcessing(formatHint),
    aspectRatio: params.options.aspectRatio,
    pixelCrop,
    orientationNormalized: true,
    durationMs: Date.now() - startedAt,
    sourceChecksum,
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
