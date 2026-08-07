# Multilingual prompt — inspection

Date: 2026-08-07

## Baseline before change

| Area | State |
|------|--------|
| Locales | `en`, `ur` only |
| Prefix mode | `localePrefix: "always"` → English at `/en/...` |
| RTL | `ur` only |
| SEO helpers | Always inserted `/${locale}` into absolute URLs |
| Messages | Full `en.json` / `ur.json` + guest packs; no EN merge fallback |
| Language switcher | Hardcoded English / Urdu `<option>`s |
| Marketing body | Binary `locale === "ur" ? ur : en` |

## Goals of this prompt

- English at root (`/`, `/compress-image`) — never `/en/`
- 24 other locales under `/{locale}/...`
- Permanent 301 from `/en` and `/en/*` to unprefixed English
- Chrome / nav / tool-shell strings for all 25 locales
- Deep marketing body falls back to English when a locale pack is incomplete
- RTL for `ar` + `ur`
- Self-canonical + full hreflang (incl. `x-default` → English)
- No changes to guest Sharp pipelines, R2, cleanup, Stripe products, dashboard features, or API contracts
- Do not reintroduce public AI Alt Text

## Locales (25)

`en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `pl`, `sv`, `tr`, `ru`, `uk`, `ja`, `ko`, `th`, `id`, `ms`, `vi`, `hi`, `ar`, `el`, `bg`, `sw`, `ca`, `ur`

## Risks noted

- Many hard-coded `/en/...` URLs in verify scripts and older docs (out of scope for runtime; local smoke uses new paths)
- Incomplete chrome packs still merge over English — intentional
- Large sitemap (paths × 25 locales)
- next-intl `as-needed` + middleware `/en` strip can 301-loop unless English rewrites are tagged (see completion doc)
