/**
 * Prompt 31 — fixed AI metadata template catalog (server-only).
 */
import type {MetadataOutputLanguage} from "@/server/images/ai-metadata-policy";

export const AI_METADATA_TEMPLATE_CODES = ["seo", "accessibility", "ecommerce"] as const;
export type AiMetadataTemplateCode = (typeof AI_METADATA_TEMPLATE_CODES)[number];

export type AiMetadataTemplateDefinition = {
  code: AiMetadataTemplateCode;
  displayNameKey: string;
  supportedLanguages: readonly MetadataOutputLanguage[];
  outputFields: readonly ("altText" | "title" | "caption" | "description" | "filenameSuggestion")[];
  promptVersion: string;
  active: boolean;
};

const TEMPLATE_CATALOG: Record<AiMetadataTemplateCode, AiMetadataTemplateDefinition> = {
  seo: {
    code: "seo",
    displayNameKey: "metadata.templates.seo",
    supportedLanguages: ["en", "ur"],
    outputFields: ["altText", "title", "caption", "description", "filenameSuggestion"],
    promptVersion: "metadata-v1",
    active: true,
  },
  accessibility: {
    code: "accessibility",
    displayNameKey: "metadata.templates.accessibility",
    supportedLanguages: ["en", "ur"],
    outputFields: ["altText", "title", "caption", "description", "filenameSuggestion"],
    promptVersion: "metadata-accessibility-v1",
    active: true,
  },
  ecommerce: {
    code: "ecommerce",
    displayNameKey: "metadata.templates.ecommerce",
    supportedLanguages: ["en", "ur"],
    outputFields: ["altText", "title", "caption", "description", "filenameSuggestion"],
    promptVersion: "metadata-ecommerce-v1",
    active: true,
  },
};

export function getTemplate(code: string | null | undefined): AiMetadataTemplateDefinition | null {
  if (!code) return null;
  const key = code as AiMetadataTemplateCode;
  return TEMPLATE_CATALOG[key] ?? null;
}

export function isActiveTemplate(code: string | null | undefined): code is AiMetadataTemplateCode {
  const template = getTemplate(code);
  return Boolean(template?.active);
}

export function listActiveTemplates(): AiMetadataTemplateDefinition[] {
  return AI_METADATA_TEMPLATE_CODES.map((code) => TEMPLATE_CATALOG[code]).filter((t) => t.active);
}

/** Derive template code from a stored promptVersion string. */
export function templateCodeFromPromptVersion(promptVersion: string | null | undefined): AiMetadataTemplateCode {
  if (promptVersion === "metadata-accessibility-v1") return "accessibility";
  if (promptVersion === "metadata-ecommerce-v1") return "ecommerce";
  return "seo";
}
