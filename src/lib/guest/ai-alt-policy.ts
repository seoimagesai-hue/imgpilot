/**
 * Guest AI Alt Text — structured image SEO metadata contract.
 * Viewer-style: no image derivative. Uses shared guest ops.
 */

export const GUEST_AI_ALT_OPERATION = "ai.generate_alt_text" as const;
export const GUEST_AI_SCHEMA_VERSION = "image-seo-ai-v2" as const;

export const GUEST_AI_PURPOSES = [
  "seo",
  "accessibility",
  "ecommerce",
  "blog",
  "social",
] as const;
export type GuestAiPurpose = (typeof GUEST_AI_PURPOSES)[number];

export const GUEST_AI_LANGUAGES = ["en", "ur"] as const;
export type GuestAiLanguage = (typeof GUEST_AI_LANGUAGES)[number];

export const GUEST_AI_ALT_MAX = 125;
export const GUEST_AI_TITLE_MAX = 80;
export const GUEST_AI_CAPTION_MAX = 200;
export const GUEST_AI_SHORT_DESC_MAX = 280;
export const GUEST_AI_LONG_DESC_MAX = 800;
export const GUEST_AI_FILENAME_MAX = 80;
export const GUEST_AI_KEYWORDS_MAX = 12;
export const GUEST_AI_KEYWORD_LEN_MAX = 40;
export const GUEST_AI_RESULT_MAX_CHARS = 24_000;

export type GuestAiAltOptions = {
  purpose: GuestAiPurpose;
  outputLanguage: GuestAiLanguage;
  schemaVersion: typeof GUEST_AI_SCHEMA_VERSION;
};

export type GuestAiStructuredResult = {
  schemaVersion: typeof GUEST_AI_SCHEMA_VERSION;
  altText: string;
  title: string;
  caption: string;
  shortDescription: string;
  longDescription: string;
  filename: string;
  keywords: string[];
};

export type GuestAiAltResultSummary = {
  schemaVersion: typeof GUEST_AI_SCHEMA_VERSION;
  purpose: GuestAiPurpose;
  outputLanguage: GuestAiLanguage;
  result: GuestAiStructuredResult;
  generatedAt: string;
  durationMs: number;
  providerConfigured: true;
};

export function defaultGuestAiAltOptions(locale?: string): GuestAiAltOptions {
  return {
    purpose: "seo",
    outputLanguage: locale === "ur" ? "ur" : "en",
    schemaVersion: GUEST_AI_SCHEMA_VERSION,
  };
}

export function isGuestAiPurpose(value: unknown): value is GuestAiPurpose {
  return typeof value === "string" && (GUEST_AI_PURPOSES as readonly string[]).includes(value);
}

export function isGuestAiLanguage(value: unknown): value is GuestAiLanguage {
  return typeof value === "string" && (GUEST_AI_LANGUAGES as readonly string[]).includes(value);
}

export function parseGuestAiAltOptions(raw: unknown): GuestAiAltOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of [
    "prompt",
    "system",
    "model",
    "temperature",
    "maxTokens",
    "imageUrl",
    "storageKey",
    "messages",
    "scrubbed",
  ]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  if (!isGuestAiPurpose(obj.purpose)) throw new Error("PURPOSE_INVALID");
  if (!isGuestAiLanguage(obj.outputLanguage)) throw new Error("LANGUAGE_INVALID");
  return {
    purpose: obj.purpose,
    outputLanguage: obj.outputLanguage,
    schemaVersion: GUEST_AI_SCHEMA_VERSION,
  };
}

export function guestAiAltOptionsEqual(a: GuestAiAltOptions, b: GuestAiAltOptions): boolean {
  if ("scrubbed" in (a as object) || "scrubbed" in (b as object)) return false;
  return a.purpose === b.purpose && a.outputLanguage === b.outputLanguage;
}

export function isGuestAiAltMime(mime: string | null | undefined): boolean {
  const m = (mime || "").toLowerCase();
  return m === "image/jpeg" || m === "image/jpg" || m === "image/png" || m === "image/webp";
}

export function stripHtmlAndControls(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function clampText(raw: unknown, max: number): string {
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  const s = stripHtmlAndControls(String(raw));
  if (s.length <= max) return s;
  return s.slice(0, max).trim();
}

/** Latin ASCII SEO slug — Urdu text fields stay Urdu; filenames never use Nastaliq. */
export function sanitizeGuestAiFilename(raw: unknown): string {
  const input = String(raw ?? "");
  if (input.includes("..") || input.includes("/") || input.includes("\\")) {
    return "image";
  }
  const lower = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp|gif)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, GUEST_AI_FILENAME_MAX)
    .replace(/-+$/g, "");
  if (!lower) return "image";
  return lower;
}

export function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const k = clampText(item, GUEST_AI_KEYWORD_LEN_MAX).toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= GUEST_AI_KEYWORDS_MAX) break;
  }
  return out;
}

export function normalizeGuestAiStructured(raw: unknown): GuestAiStructuredResult {
  if (!raw || typeof raw !== "object") throw new Error("RESPONSE_INVALID");
  const obj = raw as Record<string, unknown>;
  // Map dashboard-shaped fields if a reused model returns them.
  const shortDesc =
    obj.shortDescription ?? obj.description ?? obj.short_description ?? "";
  const longDesc = obj.longDescription ?? obj.long_description ?? shortDesc;
  const filenameRaw = obj.filename ?? obj.filenameSuggestion ?? "image";

  const result: GuestAiStructuredResult = {
    schemaVersion: GUEST_AI_SCHEMA_VERSION,
    altText: clampText(obj.altText ?? obj.alt_text, GUEST_AI_ALT_MAX),
    title: clampText(obj.title, GUEST_AI_TITLE_MAX),
    caption: clampText(obj.caption, GUEST_AI_CAPTION_MAX),
    shortDescription: clampText(shortDesc, GUEST_AI_SHORT_DESC_MAX),
    longDescription: clampText(longDesc, GUEST_AI_LONG_DESC_MAX),
    filename: sanitizeGuestAiFilename(filenameRaw),
    keywords: normalizeKeywords(obj.keywords),
  };

  if (!result.altText || !result.title || !result.shortDescription) {
    throw new Error("RESPONSE_INVALID");
  }
  const len = JSON.stringify(result).length;
  if (len > GUEST_AI_RESULT_MAX_CHARS) throw new Error("RESULT_TOO_LARGE");
  return result;
}

export type GuestAiExportLabels = {
  purpose: string;
  language: string;
  altText: string;
  title: string;
  caption: string;
  shortDescription: string;
  longDescription: string;
  filename: string;
  keywords: string;
  warning: string;
  generatedAt: string;
  expiresAt: string;
};

export function formatGuestAiAltTxt(
  summary: GuestAiAltResultSummary,
  labels: GuestAiExportLabels,
  expiresAt?: string | null,
): string {
  const r = summary.result;
  const lines = [
    labels.warning,
    "",
    `${labels.purpose}: ${summary.purpose}`,
    `${labels.language}: ${summary.outputLanguage}`,
    `${labels.generatedAt}: ${summary.generatedAt}`,
    expiresAt ? `${labels.expiresAt}: ${expiresAt}` : null,
    "",
    `${labels.altText}:`,
    r.altText,
    "",
    `${labels.title}:`,
    r.title,
    "",
    `${labels.caption}:`,
    r.caption || "—",
    "",
    `${labels.shortDescription}:`,
    r.shortDescription,
    "",
    `${labels.longDescription}:`,
    r.longDescription || "—",
    "",
    `${labels.filename}:`,
    r.filename,
    "",
    `${labels.keywords}:`,
    r.keywords.join(", ") || "—",
    "",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function formatGuestAiAltJson(
  summary: GuestAiAltResultSummary,
  expiresAt?: string | null,
): string {
  return `${JSON.stringify(
    {
      schemaVersion: summary.schemaVersion,
      purpose: summary.purpose,
      outputLanguage: summary.outputLanguage,
      result: {
        altText: summary.result.altText,
        title: summary.result.title,
        caption: summary.result.caption,
        shortDescription: summary.result.shortDescription,
        longDescription: summary.result.longDescription,
        filename: summary.result.filename,
        keywords: summary.result.keywords,
      },
      generatedAt: summary.generatedAt,
      expiresAt: expiresAt ?? null,
    },
    null,
    2,
  )}\n`;
}
