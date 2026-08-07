# Phase 3 Translation — Source Inspection

## Date
2026-08-07

## Baseline (pre Prompt 1)

- next-intl routing with 25 locales; English unprefixed (`localePrefix: as-needed`)
- Permanent 301 `/en/*` → English root
- Prefix-aware SEO helpers (canonical, hreflang, sitemap)
- Chrome overlays in `src/messages/{locale}.json` + `src/messages/guest/{locale}.json` (partial for most locales)
- Long-form marketing mostly in TypeScript modules (`homepage-content.ts`, `tool-landing-copy.ts`, `seo-tool-landing-copy.ts`) with EN/UR packs
- Playwright Chromium previously Blocked (`cdn.playwright.dev` ENOTFOUND)

## Content inventory (English masters)

| Layer | Source | Approx. keys |
| --- | --- | --- |
| Layer 1 UI | `src/messages/en.json` namespaces + `guest/en.json` | ~708 flattened |
| Layer 2 tools | `src/lib/marketing/tool-landing-copy.ts` | ~552 |
| Layer 3 homepage | `src/lib/marketing/homepage-content.ts` | ~230 |
| Layer 4 SEO landings | registry + `seo-tool-landing-copy.ts` (19 indexable) | ~1463 flat with shells |

Unique English strings across catalogs: ~1430.

## Gaps found

1. Non-EN message overlays were chrome-only — Layer 1 incomplete (English merge fallback).
2. Tool/homepage/SEO long-form not catalogized per locale (except UR homepage).
3. No extract/audit/translate CLI, glossary, TM, or translation statuses.
4. Sitemap/hreflang advertised all locales even when marketing body was English duplicate.
5. SEO landing pages ignored locale catalogs.

## Non-goals confirmed

No changes to guest Sharp pipelines, R2, cleanup, auth, Stripe, pricing logic, dashboard business features, or URL slug localization.
