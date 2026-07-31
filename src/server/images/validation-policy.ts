/**
 * Trusted image validation policy (Prompt 7).
 * Compressed size alone does not prevent decompression bombs.
 */

import {MAX_BYTES_PER_IMAGE} from "@/server/images/policy";

export const IMAGE_VALIDATION_VERSION = "image-validation-v1" as const;

export const MAX_IMAGE_WIDTH = 20_000;
export const MAX_IMAGE_HEIGHT = 20_000;
/** Max encoded width × height for a single frame/page. */
export const MAX_TOTAL_PIXELS = 100_000_000;
export const MAX_ANIMATION_FRAMES = 300;
/** Max width × height × frames for animated images. */
export const MAX_TOTAL_ANIMATED_PIXELS = 150_000_000;

/** Stale `validating` rows become retryable after this duration. */
export const STALE_VALIDATING_MS = 15 * 60 * 1000;
export const MAX_VALIDATION_ATTEMPTS = 10;
export const VALIDATION_RETRY_COOLDOWN_MS = 5_000;

export const HEIC_SUPPORTED = false;
export const TIFF_SUPPORTED = false;
export const SVG_SUPPORTED_FOR_VALIDATION = false;
/** Animated AVIF is not claimed without live proof. */
export const ANIMATED_AVIF_SUPPORTED = false;

export type ValidationPolicySummary = {
  version: typeof IMAGE_VALIDATION_VERSION;
  maxCompressedBytes: number;
  maxWidth: number;
  maxHeight: number;
  maxTotalPixels: number;
  maxAnimationFrames: number;
  maxTotalAnimatedPixels: number;
  heicSupported: boolean;
  tiffSupported: boolean;
  svgSupported: boolean;
  animatedAvifSupported: boolean;
};

export function getValidationPolicy(): ValidationPolicySummary {
  return {
    version: IMAGE_VALIDATION_VERSION,
    maxCompressedBytes: MAX_BYTES_PER_IMAGE,
    maxWidth: MAX_IMAGE_WIDTH,
    maxHeight: MAX_IMAGE_HEIGHT,
    maxTotalPixels: MAX_TOTAL_PIXELS,
    maxAnimationFrames: MAX_ANIMATION_FRAMES,
    maxTotalAnimatedPixels: MAX_TOTAL_ANIMATED_PIXELS,
    heicSupported: HEIC_SUPPORTED,
    tiffSupported: TIFF_SUPPORTED,
    svgSupported: SVG_SUPPORTED_FOR_VALIDATION,
    animatedAvifSupported: ANIMATED_AVIF_SUPPORTED,
  };
}

/** Safe multiplication for pixel counts — returns null on overflow / invalid. */
export function multiplyPixels(width: number, height: number): number | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (!Number.isInteger(width) || !Number.isInteger(height)) return null;
  if (width <= 0 || height <= 0) return null;
  if (width > Number.MAX_SAFE_INTEGER || height > Number.MAX_SAFE_INTEGER) return null;
  const product = width * height;
  if (!Number.isSafeInteger(product) || product <= 0) return null;
  return product;
}

export function multiplyAnimatedPixels(pixelsPerFrame: number, frames: number): number | null {
  if (!Number.isFinite(pixelsPerFrame) || !Number.isFinite(frames)) return null;
  if (!Number.isInteger(pixelsPerFrame) || !Number.isInteger(frames)) return null;
  if (pixelsPerFrame <= 0 || frames <= 0) return null;
  const product = pixelsPerFrame * frames;
  if (!Number.isSafeInteger(product) || product <= 0) return null;
  return product;
}

export type DimensionCheckFailure =
  | "DIMENSIONS_MISSING"
  | "WIDTH_LIMIT_EXCEEDED"
  | "HEIGHT_LIMIT_EXCEEDED"
  | "PIXEL_LIMIT_EXCEEDED";

export function checkDimensions(
  width: number | undefined | null,
  height: number | undefined | null,
): {ok: true; width: number; height: number; pixelCount: number} | {ok: false; code: DimensionCheckFailure} {
  if (width == null || height == null || !Number.isFinite(width) || !Number.isFinite(height)) {
    return {ok: false, code: "DIMENSIONS_MISSING"};
  }
  const w = Math.trunc(width);
  const h = Math.trunc(height);
  if (w <= 0 || h <= 0) return {ok: false, code: "DIMENSIONS_MISSING"};
  if (w > MAX_IMAGE_WIDTH) return {ok: false, code: "WIDTH_LIMIT_EXCEEDED"};
  if (h > MAX_IMAGE_HEIGHT) return {ok: false, code: "HEIGHT_LIMIT_EXCEEDED"};
  const pixelCount = multiplyPixels(w, h);
  if (pixelCount == null) return {ok: false, code: "PIXEL_LIMIT_EXCEEDED"};
  if (pixelCount > MAX_TOTAL_PIXELS) return {ok: false, code: "PIXEL_LIMIT_EXCEEDED"};
  return {ok: true, width: w, height: h, pixelCount};
}

export type AnimationCheckFailure = "FRAME_LIMIT_EXCEEDED" | "ANIMATED_PIXEL_LIMIT_EXCEEDED" | "UNSUPPORTED_ANIMATION";

export function checkAnimationLimits(params: {
  isAnimated: boolean;
  frameCount: number;
  pixelCount: number;
  format: string;
}): {ok: true} | {ok: false; code: AnimationCheckFailure} {
  if (!params.isAnimated) return {ok: true};
  if (params.format === "avif" && !ANIMATED_AVIF_SUPPORTED) {
    return {ok: false, code: "UNSUPPORTED_ANIMATION"};
  }
  if (params.frameCount > MAX_ANIMATION_FRAMES) {
    return {ok: false, code: "FRAME_LIMIT_EXCEEDED"};
  }
  const animatedPixels = multiplyAnimatedPixels(params.pixelCount, params.frameCount);
  if (animatedPixels == null || animatedPixels > MAX_TOTAL_ANIMATED_PIXELS) {
    return {ok: false, code: "ANIMATED_PIXEL_LIMIT_EXCEEDED"};
  }
  return {ok: true};
}
