/**
 * Trusted Sharp inspection: metadata() THEN bounded full-decode.
 * metadata() alone is never treated as full validation.
 *
 * Full-decode method:
 *   sharp(buffer, { failOn: "error", limitInputPixels, sequentialRead: true })
 *     .raw()
 *     .toBuffer()
 * Decoded raw pixels are discarded immediately.
 * Animated images: first page/frame is fully decoded; frame count comes from metadata.
 */

import sharp, {type Metadata} from "sharp";
import {
  mapSharpFormatToTrusted,
  type TrustedImageFormat,
} from "@/server/images/format-map";
import {ValidationDomainError} from "@/server/images/validation-errors";
import {
  MAX_TOTAL_PIXELS,
  checkAnimationLimits,
  checkDimensions,
} from "@/server/images/validation-policy";

export type TrustedImageInspection = {
  format: TrustedImageFormat;
  mimeType: string;
  width: number;
  height: number;
  pixelCount: number;
  isAnimated: boolean;
  frameCount: number;
  orientation: number | null;
  hasAlpha: boolean | null;
  colourSpace: string | null;
  /** Confirms Step 2 (full decode) ran successfully. */
  fullDecodePerformed: true;
};

function mapSharpError(error: unknown): ValidationDomainError {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("limit") && message.includes("pixel")) {
    return new ValidationDomainError("PIXEL_LIMIT_EXCEEDED");
  }
  if (
    message.includes("unsupported") ||
    message.includes("vips") ||
    message.includes("input") ||
    message.includes("corrupt") ||
    message.includes("incomplete") ||
    message.includes("premature") ||
    message.includes("invalid")
  ) {
    return new ValidationDomainError("CORRUPT_IMAGE");
  }
  return new ValidationDomainError("DECODE_FAILED");
}

export async function inspectAndFullyDecodeImage(buffer: Buffer): Promise<TrustedImageInspection> {
  if (!buffer.length) {
    throw new ValidationDomainError("EMPTY_OBJECT");
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_TOTAL_PIXELS,
      sequentialRead: true,
    }).metadata();
  } catch (error) {
    throw mapSharpError(error);
  }

  const mapped = mapSharpFormatToTrusted({
    format: metadata.format,
    compression: metadata.compression,
  });
  if (!mapped.ok) {
    throw new ValidationDomainError(mapped.code);
  }

  const dims = checkDimensions(metadata.width, metadata.height);
  if (!dims.ok) {
    throw new ValidationDomainError(dims.code);
  }

  const pages = metadata.pages && metadata.pages > 1 ? metadata.pages : 1;
  const isAnimated = pages > 1 || Boolean(metadata.delay && metadata.delay.length > 1);
  const frameCount = isAnimated ? Math.max(pages, metadata.delay?.length ?? pages) : 1;

  const animation = checkAnimationLimits({
    isAnimated,
    frameCount,
    pixelCount: dims.pixelCount,
    format: mapped.format,
  });
  if (!animation.ok) {
    throw new ValidationDomainError(animation.code);
  }

  // Step 2 — force pixel decode of the primary page; discard output.
  try {
    const decoded = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_TOTAL_PIXELS,
      sequentialRead: true,
      pages: 1,
    })
      .raw()
      .toBuffer({resolveWithObject: true});

    if (!decoded.data.length || !decoded.info.width || !decoded.info.height) {
      throw new ValidationDomainError("DECODE_FAILED");
    }
    // Explicit discard — do not retain decoded pixels.
    decoded.data.fill(0);
  } catch (error) {
    if (error instanceof ValidationDomainError) throw error;
    throw mapSharpError(error);
  }

  const orientation =
    typeof metadata.orientation === "number" && metadata.orientation >= 1 && metadata.orientation <= 8
      ? metadata.orientation
      : null;

  return {
    format: mapped.format,
    mimeType: mapped.mimeType,
    width: dims.width,
    height: dims.height,
    pixelCount: dims.pixelCount,
    isAnimated,
    frameCount,
    orientation,
    hasAlpha: typeof metadata.hasAlpha === "boolean" ? metadata.hasAlpha : null,
    colourSpace: metadata.space ?? null,
    fullDecodePerformed: true,
  };
}
