# Compress PNG landing redesign — completion

## Scope
Dedicated `/compress-png` premium landing with transparency/logos/UI focus (distinct from Compress JPG). EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/compress-png/page.tsx`
- Copy: `src/lib/marketing/compress-png-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/compress-png-{hero,compare,steps}.webp`
- Same guest compress engine via `LandingToolWorkspace` + presentation overrides only
- Related tools: compress-jpg, resize-png, png-to-jpg, png-to-webp, crop-png, bulk-image-tools

## Verification
- typecheck / lint (warnings only) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3022/en/compress-png` and `/ur/compress-png`
