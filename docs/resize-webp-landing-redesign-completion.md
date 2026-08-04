# Resize WebP landing redesign — completion

## Scope
Dedicated `/resize-webp` premium landing focused on **responsive WebP delivery for modern websites** — distinct from Resize JPG and Resize PNG. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/resize-webp/page.tsx`
- Copy: `src/lib/marketing/resize-webp-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/resize-webp-{hero,compare,steps}.webp`
- Responsive presets, device comparison table, Compress WebP highlight, 10 FAQs, related tools
- Same resize engine via `LandingToolWorkspace` (`sourceFormat: webp`, popular sizes)

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build (`.next-resize-webp-verify`) — pass
- Smoke: `http://127.0.0.1:3032/en/resize-webp` and `/ur/resize-webp`
