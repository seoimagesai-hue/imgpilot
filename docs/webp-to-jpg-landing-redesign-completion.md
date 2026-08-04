# WebP to JPG landing redesign — completion

## Scope
Dedicated `/webp-to-jpg` premium landing focused on **compatibility** (email, Office, CMS, older software) — distinct from JPG→WebP performance story. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/webp-to-jpg/page.tsx`
- Copy: `src/lib/marketing/webp-to-jpg-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/webp-to-jpg-{hero,compare,steps}.webp`
- Why-use cards, benefits, WebP vs JPG table, 10 FAQs, related tools
- Same convert engine via `LandingToolWorkspace` (source webp → target jpeg)

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3026/en/webp-to-jpg` and `/ur/webp-to-jpg`
