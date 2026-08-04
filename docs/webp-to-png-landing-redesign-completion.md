# WebP to PNG landing redesign — completion

## Scope
Dedicated `/webp-to-png` premium landing focused on **editing, transparency and lossless PNG output** — distinct from PNG→WebP web delivery and WebP→JPG opaque compatibility. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/webp-to-png/page.tsx`
- Copy aligned to prompt: hero, upload, intro, WebP vs PNG table (7 rows), benefits, how-to, “When PNG Is the Better Choice” + PNG→WebP highlight link, use cases, tips, 10 FAQs, related, CTA
- View + CTAs; illustrations `public/illustrations/webp-to-png-{hero,compare,steps}.webp`
- Same convert engine via `LandingToolWorkspace` (source webp → target png)
- Related: PNG to WebP · PNG to JPG · WebP to JPG · Resize PNG · Compress PNG · Bulk

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build (`.next-webp-to-png-verify`) — pass
- Smoke: `http://127.0.0.1:3030/en/webp-to-png` and `/ur/webp-to-png`
