/**
 * Map Sharp/libvips format tokens to controlled product MIME types.
 * Do not trust browser MIME, extension, or R2 Content-Type alone.
 */

import {expectedMimeForExtension} from "@/server/images/policy";
import type {SafeValidationErrorCode} from "@/server/images/validation-errors";
import {HEIC_SUPPORTED} from "@/server/images/validation-policy";

export type TrustedImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

const FORMAT_TO_MIME: Record<TrustedImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const EXTENSION_ALIASES: Record<string, TrustedImageFormat> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

export function mimeForTrustedFormat(format: TrustedImageFormat): string {
  return FORMAT_TO_MIME[format];
}

/**
 * Resolve Sharp metadata.format (+ optional compression) to a trusted product format.
 * HEIF-family without positive AVIF evidence is rejected.
 */
export function mapSharpFormatToTrusted(params: {
  format?: string;
  compression?: string;
}): {ok: true; format: TrustedImageFormat; mimeType: string} | {ok: false; code: SafeValidationErrorCode} {
  const raw = (params.format ?? "").toLowerCase();
  if (!raw) return {ok: false, code: "UNSUPPORTED_FORMAT"};

  if (raw === "jpeg" || raw === "jpg") {
    return {ok: true, format: "jpeg", mimeType: FORMAT_TO_MIME.jpeg};
  }
  if (raw === "png") return {ok: true, format: "png", mimeType: FORMAT_TO_MIME.png};
  if (raw === "webp") return {ok: true, format: "webp", mimeType: FORMAT_TO_MIME.webp};
  if (raw === "gif") return {ok: true, format: "gif", mimeType: FORMAT_TO_MIME.gif};

  if (raw === "avif") {
    return {ok: true, format: "avif", mimeType: FORMAT_TO_MIME.avif};
  }

  if (raw === "heif" || raw === "heic") {
    const compression = (params.compression ?? "").toLowerCase();
    // libvips may report AVIF as heif with av1 compression.
    if (compression === "av1" || compression === "avif") {
      return {ok: true, format: "avif", mimeType: FORMAT_TO_MIME.avif};
    }
    if (!HEIC_SUPPORTED) return {ok: false, code: "UNSUPPORTED_FORMAT"};
    return {ok: false, code: "UNSUPPORTED_FORMAT"};
  }

  if (raw === "svg" || raw === "svg+xml") return {ok: false, code: "UNSUPPORTED_FORMAT"};
  if (raw === "tiff" || raw === "tif") return {ok: false, code: "UNSUPPORTED_FORMAT"};
  if (raw === "pdf") return {ok: false, code: "UNSUPPORTED_FORMAT"};

  return {ok: false, code: "UNSUPPORTED_FORMAT"};
}

export function compareDeclaredVersusDetected(params: {
  declaredMime: string;
  fileExtension: string;
  storageContentType?: string | null;
  detectedFormat: TrustedImageFormat;
  detectedMime: string;
}): {ok: true} | {ok: false; code: "MIME_MISMATCH" | "EXTENSION_MISMATCH"} {
  const declared = params.declaredMime.toLowerCase();
  const detected = params.detectedMime.toLowerCase();

  if (declared !== detected) {
    return {ok: false, code: "MIME_MISMATCH"};
  }

  const ext = params.fileExtension.toLowerCase();
  const expectedFromExt = expectedMimeForExtension(ext);
  const formatFromExt = EXTENSION_ALIASES[ext];
  if (!formatFromExt || !expectedFromExt) {
    return {ok: false, code: "EXTENSION_MISMATCH"};
  }
  if (formatFromExt !== params.detectedFormat || expectedFromExt !== detected) {
    return {ok: false, code: "EXTENSION_MISMATCH"};
  }

  if (params.storageContentType) {
    const storageType = params.storageContentType.toLowerCase().split(";")[0]?.trim();
    if (storageType && storageType !== detected) {
      return {ok: false, code: "MIME_MISMATCH"};
    }
  }

  return {ok: true};
}
