# Compress JPG landing redesign — completion

## Scope
Premium marketing redesign for **`/compress-jpg` only** (EN + full Urdu). Guest compress pipeline unchanged.

## Shipped
- Dedicated route: `src/app/[locale]/(marketing)/(seo-landings)/compress-jpg/page.tsx`
- Copy EN/UR: `src/lib/marketing/compress-jpg-landing-content.ts`
- View + CTAs + live comparison listener
- Illustrations: `public/illustrations/compress-jpg-{hero,compare,steps}.webp`
- Presentation hooks: premium usage/deletion bar, upload labels, 4 trust items, marketing presets (Maximum Quality / Recommended / Smaller File / Custom), quality slider 1–100 on this landing only, result events for live comparison, external reset CTA
- Metadata + WebApplication / BreadcrumbList / FAQPage schema

## Verification
- typecheck / lint (warnings only) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3021/en/compress-jpg` and `/ur/compress-jpg` — 200, H1, tool copy, schema, RTL on UR
