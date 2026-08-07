/**
 * DeepL API adapter (CLI-only). Requires DEEPL_API_KEY.
 */
import type {TranslationBatch, TranslationBatchResult, TranslationProvider} from "./types";

const DEEPL_LOCALE: Record<string, string> = {
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT-PT",
  nl: "NL",
  pl: "PL",
  sv: "SV",
  tr: "TR",
  ru: "RU",
  uk: "UK",
  ja: "JA",
  ko: "KO",
  id: "ID",
  // DeepL may not support all; unsupported locales throw and caller falls back.
  ar: "AR",
  bg: "BG",
  el: "EL",
  hi: "HI",
  th: "TH",
  vi: "VI",
  ms: "MS",
  sw: "SW",
  ca: "CA",
  ur: "UR",
};

export function createDeepLProvider(apiKey: string): TranslationProvider {
  return {
    id: "deepl",
    configured: Boolean(apiKey),
    estimateCostUsd: (chars) => (chars / 1_000_000) * 20,
    async translateBatch(input: TranslationBatch): Promise<TranslationBatchResult> {
      const target = DEEPL_LOCALE[input.locale];
      if (!target) throw new Error(`DeepL unsupported locale: ${input.locale}`);
      const endpoint = apiKey.endsWith(":fx")
        ? "https://api-free.deepl.com/v2/translate"
        : "https://api.deepl.com/v2/translate";
      const body = new URLSearchParams();
      for (const u of input.units) body.append("text", u.source);
      body.set("source_lang", "EN");
      body.set("target_lang", target);
      body.set("preserve_formatting", "1");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
      const data = (await res.json()) as {translations: {text: string}[]};
      const units = input.units.map((u, i) => ({
        key: u.key,
        source: u.source,
        target: data.translations[i]?.text || u.source,
      }));
      return {
        locale: input.locale,
        units,
        provider: "deepl",
        estimatedCostUsd: this.estimateCostUsd?.(
          input.units.reduce((n, u) => n + u.source.length, 0),
        ),
      };
    },
  };
}
