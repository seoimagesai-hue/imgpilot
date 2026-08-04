import {
  AI_METADATA_PROMPT_VERSION,
  ALT_TEXT_MAX,
  ALT_TEXT_TARGET_MAX,
  ALT_TEXT_TARGET_MIN,
  CAPTION_MAX,
  DESCRIPTION_MAX,
  FILENAME_SUGGESTION_MAX,
  TITLE_MAX,
  type MetadataOutputLanguage,
} from "@/server/images/ai-metadata-policy";
import {
  getTemplate,
  type AiMetadataTemplateCode,
} from "@/server/images/ai-metadata-templates";

export type MetadataPromptContext = {
  language: MetadataOutputLanguage;
  projectName?: string | null;
  websiteHostname?: string | null;
  businessDescription?: string | null;
  templateCode?: AiMetadataTemplateCode;
};

function systemInstructions(templateCode: AiMetadataTemplateCode, langName: string): string {
  const shared = [
    `You generate image metadata in ${langName} only.`,
    "Ground every field in visible image content.",
    "Never identify people by name. Use generic terms (a person, two people).",
    "Never infer race, religion, health, politics, sexuality, or other sensitive traits.",
    `Alt text: concise, meaningful, target ${ALT_TEXT_TARGET_MIN}-${ALT_TEXT_TARGET_MAX} chars, hard max ${ALT_TEXT_MAX}.`,
    `Title: short descriptive, max ${TITLE_MAX} chars.`,
    `Caption: one sentence or null if not useful, max ${CAPTION_MAX}.`,
    `Description: richer than alt, still visible-only, max ${DESCRIPTION_MAX}.`,
    `filenameSuggestion: Latin ASCII SEO slug only (a-z, 0-9, hyphens), max ${FILENAME_SUGGESTION_MAX}, no extension, no paths.`,
  ];

  if (templateCode === "accessibility") {
    return [
      ...shared,
      "Focus on accessibility: describe what is visible for screen-reader users.",
      "Do not emphasize SEO keywords or marketing language.",
      "Do not invent brands, services, or claims.",
      "Avoid starting with 'image of' unless necessary.",
    ].join(" ");
  }

  if (templateCode === "ecommerce") {
    return [
      ...shared,
      "Describe the product or item visible in the image.",
      "Do not invent specifications, prices, materials, brands, model numbers, or sizes.",
      "Do not claim product features that are not clearly visible.",
      "Avoid keyword stuffing.",
    ].join(" ");
  }

  // seo (default)
  return [
    ...shared,
    "Optimize for SEO while staying factual to visible content.",
    "Do not invent brands, services, or claims.",
    "Do not use keyword stuffing. Avoid starting with 'image of' unless necessary.",
  ].join(" ");
}

export function buildMetadataPrompt(ctx: MetadataPromptContext): {
  system: string;
  user: string;
  promptVersion: string;
} {
  const templateCode = ctx.templateCode ?? "seo";
  const template = getTemplate(templateCode);
  const promptVersion = template?.promptVersion ?? AI_METADATA_PROMPT_VERSION;
  const langName = ctx.language === "ur" ? "Urdu" : "English";
  const system = [
    systemInstructions(templateCode, langName),
    "Return JSON only matching the schema. Prompt version: " + promptVersion,
  ].join(" ");

  const contextBits = [
    ctx.projectName ? `Project name: ${ctx.projectName}` : null,
    ctx.websiteHostname ? `Website host: ${ctx.websiteHostname}` : null,
    ctx.businessDescription ? `Business description: ${ctx.businessDescription.slice(0, 200)}` : null,
  ].filter(Boolean);

  const user = [
    `Language code: ${ctx.language}`,
    `Template: ${templateCode}`,
    contextBits.length ? `Optional project context (do not invent beyond image):\n${contextBits.join("\n")}` : null,
    "Produce JSON: {altText,title,caption,description,filenameSuggestion,language}",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {system, user, promptVersion};
}
