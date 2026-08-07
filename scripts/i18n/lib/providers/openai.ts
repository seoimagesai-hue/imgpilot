import type {TranslationBatch, TranslationBatchResult, TranslationProvider} from "./types";

/**
 * OpenAI Chat Completions translation provider (CLI-only).
 * Never import this from client bundles.
 */
export function createOpenAIProvider(apiKey: string): TranslationProvider {
  const key = apiKey.trim();
  return {
    id: "openai",
    configured: Boolean(key),
    estimateCostUsd(charCount: number) {
      // Rough GPT-4o-mini estimate; display-only
      return Math.round((charCount / 1_000_000) * 0.6 * 10000) / 10000;
    },
    async translateBatch(input: TranslationBatch): Promise<TranslationBatchResult> {
      if (!key) throw new Error("OPENAI_API_KEY missing");
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({apiKey: key, timeout: 60_000, maxRetries: 2});

      const payload = input.units.map((u) => ({key: u.key, text: u.source}));
      const completion = await client.chat.completions.create({
        model: process.env.I18N_OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: {type: "json_object"},
        messages: [
          {
            role: "system",
            content:
              `You are a professional UI translator for a consumer image tooling SaaS called "Img Pilot". ` +
              `Translate to locale "${input.locale}". Keep brand name Img Pilot, and codes JPG JPEG PNG WebP AVIF EXIF GPS SEO HTML JSON CSV ZIP CMS WordPress unchanged. ` +
              `Preserve every {placeholder} exactly. Return JSON: {"items":[{"key":"...","target":"..."}]}`,
          },
          {role: "user", content: JSON.stringify({items: payload})},
        ],
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as {items?: {key: string; target: string}[]};
      const byKey = new Map((parsed.items || []).map((i) => [i.key, i.target]));
      const units = input.units.map((u) => ({
        key: u.key,
        source: u.source,
        target: byKey.get(u.key) || u.source,
      }));
      return {
        locale: input.locale,
        units,
        provider: "openai",
        estimatedCostUsd: this.estimateCostUsd?.(
          input.units.reduce((n, u) => n + u.source.length, 0),
        ),
      };
    },
  };
}
