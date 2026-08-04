/**
 * Guest cross-format conversion via Sharp.
 * Orientation: rotate() once before encode (Convert-only; Compress/Resize unchanged).
 */
import {createHash, randomUUID} from "node:crypto";
import sharp, {type Metadata, type OutputInfo, type Sharp} from "sharp";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {isGuestAvifEncodeSupported} from "@/server/guest/avif-capability";
import {
  encoderSettingsForPreset,
  guestConvertExtension,
  guestConvertMime,
  isGuestConvertAllowed,
  parseGuestConvertOptions,
  sourceFormatFromMime,
  type GuestConvertOptions,
  type GuestConvertTargetFormat,
} from "@/server/guest/convert-policy";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {GuestDomainError} from "@/server/guest/errors";
import {buildGuestOutputStorageKey} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {
  MAX_DECODED_MEMORY_ESTIMATE_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_PIXELS_FOR_PROCESSING,
  estimateDecodedMemoryBytes,
} from "@/server/images/processing-policy";
import {buildSafeFilenameSuffix} from "@/server/images/validation";

export type GuestConvertResultSummary = {
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceFormat: string;
  targetFormat: string;
  mimeType: string;
  qualityPreset: string;
  hasSourceAlpha: boolean;
  hasOutputAlpha: boolean;
  transparency: "preserved" | "flattened" | "none";
  jpegBackground: string | null;
  orientationNormalized: true;
  metadataStripped: true;
  durationMs: number;
  sourceChecksum: string;
};

function encodeTarget(
  pipeline: Sharp,
  target: GuestConvertTargetFormat,
  settings: ReturnType<typeof encoderSettingsForPreset>,
): Sharp {
  switch (target) {
    case "jpeg":
      return pipeline.jpeg({quality: settings.jpegQuality, mozjpeg: true});
    case "png":
      return pipeline.png({
        compressionLevel: settings.pngCompressionLevel,
        effort: 7,
      });
    case "webp":
      return pipeline.webp({quality: settings.webpQuality});
    case "avif":
      return pipeline.avif({quality: settings.avifQuality, effort: settings.avifEffort});
  }
}

export async function executeGuestConvertJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestConvertOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (params.upload.isAnimated) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  const startedAt = Date.now();
  const avifSupported = await isGuestAvifEncodeSupported();
  const sourceFormat = sourceFormatFromMime(
    params.upload.detectedMimeType ?? params.upload.declaredMimeType,
  );
  if (!sourceFormat) throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");

  const hasAlpha = Boolean(params.upload.hasAlpha);
  let options: GuestConvertOptions;
  try {
    options = parseGuestConvertOptions(params.options, {
      sourceFormat,
      hasAlpha,
      avifSupported,
    });
  } catch {
    throw new GuestDomainError("INVALID_REQUEST");
  }

  if (!isGuestConvertAllowed(sourceFormat, options.targetFormat, avifSupported)) {
    throw new GuestDomainError("OPERATION_NOT_SUPPORTED");
  }

  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await storage.getObjectBuffer(params.upload.storageKey, maxBytes);
  const sourceChecksum = createHash("sha256").update(source.body).digest("hex");

  let orientedMeta: Metadata;
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
  if (!sourceWidth || !sourceHeight) throw new GuestDomainError("VALIDATION_FAILED");
  if (estimateDecodedMemoryBytes(sourceWidth, sourceHeight) > MAX_DECODED_MEMORY_ESTIMATE_BYTES) {
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }

  const trustedAlpha = Boolean(orientedMeta.hasAlpha ?? params.upload.hasAlpha);
  if (options.targetFormat === "jpeg" && trustedAlpha && !options.jpegBackground) {
    throw new GuestDomainError("INVALID_REQUEST");
  }

  const settings = encoderSettingsForPreset(options.qualityPreset);
  let pipeline: Sharp = sharp(source.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  }).rotate();

  let transparency: GuestConvertResultSummary["transparency"] = "none";
  if (options.targetFormat === "jpeg" && trustedAlpha) {
    const bg =
      options.jpegBackground === "black"
        ? {r: 0, g: 0, b: 0}
        : {r: 255, g: 255, b: 255};
    pipeline = pipeline.flatten({background: bg});
    transparency = "flattened";
  } else if (
    trustedAlpha &&
    (options.targetFormat === "png" ||
      options.targetFormat === "webp" ||
      options.targetFormat === "avif")
  ) {
    transparency = "preserved";
  }

  pipeline = encodeTarget(pipeline, options.targetFormat, settings);

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

  // Full decode + format / dimension / alpha verification.
  let verified: Metadata;
  try {
    const decoded = await sharp(output, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
      animated: false,
    })
      .raw()
      .toBuffer({resolveWithObject: true});
    if (!decoded.info.width || !decoded.info.height) {
      throw new GuestDomainError("INTERNAL_ERROR");
    }
    decoded.data.fill(0);
    verified = await sharp(output).metadata();
  } catch (error) {
    if (error instanceof GuestDomainError) throw error;
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const expectedFormat =
    options.targetFormat === "jpeg" ? "jpeg" : options.targetFormat;
  if (verified.format !== expectedFormat) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const outW = meta.width ?? verified.width;
  const outH = meta.height ?? verified.height;
  if (!outW || !outH || outW !== sourceWidth || outH !== sourceHeight) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const hasOutputAlpha = Boolean(verified.hasAlpha);
  if (options.targetFormat === "jpeg" && hasOutputAlpha) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }
  if (transparency === "preserved" && trustedAlpha && !hasOutputAlpha) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const ext = guestConvertExtension(options.targetFormat);
  const suffix = buildSafeFilenameSuffix(`converted.${ext}`);
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix: suffix || `${randomUUID()}.${ext}`,
  });

  try {
    await storage.putObjectBuffer({
      storageKey: outputKey,
      body: output,
      contentType: guestConvertMime(options.targetFormat),
      maxBytes: MAX_OUTPUT_BYTES,
    });
  } catch {
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});

  // Presence check.
  const exists = await storage.objectExists(outputKey);
  if (!exists) {
    await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  const resultSummary: GuestConvertResultSummary = {
    inputBytes: Number(params.upload.sizeBytes ?? source.sizeBytes),
    outputBytes: output.byteLength,
    width: outW,
    height: outH,
    sourceWidth,
    sourceHeight,
    sourceFormat,
    targetFormat: options.targetFormat,
    mimeType: guestConvertMime(options.targetFormat),
    qualityPreset: options.qualityPreset,
    hasSourceAlpha: trustedAlpha,
    hasOutputAlpha,
    transparency,
    jpegBackground: options.jpegBackground,
    orientationNormalized: true,
    metadataStripped: true,
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
