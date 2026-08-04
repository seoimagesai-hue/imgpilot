/**
 * Prompt 27 — shared Shopify publish policy constants + pure helpers.
 * Filename helpers are thin re-exports of the WordPress helpers (Prompt 26) —
 * filename policy (slugify / mode resolution) is identical across integrations.
 */
export {
  baseNameFromStorageKey,
  extensionForFormat,
  mimeForFormat,
  resolveRequestedFilename,
  slugifyFilenameBase,
} from "@/server/wordpress/policy";

export const SHOPIFY_PUBLISH_LEASE_TTL_MS = 3 * 60 * 1000;
export const SHOPIFY_PUBLISH_CLAIM_BATCH = 10;
export const SHOPIFY_PUBLISH_MAX_ATTEMPTS_DEFAULT = 5;
export const SHOPIFY_MAX_MEDIA_BYTES = 20 * 1024 * 1024; // 20 MiB — bounded getObjectBuffer read
export const SHOPIFY_BULK_MAX_SIZE = 50;
export const SHOPIFY_API_VERSION = "2024-10";
