/**
 * Unofficial Google Translate (client=gtx) adapter for CLI bootstrap only.
 * Enabled via I18N_ALLOW_PUBLIC_MT=1 when no commercial API key is set.
 * Output MUST be labelled machine_translated — never "approved".
 */
import type {TranslationBatch, TranslationBatchResult, TranslationProvider} from "./types";

const GTX_LOCALE: Record<string, string> = {
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt",
  nl: "nl",
  pl: "pl",
  sv: "sv",
  tr: "tr",
  ru: "ru",
  uk: "uk",
  ja: "ja",
  ko: "ko",
  th: "th",
  id: "id",
  ms: "ms",
  vi: "vi",
  hi: "hi",
  ar: "ar",
  el: "el",
  bg: "bg",
  sw: "sw",
  ca: "ca",
  ur: "ur",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Protect ICU/next-intl placeholders and glossary literals from MT mangling. */
export function protectForMt(text: string, doNotTranslate: string[]): {
  masked: string;
  restore: (s: string) => string;
} {
  const slots: string[] = [];
  const push = (raw: string) => {
    const id = slots.length;
    slots.push(raw);
    return `⟦PH${id}⟧`;
  };

  let masked = text;
  // Longer glossary terms first
  const terms = [...doNotTranslate].sort((a, b) => b.length - a.length);
  for (const term of terms) {
    if (!term) continue;
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    masked = masked.replace(re, (m) => push(m));
  }
  masked = masked.replace(/\{[^{}]+\}/g, (m) => push(m));
  masked = masked.replace(/<\/?[a-zA-Z][^>]*>/g, (m) => push(m));

  return {
    masked,
    restore: (translated: string) => {
      let out = translated;
      for (let i = 0; i < slots.length; i++) {
        const patterns = [
          new RegExp(`⟦\\s*PH\\s*${i}\\s*⟧`, "gi"),
          new RegExp(`\\[\\s*PH\\s*${i}\\s*\\]`, "gi"),
          new RegExp(`PH\\s*${i}`, "g"),
        ];
        for (const re of patterns) {
          if (re.test(out)) {
            out = out.replace(re, slots[i]!);
            break;
          }
        }
      }
      // Fallback positional restore if markers remain missing
      for (let i = 0; i < slots.length; i++) {
        if (!out.includes(slots[i]!) && out.includes(`⟦PH${i}⟧`)) {
          out = out.replace(`⟦PH${i}⟧`, slots[i]!);
        }
      }
      return out;
    },
  };
}

async function gtxTranslate(text: string, target: string, retries = 5): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(url, {signal: controller.signal});
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        throw new Error(`gtx HTTP ${res.status}`);
      }
      const data = (await res.json()) as unknown;
      const chunks = (data as [Array<[string]>])[0];
      if (!Array.isArray(chunks)) throw new Error("gtx unexpected payload");
      return chunks.map((c) => c[0]).join("");
    } catch (err) {
      lastErr = err;
      await sleep(1000 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("gtx failed");
}

export function createGtxProvider(doNotTranslate: string[] = []): TranslationProvider {
  let lastCall = 0;
  return {
    id: "gtx-public",
    configured: true,
    estimateCostUsd: () => 0,
    async translateBatch(input: TranslationBatch): Promise<TranslationBatchResult> {
      const tl = GTX_LOCALE[input.locale];
      if (!tl) throw new Error(`Unsupported locale for gtx: ${input.locale}`);

      const results = new Map<string, {key: string; source: string; target: string}>();
      const queue = [...input.units];
      const concurrency = 3;

      async function worker() {
        while (queue.length) {
          const unit = queue.shift();
          if (!unit) return;
          const now = Date.now();
          const wait = Math.max(0, 60 - (now - lastCall));
          if (wait) await sleep(wait);
          lastCall = Date.now();

          if (!unit.source.trim()) {
            results.set(unit.key, {key: unit.key, source: unit.source, target: unit.source});
            continue;
          }
          if (
            /^(Img Pilot|JPG|JPEG|PNG|WebP|AVIF|EXIF|GPS|SEO|HTML|JSON|CSV|ZIP|CMS|Docs)$/i.test(
              unit.source.trim(),
            )
          ) {
            results.set(unit.key, {key: unit.key, source: unit.source, target: unit.source});
            continue;
          }
          const {masked, restore} = protectForMt(unit.source, doNotTranslate);
          try {
            const raw = await gtxTranslate(masked, tl);
            results.set(unit.key, {key: unit.key, source: unit.source, target: restore(raw)});
          } catch (err) {
            console.warn(
              `gtx unit failed (${tl}): ${(err instanceof Error ? err.message : String(err)).slice(0, 80)}`,
            );
            // Leave untranslated so a later resume pass can fill it; do not abort whole locale.
            results.set(unit.key, {key: unit.key, source: unit.source, target: unit.source});
          }
        }
      }

      await Promise.all(Array.from({length: concurrency}, () => worker()));
      const units = input.units.map((u) => results.get(u.key)!).filter(Boolean);
      return {locale: input.locale, units, provider: "gtx-public", estimatedCostUsd: 0};
    },
  };
}
