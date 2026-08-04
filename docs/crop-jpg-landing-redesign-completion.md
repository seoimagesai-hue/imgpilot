# Crop JPG landing redesign — completion

## Scope
Dedicated `/crop-jpg` premium landing focused on **composition cropping** (remove unwanted areas, aspect ratios, social framing) — distinct from Resize JPG and Compress JPG. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/crop-jpg/page.tsx`
- Copy: `src/lib/marketing/crop-jpg-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/crop-jpg-{hero,compare,steps}.webp`
- Popular ratio cards mirror supported crop aspects (`free`, `1:1`, `3:4`, `16:9`, `9:16`, `4:3`) — 4:5/3:2 not claimed (not in crop policy)
- Same crop engine via `LandingToolWorkspace`; presentation-only labels and guest bar

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3024/en/crop-jpg` and `/ur/crop-jpg` (200, H1, upload, ratios, FAQ, schema, RTL)
