# PNG to JPG landing redesign — completion

## Scope
Dedicated `/png-to-jpg` premium landing focused on **flattening transparent PNGs into universally compatible JPG** — distinct from WebP↔JPG and PNG→WebP preserve-alpha. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/png-to-jpg/page.tsx`
- Copy: `src/lib/marketing/png-to-jpg-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/png-to-jpg-{hero,compare,steps}.webp`
- PNG vs JPG table, transparency section + link to `/png-to-webp`, 10 FAQs
- Same convert engine via `LandingToolWorkspace` (source png → target jpeg; white/black flatten when alpha)

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3027/en/png-to-jpg` and `/ur/png-to-jpg`
