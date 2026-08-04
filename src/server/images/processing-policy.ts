/**
 * Central processing policy — Prompt 12 optimize + shared limits for Prompt 13 resize.
 * Resize presets live in resize-policy.ts. No format conversion, AI, bulk, or queues.
 */
import {MAX_TOTAL_PIXELS} from "@/server/images/validation-policy";
import {MAX_BYTES_PER_IMAGE as UPLOAD_MAX_BYTES} from "@/server/images/policy";

export const PROCESSING_OPERATION = "optimize_same_format" as const;

/** Development default — not a billing tier. Separate from original-upload quota. */
export const MAX_GENERATED_OUTPUT_BYTES_PER_PROJECT = 5 * 1024 * 1024 * 1024;

export const MAX_PROCESSING_ATTEMPTS = 3;
export const MAX_ACTIVE_JOBS_PER_IMAGE = 1;
export const MAX_ACTIVE_JOBS_PER_PROJECT = 20;
export const MAX_OUTPUT_BYTES = UPLOAD_MAX_BYTES;
export const MAX_SOURCE_BYTES_FOR_PROCESSING = UPLOAD_MAX_BYTES;
export const MAX_SOURCE_PIXELS_FOR_PROCESSING = MAX_TOTAL_PIXELS;
/** Conservative decoded-memory estimate: 4 bytes/pixel RGBA + overhead. */
export const MAX_DECODED_MEMORY_ESTIMATE_BYTES = 400 * 1024 * 1024;
export const JPEG_QUALITY = 82;
export const WEBP_QUALITY = 82;
export const PNG_COMPRESSION_LEVEL = 8;
export const AVIF_QUALITY = 50;
export const STALE_QUEUED_MS = 30 * 60 * 1000;
export const STALE_PROCESSING_MS = 15 * 60 * 1000;

/** Formats accepted for Prompt 12 optimize — animated rejected separately. */
export const PROCESSING_SOURCE_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type ProcessingSourceFormat = (typeof PROCESSING_SOURCE_FORMATS)[number];

export type ProcessingPolicySummary = {
  operation: typeof PROCESSING_OPERATION;
  maxSourceBytes: number;
  maxSourcePixels: number;
  maxOutputBytes: number;
  maxDecodedMemoryEstimateBytes: number;
  maxAttempts: number;
  maxGeneratedOutputBytesPerProject: number;
  jpegQuality: number;
  webpQuality: number;
  pngCompressionLevel: number;
  avifQuality: number;
  animatedSupported: false;
  gifSupported: false;
  svgSupported: false;
  dimensionsChange: false;
  formatChange: false;
  /** Honest: not claimed lossless. Controlled-quality re-encode. */
  losslessClaim: false;
};

export function getProcessingPolicy(): ProcessingPolicySummary {
  return {
    operation: PROCESSING_OPERATION,
    maxSourceBytes: MAX_SOURCE_BYTES_FOR_PROCESSING,
    maxSourcePixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
    maxOutputBytes: MAX_OUTPUT_BYTES,
    maxDecodedMemoryEstimateBytes: MAX_DECODED_MEMORY_ESTIMATE_BYTES,
    maxAttempts: MAX_PROCESSING_ATTEMPTS,
    maxGeneratedOutputBytesPerProject: MAX_GENERATED_OUTPUT_BYTES_PER_PROJECT,
    jpegQuality: JPEG_QUALITY,
    webpQuality: WEBP_QUALITY,
    pngCompressionLevel: PNG_COMPRESSION_LEVEL,
    avifQuality: AVIF_QUALITY,
    animatedSupported: false,
    gifSupported: false,
    svgSupported: false,
    dimensionsChange: false,
    formatChange: false,
    losslessClaim: false,
  };
}

export function isProcessingSourceFormat(format: string | null | undefined): format is ProcessingSourceFormat {
  return Boolean(format && (PROCESSING_SOURCE_FORMATS as readonly string[]).includes(format));
}

export function estimateDecodedMemoryBytes(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return Number.POSITIVE_INFINITY;
  return width * height * 4;
}

export function formatMimeForProcessing(format: ProcessingSourceFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
  }
}

/**
 * Metadata policy (verified in optimizer):
 * - Do NOT call sharp.rotate() — keeps stored width/height pixel grid unchanged.
 * - Do NOT call withMetadata() — EXIF (incl. GPS) is stripped on re-encode.
 * - ICC: not explicitly preserved (Sharp default re-encode without withMetadata).
 * - Orientation tag is not copied to output.
 */
export const METADATA_POLICY_SUMMARY = {
  rotateNormalized: false,
  exifRetained: false,
  gpsRetained: false,
  iccRetained: false,
  orientationTagRetained: false,
} as const;
