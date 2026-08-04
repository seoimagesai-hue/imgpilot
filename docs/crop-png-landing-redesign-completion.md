# Crop PNG landing redesign — completion

## Scope
Dedicated `/crop-png` premium landing focused on **transparent logos, icons and UI graphics** — distinct from Crop JPG photo composition. EN + full Urdu RTL.

## Shipped
- `src/app/[locale]/(marketing)/(seo-landings)/crop-png/page.tsx`
- `src/components/marketing/crop-png-landing-view.tsx`
- `src/components/marketing/crop-png-ctas.tsx`
- `src/lib/marketing/crop-png-landing-content.ts` (`getCropPngCopy`, `cropPngSeoCompat`)
- Illustrations: `public/illustrations/crop-png-{hero,compare,steps}.webp`
- SEO wired via `cropPngSeoCompat()` in `tool-landing-content.ts`
- Registry meta/related updated in `tool-landing-registry.ts`
- Generic `[slug]` catch-all excludes `crop-png`

## Prompt coverage
Breadcrumb · Hero · Upload · Trust strip · Intro · Popular crop presets · Benefits · How it works · Cropping transparent images · Use cases · Tips · FAQ (10) · Related tools · Bottom CTA · JSON-LD (WebApplication, BreadcrumbList, FAQPage, Organization)

## Backend unchanged
Same crop engine via `LandingToolWorkspace` with `sourceFormat: png`. Honest ratios only: free, 1:1, 16:9, 3:4 (Icon/Logo/Custom map to supported options).

## Verification (2026-08-03)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-crop-png-verify npm run build` — pass
- Smoke `http://127.0.0.1:3033/en/crop-png` — 200, hero/upload/FAQ/schema/related OK
- Smoke `http://127.0.0.1:3033/ur/crop-png` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/crop-png-*.webp` — 200
