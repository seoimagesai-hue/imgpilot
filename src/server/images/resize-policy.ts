/**
 * Central resize policy — Prompt 13.
 * Fixed presets only; never upscale; preserve aspect ratio; same-format output.
 */
import {
  JPEG_QUALITY,
  MAX_PROCESSING_ATTEMPTS,
  METADATA_POLICY_SUMMARY,
  PNG_COMPRESSION_LEVEL,
  WEBP_QUALITY,
  AVIF_QUALITY,
} from "@/server/images/processing-policy";
import {
  RESIZE_PRESET_IDS,
  RESIZE_PRESETS,
  isResizePresetId,
  type ResizePresetId,
} from "@/lib/resize-presets";

export {RESIZE_PRESET_IDS, RESIZE_PRESETS, isResizePresetId, type ResizePresetId};

export const RESIZE_OPERATION = "resize" as const;

export const MAX_RESIZE_OUTPUT_EDGE = 2048;

/** Sharp kernel for downscale — lanczos3 is the default high-quality filter. */
export const RESIZE_KERNEL = "lanczos3" as const;

export type ResizePolicySummary = {
  operation: typeof RESIZE_OPERATION;
  presets: ReadonlyArray<{id: ResizePresetId; maxEdge: number}>;
  maxOutputEdge: number;
  neverUpscale: true;
  preserveAspectRatio: true;
  neverCrop: true;
  neverStretch: true;
  neverPad: true;
  neverRotate: true;
  formatChange: false;
  alphaPreserved: true;
  interpolation: typeof RESIZE_KERNEL;
  maxAttempts: number;
  jpegQuality: number;
  webpQuality: number;
  pngCompressionLevel: number;
  avifQuality: number;
  metadata: typeof METADATA_POLICY_SUMMARY;
};

export function getResizePolicy(): ResizePolicySummary {
  return {
    operation: RESIZE_OPERATION,
    presets: RESIZE_PRESET_IDS.map((id) => ({
      id,
      maxEdge: RESIZE_PRESETS[id].maxEdge,
    })),
    maxOutputEdge: MAX_RESIZE_OUTPUT_EDGE,
    neverUpscale: true,
    preserveAspectRatio: true,
    neverCrop: true,
    neverStretch: true,
    neverPad: true,
    neverRotate: true,
    formatChange: false,
    alphaPreserved: true,
    interpolation: RESIZE_KERNEL,
    maxAttempts: MAX_PROCESSING_ATTEMPTS,
    jpegQuality: JPEG_QUALITY,
    webpQuality: WEBP_QUALITY,
    pngCompressionLevel: PNG_COMPRESSION_LEVEL,
    avifQuality: AVIF_QUALITY,
    metadata: METADATA_POLICY_SUMMARY,
  };
}

export function getResizePresetMaxEdge(preset: ResizePresetId): number {
  return RESIZE_PRESETS[preset].maxEdge;
}

/**
 * Fit inside a square of maxEdge without upscaling, cropping, or stretching.
 * Returns source dimensions when already within the preset.
 */
export function computeResizeTargetDimensions(params: {
  sourceWidth: number;
  sourceHeight: number;
  maxEdge: number;
}): {width: number; height: number; scaled: boolean} {
  const {sourceWidth, sourceHeight, maxEdge} = params;
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    !Number.isFinite(maxEdge) ||
    maxEdge <= 0
  ) {
    throw new Error("INVALID_DIMENSIONS");
  }

  const longest = Math.max(sourceWidth, sourceHeight);
  if (longest <= maxEdge) {
    return {width: sourceWidth, height: sourceHeight, scaled: false};
  }

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
    scaled: true,
  };
}
