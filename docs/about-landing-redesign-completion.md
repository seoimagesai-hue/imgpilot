# About page redesign — completion

## Scope
Premium SaaS company / EEAT page at `/about`. EN + full Urdu RTL. Illustration-led (no team photos). Honest story — no fake dates or stats.

## Shipped
- Rewrote `src/app/[locale]/(marketing)/about/page.tsx` with locale metadata + view
- `src/components/marketing/about-landing-view.tsx`
- `src/lib/marketing/about-landing-content.ts`
- Illustration: `public/illustrations/about-hero.webp`

## Constraints honored
- Header / footer / global layout untouched
- Route remains `/about`
- SEO via existing `buildPublicMetadata` + AboutPage / Organization / BreadcrumbList schema
- HEIC / AVIF labeled as future support only

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-about-verify npm run build` — pass
- Smoke `http://127.0.0.1:3042/en/about` — 200, hero/mission/story/why/values/different/formats/security/FAQ(8)/schema/CTA OK
- Smoke `http://127.0.0.1:3042/ur/about` — 200, `dir="rtl"` + Urdu copy OK
- Illustration `/illustrations/about-hero.webp` — 200
- CTA links `/` and `/contact` — 200
