/**
 * Prompt 29 — shared Cloudinary publish policy constants + pure helpers.
 * Filename helpers are thin re-exports of the WordPress helpers (Prompt 26) —
 * filename policy (slugify / mode resolution) is identical across integrations.
 */
import {createHash} from "node:crypto";
import {CLOUDINARY_DELIVERY_HOST} from "@/server/cloudinary/url";
import {CloudinaryError} from "@/server/cloudinary/errors";

export {
  baseNameFromStorageKey,
  extensionForFormat,
  mimeForFormat,
  resolveRequestedFilename,
  slugifyFilenameBase,
} from "@/server/wordpress/policy";

export const CLOUDINARY_PUBLISH_LEASE_TTL_MS = 3 * 60 * 1000;
export const CLOUDINARY_PUBLISH_CLAIM_BATCH = 10;
export const CLOUDINARY_PUBLISH_MAX_ATTEMPTS_DEFAULT = 5;
/** Locked decision — reject anything larger than 25 MiB before ever contacting Cloudinary. */
export const CLOUDINARY_MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const CLOUDINARY_BULK_MAX_SIZE = 50;
/** Locked decision — no eager transformations are ever requested at upload time. */
export const CLOUDINARY_MAX_EAGER = 0;

/** Formats accepted for Cloudinary image uploads. */
export const CLOUDINARY_ALLOWED_IMAGE_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "gif",
  "webp",
  "svg",
  "avif",
  "tiff",
  "bmp",
] as const;
export type CloudinaryAllowedImageFormat = (typeof CLOUDINARY_ALLOWED_IMAGE_FORMATS)[number];

export function isAllowedCloudinaryImageFormat(format: string | null | undefined): boolean {
  if (!format) return false;
  return (CLOUDINARY_ALLOWED_IMAGE_FORMATS as readonly string[]).includes(format.toLowerCase());
}

// ---------------------------------------------------------------------------
// Transformation presets — fixed set only, defined here as the single source
// of truth. Any other transformation string must be rejected.
// ---------------------------------------------------------------------------

export const TRANSFORMATION_POLICY_VERSION = 1;
export const METADATA_POLICY_VERSION = 1;

export type TransformationPreset = "original" | "thumbnail" | "small" | "medium" | "large";

export const ALL_TRANSFORMATION_PRESETS: readonly TransformationPreset[] = [
  "original",
  "thumbnail",
  "small",
  "medium",
  "large",
];

/** `original` intentionally has no transformation string — it is delivered as-uploaded. */
export const TRANSFORMATION_PRESETS: Record<Exclude<TransformationPreset, "original">, string> = {
  thumbnail: "c_limit,w_150,h_150,q_auto",
  small: "c_limit,w_480,q_auto,f_auto",
  medium: "c_limit,w_960,q_auto,f_auto",
  large: "c_limit,w_1600,q_auto,f_auto",
};

export function isValidTransformationPreset(value: string): value is TransformationPreset {
  return (ALL_TRANSFORMATION_PRESETS as readonly string[]).includes(value);
}

/** Throws CLOUDINARY_TRANSFORMATION_INVALID for anything outside the fixed preset list. */
export function assertValidTransformationPresets(presets: readonly string[]): TransformationPreset[] {
  const result: TransformationPreset[] = [];
  for (const preset of presets) {
    if (!isValidTransformationPreset(preset)) {
      throw new CloudinaryError(
        "CLOUDINARY_TRANSFORMATION_INVALID",
        `Unknown transformation preset "${preset}". Allowed presets: ${ALL_TRANSFORMATION_PRESETS.join(", ")}.`,
      );
    }
    result.push(preset);
  }
  return result;
}

/** The literal Cloudinary transformation string for a preset, or "" for `original`. */
export function transformationStringForPreset(preset: TransformationPreset): string {
  if (preset === "original") return "";
  return TRANSFORMATION_PRESETS[preset];
}

// ---------------------------------------------------------------------------
// Public ID generation
// ---------------------------------------------------------------------------

const SEGMENT_SANITIZE_RE = /[^a-zA-Z0-9_-]+/g;

/** Sanitize one public-id path segment: lowercase alnum/dash/underscore only, bounded length. */
export function sanitizePublicIdSegment(segment: string, maxLength = 120): string {
  const cleaned = segment.trim().replace(SEGMENT_SANITIZE_RE, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  const safe = cleaned || "x";
  return safe.slice(0, maxLength).toLowerCase();
}

/**
 * Server-generated Cloudinary public ID:
 *   seo-tool/{workspaceId}/{projectId}/{imageId}/{revisionSlug}/{filenameBase}
 * Every segment is sanitized independently — never pass raw user input.
 */
export function buildPublicId(params: {
  workspaceId: string;
  projectId: string;
  imageId: string;
  revisionSlug: string;
  filenameBase: string;
}): string {
  const segments = [
    "seo-tool",
    sanitizePublicIdSegment(params.workspaceId),
    sanitizePublicIdSegment(params.projectId),
    sanitizePublicIdSegment(params.imageId),
    sanitizePublicIdSegment(params.revisionSlug),
    sanitizePublicIdSegment(params.filenameBase),
  ];
  return segments.join("/");
}

// ---------------------------------------------------------------------------
// Signed Upload API — Cloudinary's documented signature algorithm.
// Sort all signable parameters alphabetically by key, join as `key=value`
// pairs with `&`, append the api_secret directly (no separator), then SHA-1
// hex digest. `file`, `api_key`, `resource_type`, and `cloud_name` are never
// included in the signature.
// ---------------------------------------------------------------------------

const UNSIGNED_PARAM_KEYS = new Set(["file", "api_key", "resource_type", "cloud_name", "signature"]);

export function signUploadParams(params: Record<string, string | number | boolean>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((key) => !UNSIGNED_PARAM_KEYS.has(key) && params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

// ---------------------------------------------------------------------------
// Delivery URLs
// ---------------------------------------------------------------------------

/** Short signature used to sign a delivery URL's transformation+public_id path (Cloudinary "signed URL" convention). */
function shortDeliverySignature(input: string): string {
  const digest = createHash("sha1").update(input, "utf8").digest("base64");
  const urlSafe = digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return urlSafe.slice(0, 8);
}

function deliveryPath(publicId: string, format: string | null | undefined, transformation: string): string {
  const ext = format ? `.${format}` : "";
  return transformation ? `${transformation}/${publicId}${ext}` : `${publicId}${ext}`;
}

/** Unsigned (public) delivery URL — only valid once the connection's public delivery has been acknowledged. */
export function buildDeliveryUrl(params: {
  cloudName: string;
  publicId: string;
  format?: string | null;
  preset: TransformationPreset;
}): string {
  const transformation = transformationStringForPreset(params.preset);
  const path = deliveryPath(params.publicId, params.format, transformation);
  return `https://${CLOUDINARY_DELIVERY_HOST}/${params.cloudName}/image/upload/${path}`;
}

/** Server-side signed delivery URL — safe to use regardless of the connection's public-delivery acknowledgement. */
export function buildSignedDeliveryUrl(params: {
  cloudName: string;
  publicId: string;
  format?: string | null;
  preset: TransformationPreset;
  apiSecret: string;
}): string {
  const transformation = transformationStringForPreset(params.preset);
  const middle = transformation ? `${transformation}/${params.publicId}` : params.publicId;
  const signature = shortDeliverySignature(`${middle}${params.apiSecret}`);
  const path = deliveryPath(params.publicId, params.format, transformation);
  return `https://${CLOUDINARY_DELIVERY_HOST}/${params.cloudName}/image/upload/s--${signature}--/${path}`;
}

// ---------------------------------------------------------------------------
// Metadata (context) helpers
// ---------------------------------------------------------------------------

const CONTEXT_KEYS = ["alt", "caption", "title", "description"] as const;
export type CloudinaryContextKey = (typeof CONTEXT_KEYS)[number];

function escapeContextValue(value: string): string {
  // Cloudinary context uses `key=value|key=value` — `|` and `=` must be escaped.
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/=/g, "\\=");
}

/** Strip HTML/collapse whitespace, then build the pipe-separated Cloudinary context string. */
export function buildContextString(input: {
  altText?: string | null;
  caption?: string | null;
  title?: string | null;
  description?: string | null;
}): string {
  const values: Partial<Record<CloudinaryContextKey, string>> = {
    alt: toPlainContextText(input.altText),
    caption: toPlainContextText(input.caption),
    title: toPlainContextText(input.title),
    description: toPlainContextText(input.description),
  };
  return CONTEXT_KEYS.filter((key) => values[key])
    .map((key) => `${key}=${escapeContextValue(values[key] as string)}`)
    .join("|");
}

export function toPlainContextText(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return "";
  const withoutTags = input.replace(/<[^>]*>/g, " ");
  const collapsed = withoutTags.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}

/** Parse a Cloudinary `context.custom` object (as returned by the Admin/Upload API) back into plain fields. */
export function parseContextObject(context: Record<string, unknown> | null | undefined): {
  alt: string;
  caption: string;
  title: string;
  description: string;
} {
  const custom =
    context && typeof context === "object" && context.custom && typeof context.custom === "object"
      ? (context.custom as Record<string, unknown>)
      : context ?? {};
  const read = (key: CloudinaryContextKey) => (typeof custom[key] === "string" ? (custom[key] as string) : "");
  return {alt: read("alt"), caption: read("caption"), title: read("title"), description: read("description")};
}
