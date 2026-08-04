/**
 * AI metadata policy — Prompt 17.
 */
export const METADATA_OPERATION = "generate_metadata" as const;
export const AI_METADATA_PROMPT_VERSION = "metadata-v1";
export const AI_ANALYSIS_MAX_EDGE = 1280;
export const AI_REQUEST_TIMEOUT_MS = 60_000;
export const AI_MAX_RETRIES = 2;
export const AI_MAX_CONCURRENT = 2;
export const AI_MAX_GENERATIONS_PER_IMAGE_PER_DAY = 20;
export const AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY = 200;

/** Prompt 31 — AI metadata batch orchestration limits. */
export const AI_BATCH_MAX_IMAGES = 50;
export const AI_BATCH_MAX_ACTIVE = 3;
export const AI_BATCH_ENQUEUE_CONCURRENCY = 3;

export const ALT_TEXT_MAX = 200;
export const ALT_TEXT_TARGET_MIN = 80;
export const ALT_TEXT_TARGET_MAX = 160;
export const TITLE_MAX = 80;
export const CAPTION_MAX = 200;
export const DESCRIPTION_MAX = 500;
export const FILENAME_SUGGESTION_MAX = 80;

export const METADATA_LANGUAGES = ["en", "ur"] as const;
export type MetadataOutputLanguage = (typeof METADATA_LANGUAGES)[number];

export function isMetadataOutputLanguage(value: string | null | undefined): value is MetadataOutputLanguage {
  return Boolean(value && (METADATA_LANGUAGES as readonly string[]).includes(value));
}

export type AiPolicySummary = {
  promptVersion: string;
  analysisMaxEdge: number;
  browserCallsProvider: false;
  autoApprove: false;
  autoRename: false;
  /** Prompt 31: bounded batch orchestration via dashboard/API (human review required). */
  bulkAi: true;
  bulkReviewActions: true;
  urduFilenamePolicy: "latin_ascii_slug";
  eligibleStatuses: ["validated", "ready_for_processing"];
};

export function getAiMetadataPolicy(): AiPolicySummary {
  return {
    promptVersion: AI_METADATA_PROMPT_VERSION,
    analysisMaxEdge: AI_ANALYSIS_MAX_EDGE,
    browserCallsProvider: false,
    autoApprove: false,
    autoRename: false,
    bulkAi: true,
    bulkReviewActions: true,
    urduFilenamePolicy: "latin_ascii_slug",
    eligibleStatuses: ["validated", "ready_for_processing"],
  };
}
