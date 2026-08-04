/**
 * Central format-conversion policy — Prompt 14.
 * Always convert from the immutable original; never chain derivatives.
 * Never silently flatten PNG to JPEG.
 */
import {
  AVIF_QUALITY,
  JPEG_QUALITY,
  MAX_PROCESSING_ATTEMPTS,
  METADATA_POLICY_SUMMARY,
  PNG_COMPRESSION_LEVEL,
  WEBP_QUALITY,
  type ProcessingSourceFormat,
} from "@/server/images/processing-policy";
import {
  CONVERSION_TARGET_FORMATS,
  isConversionTargetFormat,
  type ConversionTargetFormat,
} from "@/lib/conversion-formats";

export {CONVERSION_TARGET_FORMATS, isConversionTargetFormat, type ConversionTargetFormat};

export const CONVERT_OPERATION = "convert_format" as const;

/**
 * Allowed source → target matrix.
 * PNG → JPEG is intentionally absent (no silent flatten).
 * WebP → JPEG/PNG intentionally absent.
 * AVIF only re-encodes to AVIF in this prompt.
 */
export const CONVERSION_MATRIX: Record<
  ProcessingSourceFormat,
  readonly ConversionTargetFormat[]
> = {
  jpeg: ["jpeg", "webp", "avif"],
  png: ["png", "webp", "avif"],
  webp: ["webp", "avif"],
  avif: ["avif"],
};

export type ConversionPolicySummary = {
  operation: typeof CONVERT_OPERATION;
  targets: readonly ConversionTargetFormat[];
  matrix: typeof CONVERSION_MATRIX;
  neverFlattenPngToJpeg: true;
  neverSilentJpegFromAlpha: true;
  preserveAlphaWhenPossible: true;
  dimensionsChange: false;
  animatedSupported: false;
  maxAttempts: number;
  jpegQuality: number;
  webpQuality: number;
  pngCompressionLevel: number;
  avifQuality: number;
  metadata: typeof METADATA_POLICY_SUMMARY;
};

export function getConversionPolicy(): ConversionPolicySummary {
  return {
    operation: CONVERT_OPERATION,
    targets: CONVERSION_TARGET_FORMATS,
    matrix: CONVERSION_MATRIX,
    neverFlattenPngToJpeg: true,
    neverSilentJpegFromAlpha: true,
    preserveAlphaWhenPossible: true,
    dimensionsChange: false,
    animatedSupported: false,
    maxAttempts: MAX_PROCESSING_ATTEMPTS,
    jpegQuality: JPEG_QUALITY,
    webpQuality: WEBP_QUALITY,
    pngCompressionLevel: PNG_COMPRESSION_LEVEL,
    avifQuality: AVIF_QUALITY,
    metadata: METADATA_POLICY_SUMMARY,
  };
}

export function isConversionAllowed(
  sourceFormat: string | null | undefined,
  targetFormat: string | null | undefined,
): boolean {
  if (!sourceFormat || !isConversionTargetFormat(targetFormat)) return false;
  const allowed = CONVERSION_MATRIX[sourceFormat as ProcessingSourceFormat];
  if (!allowed) return false;
  return (allowed as readonly string[]).includes(targetFormat);
}

export function listAllowedTargetsForSource(
  sourceFormat: string | null | undefined,
): ConversionTargetFormat[] {
  if (!sourceFormat) return [];
  const allowed = CONVERSION_MATRIX[sourceFormat as ProcessingSourceFormat];
  return allowed ? [...allowed] : [];
}

/** Preset / variant key for convert jobs and derivative uniqueness. */
export function conversionPresetForTarget(target: ConversionTargetFormat): string {
  return `to_${target}`;
}

export function targetFromConversionPreset(
  preset: string | null | undefined,
): ConversionTargetFormat | null {
  if (!preset?.startsWith("to_")) return null;
  const target = preset.slice(3);
  return isConversionTargetFormat(target) ? target : null;
}
