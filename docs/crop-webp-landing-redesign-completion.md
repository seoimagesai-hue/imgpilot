# Crop WebP landing redesign — completion

## Scope
Dedicated `/crop-webp` premium landing focused on **modern web-optimized WebP crops** for responsive sites — distinct from Crop JPG (photos) and Crop PNG (transparent graphics). EN + full Urdu RTL.

## Shipped
- `src/app/[locale]/(marketing)/(seo-landings)/crop-webp/page.tsx`
- `src/components/marketing/crop-webp-landing-view.tsx`
- `src/components/marketing/crop-webp-ctas.tsx`
- `src/lib/marketing/crop-webp-landing-content.ts` (`getCropWebpCopy`, `cropWebpSeoCompat`)
- Illustrations: `public/illustrations/crop-webp-{hero,compare,steps}.webp`
- SEO wired via `cropWebpSeoCompat()` in `tool-landing-content.ts`
- Registry meta/related updated in `tool-landing-registry.ts`
- Generic `[slug]` catch-all excludes `crop-webp`

## Prompt coverage
Breadcrumb · Hero · Upload · Trust strip · Intro · Popular crop ratios · Benefits · How it works · Why crop before publishing (+ Resize/Compress links) · Use cases · Tips · FAQ (10) · Related tools · Bottom CTA · JSON-LD (WebApplication, BreadcrumbList, FAQPage, Organization)

## Honest ratio mapping
Engine supports: free, 1:1, 4:3, 3:4, 16:9, 9:16.  
Prompt “4:5 Social Post” → card shows engine **3:4**.  
Prompt “3:2 Standard” → card shows engine **4:3**.

## Backend unchanged
Same crop engine via `LandingToolWorkspace` with `sourceFormat: webp`.

## Verification (2026-08-03)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-crop-webp-verify npm run build` — pass
- Smoke `http://127.0.0.1:3034/en/crop-webp` — 200, hero/upload/FAQ/schema/related/ratio badges OK
- Smoke `http://127.0.0.1:3034/ur/crop-webp` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/crop-webp-*.webp` — 200
