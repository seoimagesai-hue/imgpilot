/**
 * Prompt 26 — shared WordPress publish policy constants + pure helpers.
 */
export const WORDPRESS_PUBLISH_LEASE_TTL_MS = 3 * 60 * 1000;
export const WORDPRESS_PUBLISH_CLAIM_BATCH = 10;
export const WORDPRESS_PUBLISH_MAX_ATTEMPTS_DEFAULT = 5;
export const WORDPRESS_MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 MiB — bounded getObjectBuffer read
export const WORDPRESS_BULK_MAX_SIZE = 50;

const EXTENSION_BY_FORMAT: Record<string, string> = {
  jpeg: "jpg",
  jpg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

export function extensionForFormat(format: string | null | undefined): string {
  if (!format) return "bin";
  return EXTENSION_BY_FORMAT[format.toLowerCase()] ?? format.toLowerCase();
}

const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export function mimeForFormat(format: string | null | undefined, fallback: string): string {
  if (!format) return fallback;
  return MIME_BY_FORMAT[format.toLowerCase()] ?? fallback;
}

/** Sanitize a candidate filename base (no extension) to a safe, short slug. */
export function slugifyFilenameBase(input: string): string {
  const withoutExt = input.replace(/\.[^./]+$/, "");
  const slug = withoutExt
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return slug || "image";
}

/**
 * Resolve the filename to request from WordPress. `keep` reuses the current
 * source filename (never renames the R2 object — this only affects what we
 * ask WordPress to call the uploaded media). `suggestion` uses the sanitized
 * approved filename suggestion. WordPress itself may still de-duplicate or
 * rewrite the filename server-side — the *returned* filename is recorded
 * separately from what we requested.
 */
export function resolveRequestedFilename(params: {
  filenameMode: "keep" | "suggestion";
  currentBaseName: string;
  filenameSuggestion: string;
  extension: string;
}): string {
  const base =
    params.filenameMode === "suggestion"
      ? slugifyFilenameBase(params.filenameSuggestion)
      : slugifyFilenameBase(params.currentBaseName);
  return `${base}.${params.extension}`;
}

export function baseNameFromStorageKey(storageKey: string): string {
  const last = storageKey.split("/").pop() ?? storageKey;
  return last.replace(/\.[^./]+$/, "");
}
