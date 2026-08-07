/**
 * Shared helpers for same-format guest transforms (rotate / watermark / blur / meme).
 */
import {randomUUID} from "node:crypto";
import sharp, {type Metadata, type Sharp} from "sharp";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
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

function encodeSameFormat(pipeline: Sharp, format: ProcessingSourceFormat): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({quality: 90, mozjpeg: true});
    case "png":
      return pipeline.png({compressionLevel: 7, effort: 7});
    case "webp":
      return pipeline.webp({quality: 90});
    case "avif":
      throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }
}

function formatFromUpload(upload: GuestUpload): ProcessingSourceFormat {
  const mime = (upload.detectedMimeType ?? upload.declaredMimeType ?? "").toLowerCase();
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
  return formatHint;
}

export async function executeSameFormatGuestTransform(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  filenamePrefix: string;
  transform: (args: {
    pipeline: Sharp;
    width: number;
    height: number;
    format: ProcessingSourceFormat;
  }) => Sharp | Promise<Sharp>;
  buildSummary: (args: {
    inputBytes: number;
    outputBytes: number;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    mimeType: string;
    durationMs: number;
  }) => Record<string, unknown>;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (params.upload.isAnimated) throw new GuestDomainError("VALIDATION_FAILED");

  const startedAt = Date.now();
  const format = formatFromUpload(params.upload);
  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await storage.getObjectBuffer(params.upload.storageKey, maxBytes);

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
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  const sourceWidth = orientedMeta.width ?? 0;
  const sourceHeight = orientedMeta.height ?? 0;
  if (!sourceWidth || !sourceHeight) throw new GuestDomainError("VALIDATION_FAILED");

  const decodedEstimate = estimateDecodedMemoryBytes(sourceWidth, sourceHeight);
  if (decodedEstimate > MAX_DECODED_MEMORY_ESTIMATE_BYTES) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  let pipeline: Sharp = sharp(source.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  }).rotate();

  pipeline = await params.transform({
    pipeline,
    width: sourceWidth,
    height: sourceHeight,
    format,
  });
  pipeline = encodeSameFormat(pipeline, format);

  let output: Buffer;
  let outW = 0;
  let outH = 0;
  try {
    const result = await pipeline.toBuffer({resolveWithObject: true});
    output = result.data;
    outW = result.info.width ?? 0;
    outH = result.info.height ?? 0;
  } catch {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  if (!outW || !outH || output.byteLength <= 0 || output.byteLength > MAX_OUTPUT_BYTES) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const ext = format === "jpeg" ? "jpg" : format;
  const suffix = buildSafeFilenameSuffix(`${params.filenamePrefix}.${ext}`);
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix: suffix || `${randomUUID()}.${ext}`,
  });

  await storage.putObjectBuffer({
    storageKey: outputKey,
    body: output,
    contentType: formatMimeForProcessing(format),
    maxBytes: MAX_OUTPUT_BYTES,
  });
  await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});

  const summary = params.buildSummary({
    inputBytes: Number(params.upload.sizeBytes ?? source.sizeBytes),
    outputBytes: output.byteLength,
    width: outW,
    height: outH,
    sourceWidth,
    sourceHeight,
    mimeType: formatMimeForProcessing(format),
    durationMs: Date.now() - startedAt,
  });

  const db = getDb();
  const [completed] = await db
    .update(guestJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputStorageKey: outputKey,
      resultSummary: summary,
      errorCode: null,
    })
    .where(eq(guestJobs.id, params.job.id))
    .returning();

  if (!completed) throw new GuestDomainError("INTERNAL_ERROR");
  return completed;
}

export function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
