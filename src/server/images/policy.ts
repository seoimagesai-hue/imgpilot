/**
 * Upload policy foundation — authoritative limits and allowlists for the next R2 task.
 * Declared browser metadata is not binary content proof.
 */

export const MAX_BYTES_PER_IMAGE = 25 * 1024 * 1024;
export const MAX_FILES_PER_BATCH = 500;
export const MAX_ORIGINAL_FILENAME_LENGTH = 255;
export const IMAGE_LIST_LIMIT = 100;
export const SUPPORTED_STORAGE_PROVIDER = "r2" as const;

/** Raster formats enabled in the foundation. SVG is deferred (active content risk). */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;

export const REJECTED_EXTENSIONS = [
  "svg",
  "exe",
  "zip",
  "pdf",
  "psd",
  "doc",
  "docx",
  "js",
  "mjs",
  "cjs",
  "html",
  "htm",
] as const;

export const REJECTED_MIME_TYPES = [
  "image/svg+xml",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-msdownload",
  "application/javascript",
  "text/javascript",
  "text/html",
] as const;

/** Animated GIFs are currently permitted as a raster format; processing policy comes later. */
export const ANIMATED_GIF_PERMITTED = true;
export const SVG_SUPPORTED = false;
export const REJECT_ZERO_BYTE_FILES = true;

const mimeByExtension: Record<(typeof ALLOWED_IMAGE_EXTENSIONS)[number], (typeof ALLOWED_IMAGE_MIME_TYPES)[number]> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export function getExtension(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? "";
  const idx = base.lastIndexOf(".");
  if (idx <= 0 || idx === base.length - 1) return "";
  return base.slice(idx + 1).toLowerCase();
}

export function isAllowedImageExtension(ext: string): boolean {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

export function isRejectedExtension(ext: string): boolean {
  return (REJECTED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

export function isAllowedImageMimeType(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime.toLowerCase());
}

export function isRejectedMimeType(mime: string): boolean {
  return (REJECTED_MIME_TYPES as readonly string[]).includes(mime.toLowerCase());
}

export function expectedMimeForExtension(ext: string): string | null {
  const normalized = ext.toLowerCase();
  if (!isAllowedImageExtension(normalized)) return null;
  return mimeByExtension[normalized as (typeof ALLOWED_IMAGE_EXTENSIONS)[number]];
}

export type UploadPolicySummary = {
  maxBytesPerImage: number;
  maxFilesPerBatch: number;
  maxOriginalFilenameLength: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  svgSupported: boolean;
  animatedGifPermitted: boolean;
  rejectZeroByteFiles: boolean;
  storageProvider: typeof SUPPORTED_STORAGE_PROVIDER;
};

export function getUploadPolicy(): UploadPolicySummary {
  return {
    maxBytesPerImage: MAX_BYTES_PER_IMAGE,
    maxFilesPerBatch: MAX_FILES_PER_BATCH,
    maxOriginalFilenameLength: MAX_ORIGINAL_FILENAME_LENGTH,
    allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
    svgSupported: SVG_SUPPORTED,
    animatedGifPermitted: ANIMATED_GIF_PERMITTED,
    rejectZeroByteFiles: REJECT_ZERO_BYTE_FILES,
    storageProvider: SUPPORTED_STORAGE_PROVIDER,
  };
}
