# Multilingual prompt — completion

Date: 2026-08-07

## Delivered

### Routing

- [`src/i18n/routing.ts`](../src/i18n/routing.ts) — 25 locales, `localePrefix: "as-needed"`, RTL helpers, native names, `localePath`
- [`src/middleware.ts`](../src/middleware.ts) — permanent **301** `/en` → `/`, `/en/*` → `/*`
- [`src/i18n/request.ts`](../src/i18n/request.ts) — deep-merge English base + locale overlay (core + guest)

### SEO

- Prefix-aware `absoluteUrl` / `hreflangAlternates` / OG locale map in [`src/server/marketing/seo.ts`](../src/server/marketing/seo.ts)
- Sitemap + robots updated for unprefixed English and prefixed locales
- JSON-LD / tool landing shells use `absoluteUrl`

### UI

- `html lang` + `dir` for `ar`/`ur` RTL
- Language switcher lists all locales by **native name** (no flags)

### Messages

- Chrome/nav/guest chrome packs for 23 new locales via [`scripts/i18n/generate-chrome-packs.js`](../scripts/i18n/generate-chrome-packs.js)
- Existing rich `ur` packs retained; EN remains source of truth

### Marketing

- `localizedCopy()` EN fallback for landing-content getters
- Landing views use `absoluteUrl` + `isRtlLocale`

### URL plumbing (minimal)

- Auth callbacks accept unprefixed English + `/{locale}/...`; strip legacy `/en`
- Auth pages → `/login`; not-found → `/`; checkout return URLs via `localePath`
- Geolocation Permissions-Policy on `/geotag-image` and `/:locale/geotag-image`

## Explicit non-goals (unchanged)

- Guest processing engines, R2, cleanup workers
- Stripe products / plan catalog logic
- Dashboard feature work / API contracts
- Full professional translation of every SEO landing paragraph
- Public AI Alt Text nav reintroduction

## Verification

- `npx vitest run tests/routing.test.ts` — **21/21 passed**
- Production build (`NEXT_DIST_DIR=.next-i18n-verify`) — succeeded
- HTTP smoke on `http://127.0.0.1:3020`:
  - `/`, `/compress-image` → **200**, `lang=en`, `dir=ltr`
  - `/en/compress-image` → **301** → `/compress-image` → **200**
  - `/es/compress-image` → **200**, `lang=es`
  - `/ar/compress-image` → **200**, `dir=rtl`
  - `/ur/compress-image` → **200**, `dir=rtl`
- Browser script: `npx tsx scripts/verify-i18n-browser.ts [baseUrl]` (requires Playwright Chromium — `npx playwright install`; CDN install failed in this environment with ENOTFOUND)

### Middleware note

`localePrefix: "as-needed"` alone caused same-URL redirect loops when combined with a naive `/en` strip (middleware re-runs on the internal `/en` rewrite). English unprefixed routes are handled with a tagged rewrite (`x-seoimages-en-rewrite`) so external `/en/*` still permanently redirects without looping.
