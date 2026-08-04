/**
 * Structured AI metadata output schema + filename sanitization.
 */
import {z} from "zod";
import {AiDomainError} from "@/server/images/ai-errors";
import {
  ALT_TEXT_MAX,
  CAPTION_MAX,
  DESCRIPTION_MAX,
  FILENAME_SUGGESTION_MAX,
  TITLE_MAX,
  isMetadataOutputLanguage,
} from "@/server/images/ai-metadata-policy";

export const metadataOutputSchema = z.object({
  altText: z.string().trim().min(1).max(ALT_TEXT_MAX),
  title: z.string().trim().min(1).max(TITLE_MAX),
  caption: z.string().trim().max(CAPTION_MAX).nullable(),
  description: z.string().trim().min(1).max(DESCRIPTION_MAX),
  filenameSuggestion: z.string().trim().min(1).max(FILENAME_SUGGESTION_MAX),
  language: z.string().trim().min(2).max(8),
});

export type MetadataStructuredOutput = z.infer<typeof metadataOutputSchema>;

/** Latin ASCII SEO slug only — Urdu text fields stay in Urdu; filenames never use Nastaliq. */
export function sanitizeFilenameSuggestion(raw: string): string {
  const lower = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, FILENAME_SUGGESTION_MAX)
    .replace(/-+$/g, "");
  if (!lower || lower.includes("..") || lower.startsWith("/") || lower.includes("\\")) {
    return "image";
  }
  return lower || "image";
}

export function validateStructuredMetadata(raw: unknown): MetadataStructuredOutput {
  const parsed = metadataOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiDomainError("AI_RESPONSE_INVALID");
  }
  if (!isMetadataOutputLanguage(parsed.data.language)) {
    throw new AiDomainError("METADATA_LANGUAGE_UNSUPPORTED");
  }
  const filename = sanitizeFilenameSuggestion(parsed.data.filenameSuggestion);
  return {
    ...parsed.data,
    caption: parsed.data.caption && parsed.data.caption.length > 0 ? parsed.data.caption : null,
    filenameSuggestion: filename,
    altText: stripControl(parsed.data.altText),
    title: stripControl(parsed.data.title),
    description: stripControl(parsed.data.description),
  };
}

function stripControl(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export const metadataEditSchema = z.object({
  altText: z.string().trim().min(1).max(ALT_TEXT_MAX),
  title: z.string().trim().min(1).max(TITLE_MAX),
  caption: z.string().trim().max(CAPTION_MAX).nullable().optional(),
  description: z.string().trim().min(1).max(DESCRIPTION_MAX),
  filenameSuggestion: z.string().trim().min(1).max(FILENAME_SUGGESTION_MAX),
});
