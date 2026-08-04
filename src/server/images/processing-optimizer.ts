/**
 * Same-format optimization and dimension-safe resize via Sharp.
 * Never mutates the source buffer — returns a new Buffer.
 * Resize always uses the immutable original bytes (caller responsibility).
 */
import {createHash} from "node:crypto";
import sharp, {type OutputInfo, type Sharp} from "sharp";
import {
  AVIF_QUALITY,
  JPEG_QUALITY,
  MAX_SOURCE_PIXELS_FOR_PROCESSING,
  METADATA_POLICY_SUMMARY,
  PNG_COMPRESSION_LEVEL,
  WEBP_QUALITY,
  estimateDecodedMemoryBytes,
  formatMimeForProcessing,
  isProcessingSourceFormat,
  type ProcessingSourceFormat,
  MAX_DECODED_MEMORY_ESTIMATE_BYTES,
  MAX_OUTPUT_BYTES,
} from "@/server/images/processing-policy";
import {
  RESIZE_KERNEL,
  computeResizeTargetDimensions,
  getResizePresetMaxEdge,
  type ResizePresetId,
} from "@/server/images/resize-policy";
import {ProcessingDomainError} from "@/server/images/processing-errors";

export type OptimizeInput = {
  body: Buffer;
  expectedFormat: string | null;
  expectedWidth: number | null;
  expectedHeight: number | null;
  isAnimated: boolean | null;
};

export type OptimizeOutput = {
  body: Buffer;
  format: ProcessingSourceFormat;
  mimeType: string;
  width: number;
  height: number;
  byteSize: number;
  checksum: string;
  metadataPolicy: typeof METADATA_POLICY_SUMMARY;
};

function checksumOf(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function encodeSameFormat(pipeline: Sharp, format: ProcessingSourceFormat): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({quality: JPEG_QUALITY, mozjpeg: true});
    case "png":
      return pipeline.png({compressionLevel: PNG_COMPRESSION_LEVEL, effort: 7});
    case "webp":
      return pipeline.webp({quality: WEBP_QUALITY});
    case "avif":
      return pipeline.avif({quality: AVIF_QUALITY});
  }
}

function assertFormatMatch(metaFormat: string | undefined, format: ProcessingSourceFormat) {
  const outFormat = metaFormat === "jpg" ? "jpeg" : metaFormat;
  if (outFormat !== format) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }
}

export async function optimizeSameFormat(input: OptimizeInput): Promise<OptimizeOutput> {
  if (input.isAnimated) {
    throw new ProcessingDomainError("SOURCE_ANIMATION_UNSUPPORTED");
  }
  if (!isProcessingSourceFormat(input.expectedFormat)) {
    throw new ProcessingDomainError("SOURCE_FORMAT_UNSUPPORTED");
  }
  const format = input.expectedFormat;

  if (
    input.expectedWidth != null &&
    input.expectedHeight != null &&
    estimateDecodedMemoryBytes(input.expectedWidth, input.expectedHeight) >
      MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    throw new ProcessingDomainError("SOURCE_PIXEL_LIMIT_EXCEEDED");
  }

  let pipeline = sharp(input.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  });

  // No .rotate() — preserve stored pixel dimensions.
  // No .withMetadata() — strip EXIF/GPS on re-encode.
  pipeline = encodeSameFormat(pipeline, format);

  let output: Buffer;
  let meta: OutputInfo;
  try {
    const result = await pipeline.toBuffer({resolveWithObject: true});
    output = result.data;
    meta = result.info;
  } catch {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  if (output.byteLength <= 0) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }
  if (output.byteLength > MAX_OUTPUT_BYTES) {
    throw new ProcessingDomainError("OUTPUT_SIZE_LIMIT_EXCEEDED");
  }

  const width = meta.width;
  const height = meta.height;
  if (!width || !height) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  if (
    input.expectedWidth != null &&
    input.expectedHeight != null &&
    (width !== input.expectedWidth || height !== input.expectedHeight)
  ) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  assertFormatMatch(meta.format, format);

  return {
    body: output,
    format,
    mimeType: formatMimeForProcessing(format),
    width,
    height,
    byteSize: output.byteLength,
    checksum: checksumOf(output),
    metadataPolicy: METADATA_POLICY_SUMMARY,
  };
}

export type ResizeInput = OptimizeInput & {
  preset: ResizePresetId;
};

export type ResizeOutput = OptimizeOutput & {
  preset: ResizePresetId;
  scaled: boolean;
  targetWidth: number;
  targetHeight: number;
};

export async function resizeSameFormat(input: ResizeInput): Promise<ResizeOutput> {
  if (input.isAnimated) {
    throw new ProcessingDomainError("SOURCE_ANIMATION_UNSUPPORTED");
  }
  if (!isProcessingSourceFormat(input.expectedFormat)) {
    throw new ProcessingDomainError("SOURCE_FORMAT_UNSUPPORTED");
  }
  if (input.expectedWidth == null || input.expectedHeight == null) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }
  const format = input.expectedFormat;
  const maxEdge = getResizePresetMaxEdge(input.preset);

  if (
    estimateDecodedMemoryBytes(input.expectedWidth, input.expectedHeight) >
    MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    throw new ProcessingDomainError("SOURCE_PIXEL_LIMIT_EXCEEDED");
  }

  let target: {width: number; height: number; scaled: boolean};
  try {
    target = computeResizeTargetDimensions({
      sourceWidth: input.expectedWidth,
      sourceHeight: input.expectedHeight,
      maxEdge,
    });
  } catch {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  // Never upscale: target dims ≤ source dims.
  if (target.width > input.expectedWidth || target.height > input.expectedHeight) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  let pipeline = sharp(input.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  });

  // Fit inside maxEdge×maxEdge; withoutEnlargement enforces no-upscale at Sharp layer too.
  pipeline = pipeline.resize({
    width: maxEdge,
    height: maxEdge,
    fit: "inside",
    withoutEnlargement: true,
    kernel: RESIZE_KERNEL,
  });

  pipeline = encodeSameFormat(pipeline, format);

  let output: Buffer;
  let meta: OutputInfo;
  try {
    const result = await pipeline.toBuffer({resolveWithObject: true});
    output = result.data;
    meta = result.info;
  } catch {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  if (output.byteLength <= 0) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }
  if (output.byteLength > MAX_OUTPUT_BYTES) {
    throw new ProcessingDomainError("OUTPUT_SIZE_LIMIT_EXCEEDED");
  }

  const width = meta.width;
  const height = meta.height;
  if (!width || !height) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  // No upscale vs trusted source snapshot.
  if (width > input.expectedWidth || height > input.expectedHeight) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  // Aspect ratio: compare source vs output ratios within 2% tolerance for rounding.
  const sourceRatio = input.expectedWidth / input.expectedHeight;
  const outRatio = width / height;
  if (Math.abs(sourceRatio - outRatio) / sourceRatio > 0.02) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  assertFormatMatch(meta.format, format);

  return {
    body: output,
    format,
    mimeType: formatMimeForProcessing(format),
    width,
    height,
    byteSize: output.byteLength,
    checksum: checksumOf(output),
    metadataPolicy: METADATA_POLICY_SUMMARY,
    preset: input.preset,
    scaled: target.scaled,
    targetWidth: target.width,
    targetHeight: target.height,
  };
}

export type ConvertInput = OptimizeInput & {
  targetFormat: ProcessingSourceFormat;
};

export type ConvertOutput = OptimizeOutput & {
  targetFormat: ProcessingSourceFormat;
  sourceFormat: ProcessingSourceFormat;
};

/**
 * Same-dimension format conversion from immutable original bytes.
 * Caller must enforce conversion matrix (never PNG→JPEG silently).
 */
export async function convertFormat(input: ConvertInput): Promise<ConvertOutput> {
  if (input.isAnimated) {
    throw new ProcessingDomainError("SOURCE_ANIMATION_UNSUPPORTED");
  }
  if (!isProcessingSourceFormat(input.expectedFormat)) {
    throw new ProcessingDomainError("SOURCE_FORMAT_UNSUPPORTED");
  }
  if (!isProcessingSourceFormat(input.targetFormat)) {
    throw new ProcessingDomainError("CONVERSION_UNSUPPORTED");
  }
  const sourceFormat = input.expectedFormat;
  const targetFormat = input.targetFormat;

  // Hard safety: never flatten alpha sources to JPEG even if matrix misconfigured.
  if (targetFormat === "jpeg" && sourceFormat === "png") {
    throw new ProcessingDomainError("CONVERSION_UNSUPPORTED");
  }

  if (
    input.expectedWidth != null &&
    input.expectedHeight != null &&
    estimateDecodedMemoryBytes(input.expectedWidth, input.expectedHeight) >
      MAX_DECODED_MEMORY_ESTIMATE_BYTES
  ) {
    throw new ProcessingDomainError("SOURCE_PIXEL_LIMIT_EXCEEDED");
  }

  let pipeline = sharp(input.body, {
    failOn: "error",
    limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    sequentialRead: true,
    animated: false,
  });

  // No .rotate(); no .withMetadata() — same metadata policy as optimize/resize.
  // Dimensions unchanged — no resize step.
  pipeline = encodeSameFormat(pipeline, targetFormat);

  let output: Buffer;
  let meta: OutputInfo;
  try {
    const result = await pipeline.toBuffer({resolveWithObject: true});
    output = result.data;
    meta = result.info;
  } catch {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  if (output.byteLength <= 0) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }
  if (output.byteLength > MAX_OUTPUT_BYTES) {
    throw new ProcessingDomainError("OUTPUT_SIZE_LIMIT_EXCEEDED");
  }

  const width = meta.width;
  const height = meta.height;
  if (!width || !height) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  if (
    input.expectedWidth != null &&
    input.expectedHeight != null &&
    (width !== input.expectedWidth || height !== input.expectedHeight)
  ) {
    throw new ProcessingDomainError("PROCESSING_FAILED");
  }

  assertFormatMatch(meta.format, targetFormat);

  // Alpha: PNG/WebP/AVIF targets should retain alpha when source had it (best-effort).
  if (sourceFormat === "png" && (targetFormat === "png" || targetFormat === "webp" || targetFormat === "avif")) {
    const outMeta = await sharp(output).metadata();
    const inMeta = await sharp(input.body).metadata();
    if (inMeta.hasAlpha && !outMeta.hasAlpha) {
      throw new ProcessingDomainError("PROCESSING_FAILED");
    }
  }

  return {
    body: output,
    format: targetFormat,
    mimeType: formatMimeForProcessing(targetFormat),
    width,
    height,
    byteSize: output.byteLength,
    checksum: checksumOf(output),
    metadataPolicy: METADATA_POLICY_SUMMARY,
    targetFormat,
    sourceFormat,
  };
}
