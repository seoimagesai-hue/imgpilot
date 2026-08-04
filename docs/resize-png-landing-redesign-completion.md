# Resize PNG landing redesign — completion

## Scope
Dedicated `/resize-png` premium landing for **logos, UI graphics, icons and screenshots** (distinct from Resize JPG). EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/resize-png/page.tsx`
- Copy: `src/lib/marketing/resize-png-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/resize-png-{hero,compare,steps}.webp`
- Presentation-driven PNG popular sizes (website logo, Instagram logo, app icon, favicon, presentation)
- Compress PNG follow-up note after resize
- Same resize engine via `LandingToolWorkspace`

## Verification
- typecheck / lint / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3023/en/resize-png` and `/ur/resize-png`
