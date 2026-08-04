# PNG to WebP landing redesign — completion

## Scope
Dedicated `/png-to-webp` premium landing focused on **preserving transparency while shrinking PNG graphics for the web** — distinct from PNG→JPG flatten and JPG→WebP photographic migration. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/png-to-webp/page.tsx`
- Copy: `src/lib/marketing/png-to-webp-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/png-to-webp-{hero,compare,steps}.webp`
- PNG vs WebP table, website performance / CWV section, 10 FAQs, related tools
- Same convert engine via `LandingToolWorkspace` (source png → target webp)
- Wired SEO compat + registry metadata; excluded from generic `[slug]` landing

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build (`.next-png-to-webp-verify`) — pass
- Smoke: `http://127.0.0.1:3028/en/png-to-webp` and `/ur/png-to-webp` (sections, JSON-LD, illustrations)
