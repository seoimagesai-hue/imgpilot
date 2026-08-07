# Phase 3 Translation Architecture

## Principles

- English is the sole source of truth.
- No runtime machine translation in the browser.
- CLI-only providers; API keys never enter client bundles.
- Incomplete localized pages must not be indexed.
- Machine output is labelled `machine_translated` until human review.

## File layout

### next-intl messages (Layer 1 runtime UI)

```
src/messages/en.json
src/messages/{locale}.json
src/messages/guest/en.json
src/messages/guest/{locale}.json
```

Loader: `src/i18n/request.ts` deep-merges EN base + locale overlay (safety net). Layer 1 packs are expected to be complete so overlays do not leave English chrome.

### Marketing catalogs (Layers 2–4)

```
src/content/locales/en/{homepage,tools,seo-landings,layer1-ui}.json
src/content/locales/{locale}/…
src/content/locales/_status/{locale}.json
```

Readers: `src/i18n/content/load-catalog.ts` → homepage/tools/SEO getters.

### Pipeline artifacts

```
src/i18n/glossary.json
src/i18n/translation-memory.json
reports/i18n/{locale}.json
reports/i18n/_summary.json
```

## CLI

| Script | Command |
| --- | --- |
| Extract EN catalogs | `npm run i18n:extract` |
| Audit + reports + status | `npm run i18n:audit` |
| Translate one / all | `npm run i18n:translate -- --locale=es` / `--all` |
| Bootstrap all waves | `npm run i18n:populate-curated` |

Flags: `--dry-run`, `--force` (overwrite non-approved carefully), `--layer=layer1|homepage|tools|seo`.

## Provider abstraction

`scripts/i18n/lib/providers/`

Priority:

1. `OPENAI_API_KEY` → OpenAI
2. `DEEPL_API_KEY` → DeepL
3. `GOOGLE_TRANSLATE_API_KEY` → Google Cloud Translation
4. `I18N_ALLOW_PUBLIC_MT=1` → public GTX bootstrap (CLI-only, labelled MT)
5. else → **Blocked** (audit/manual files still work)

## Status model

Per locale file `_status/{locale}.json`:

- layers: `layer1_ui`, `layer2_tools`, `layer3_homepage`, `layer4_seo`
- pages: path → `missing | machine_translated | reviewed | approved | stale | english_fallback`

## Indexability gate

`src/i18n/indexability.ts` + `buildPublicMetadata` / sitemap / hreflang:

- English always indexable
- Other locales require Layer 1 present and page status in `{machine_translated, reviewed, approved}`
- Incomplete pages → `robots: noindex` and omitted from sitemap/hreflang

## URL / slug policy

English route slugs kept for all locales (`/es/compress-image`). Localized slugs deferred.

## Formatting & bidi

- `src/i18n/format.ts` — numbers, dates, relative time, re-exports `formatByteSize`
- `src/lib/format-bytes.ts` — locale-aware sizes; unit labels stay `B/KB/MB…`
- `src/i18n/bidi.ts` — LTR isolate helpers; technical dimensions stay Western digits (product policy)
- `dir=rtl` for `ar` and `ur` only

## Performance

- Message loaders are per-locale dynamic imports (only active locale in the request)
- Catalogs are server-read JSON (not shipped to every visitor as a 25-locale mega-bundle)
- Provider keys exist only in CLI env
