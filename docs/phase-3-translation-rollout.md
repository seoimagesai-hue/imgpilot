# Phase 3 Translation Rollout

## Waves

| Wave | Locales |
| --- | --- |
| 1 | es, fr, de, pt, ar |
| 2 | it, nl, pl, tr, ru, ja, ko |
| 3 | uk, sv, el, bg, ca, hi, ur |
| 4 | th, id, ms, vi, sw |

Architecture supports all 25 from day one. Incomplete locales stay structurally valid but **noindex** until audit gates pass.

## Bootstrap command

```bash
# Requires a commercial key OR public bootstrap:
# I18N_ALLOW_PUBLIC_MT=1 npm run i18n:populate-curated
# Optional: --wave=1 | --locale=es
npm run i18n:populate-curated -- --wave=1
npm run i18n:audit
```

Public GTX output is always `machine_translated`, never `approved`.

## Review ladder

1. `machine_translated` — automated, indexable only if validation gates pass
2. `reviewed` — human spot-check
3. `approved` — ready for long-term SEO trust
4. `stale` — English source hash changed; needs re-translation

## Indexing rule

Do not expose thin English-duplicate localized URLs. Sitemap and hreflang include only gate-passing pages.

## Next product prompt

Phase 3 — Prompt 2: Stripe subscriptions, plan entitlements and paid launch setup (do not start in Prompt 1).
