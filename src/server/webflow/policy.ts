/**
 * Prompt 28 — shared Webflow publish policy constants + pure helpers.
 * Filename helpers are thin re-exports of the WordPress helpers (Prompt 26) —
 * filename policy (slugify / mode resolution) is identical across integrations.
 */
import {createHash} from "node:crypto";

export {
  baseNameFromStorageKey,
  extensionForFormat,
  mimeForFormat,
  resolveRequestedFilename,
  slugifyFilenameBase,
} from "@/server/wordpress/policy";

export const WEBFLOW_PUBLISH_LEASE_TTL_MS = 3 * 60 * 1000;
export const WEBFLOW_PUBLISH_CLAIM_BATCH = 10;
export const WEBFLOW_PUBLISH_MAX_ATTEMPTS_DEFAULT = 5;
/** Webflow hard limit — assets over 4 MiB are rejected by the Assets API. */
export const WEBFLOW_MAX_MEDIA_BYTES = 4 * 1024 * 1024;
export const WEBFLOW_BULK_MAX_SIZE = 50;

/** Formats accepted by Webflow's Assets API; jpeg/png/webp are preferred. */
export const WEBFLOW_ALLOWED_IMAGE_FORMATS = ["jpeg", "jpg", "png", "gif", "webp", "svg", "avif"] as const;
export type WebflowAllowedImageFormat = (typeof WEBFLOW_ALLOWED_IMAGE_FORMATS)[number];

export function isAllowedWebflowImageFormat(format: string | null | undefined): boolean {
  if (!format) return false;
  return (WEBFLOW_ALLOWED_IMAGE_FORMATS as readonly string[]).includes(format.toLowerCase());
}

/** MD5 hex digest of the asset bytes — required by `POST /sites/{siteId}/assets`. */
export function md5FileHash(buffer: Buffer): string {
  return createHash("md5").update(buffer).digest("hex");
}

/**
 * Strip HTML and collapse whitespace for CMS text fields. PlainText fields
 * must never contain markup; RichText fields are written as escaped plain
 * text only (no HTML is ever injected into a RichText value).
 */
export function toPlainCmsText(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return "";
  const withoutTags = input.replace(/<[^>]*>/g, " ");
  const collapsed = withoutTags.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}
