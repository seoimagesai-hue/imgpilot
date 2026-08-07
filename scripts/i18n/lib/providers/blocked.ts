import type {TranslationBatch, TranslationBatchResult, TranslationProvider} from "./types";

/** Used when no provider credentials are configured. */
export function createBlockedProvider(): TranslationProvider {
  return {
    id: "blocked",
    configured: false,
    async translateBatch(input: TranslationBatch): Promise<TranslationBatchResult> {
      throw new Error(
        `Translation provider Blocked: no API key configured for locale=${input.locale}. ` +
          `Audit/extract still work; set OPENAI_API_KEY, DEEPL_API_KEY, or GOOGLE_TRANSLATE_API_KEY to enable translate.`,
      );
    },
    estimateCostUsd: () => undefined,
  };
}
