/**
 * Server-only guest AI alt-text prompt — no browser freeform text.
 */
import {
  GUEST_AI_ALT_MAX,
  GUEST_AI_CAPTION_MAX,
  GUEST_AI_FILENAME_MAX,
  GUEST_AI_KEYWORDS_MAX,
  GUEST_AI_LONG_DESC_MAX,
  GUEST_AI_SCHEMA_VERSION,
  GUEST_AI_SHORT_DESC_MAX,
  GUEST_AI_TITLE_MAX,
  type GuestAiLanguage,
  type GuestAiPurpose,
} from "@/server/guest/ai-alt-policy";

export function buildGuestAiAltPrompt(params: {
  purpose: GuestAiPurpose;
  language: GuestAiLanguage;
}): {system: string; user: string; promptVersion: string} {
  const langName = params.language === "ur" ? "Urdu" : "English";
  const purposeLine =
    params.purpose === "accessibility"
      ? "Optimize for screen-reader accessibility; avoid marketing language."
      : params.purpose === "ecommerce"
        ? "Describe the visible product honestly; invent no specs, prices, brands, or materials."
        : params.purpose === "blog"
          ? "Write natural supporting metadata suitable for a blog article."
          : params.purpose === "social"
            ? "Write concise social-friendly metadata without hype or inventing trends."
            : "Optimize for SEO while staying factual to visible content.";

  const system = [
    `You generate image SEO metadata in ${langName} only.`,
    "Ground every field in visible image content only.",
    "Never identify people by name. Never invent brands, locations, model numbers, or claims.",
    "Never infer sensitive traits. Avoid keyword stuffing.",
    "Avoid starting alt text with 'image of' or 'picture of' unless necessary.",
    purposeLine,
    `Return JSON only with keys: schemaVersion ("${GUEST_AI_SCHEMA_VERSION}"), altText (max ${GUEST_AI_ALT_MAX}), title (max ${GUEST_AI_TITLE_MAX}), caption (max ${GUEST_AI_CAPTION_MAX}), shortDescription (max ${GUEST_AI_SHORT_DESC_MAX}), longDescription (max ${GUEST_AI_LONG_DESC_MAX}), filename (Latin ASCII slug a-z0-9-hyphen, max ${GUEST_AI_FILENAME_MAX}, no extension), keywords (array up to ${GUEST_AI_KEYWORDS_MAX} plain strings).`,
    "Plain text only. No HTML. No Markdown fences.",
  ].join(" ");

  return {
    system,
    user: `Purpose code: ${params.purpose}. Language: ${params.language}. Describe this image for the JSON schema.`,
    promptVersion: "guest-ai-alt-v2",
  };
}
