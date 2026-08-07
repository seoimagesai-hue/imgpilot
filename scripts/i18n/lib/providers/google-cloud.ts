/**
 * Google Cloud Translation API v2 adapter (CLI-only).
 * Requires GOOGLE_TRANSLATE_API_KEY.
 */
import type {TranslationBatch, TranslationBatchResult, TranslationProvider} from "./types";

export function createGoogleCloudProvider(apiKey: string): TranslationProvider {
  return {
    id: "google-cloud",
    configured: Boolean(apiKey),
    estimateCostUsd: (chars) => (chars / 1_000_000) * 20,
    async translateBatch(input: TranslationBatch): Promise<TranslationBatchResult> {
      const url = new URL("https://translation.googleapis.com/language/translate/v2");
      url.searchParams.set("key", apiKey);
      const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          q: input.units.map((u) => u.source),
          source: "en",
          target: input.locale,
          format: "text",
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`Google Cloud Translate HTTP ${res.status}`);
      const data = (await res.json()) as {
        data: {translations: {translatedText: string}[]};
      };
      const units = input.units.map((u, i) => ({
        key: u.key,
        source: u.source,
        target: data.data.translations[i]?.translatedText || u.source,
      }));
      return {
        locale: input.locale,
        units,
        provider: "google-cloud",
        estimatedCostUsd: this.estimateCostUsd?.(
          input.units.reduce((n, u) => n + u.source.length, 0),
        ),
      };
    },
  };
}
