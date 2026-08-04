# JPG to WebP landing redesign — completion

## Scope
Dedicated `/jpg-to-webp` premium landing focused on **website speed, Core Web Vitals and modern format delivery** — distinct from Resize JPG / Compress JPG. EN + full Urdu RTL.

## Shipped
- Route: `src/app/[locale]/(marketing)/(seo-landings)/jpg-to-webp/page.tsx`
- Copy: `src/lib/marketing/jpg-to-webp-landing-content.ts`
- View + CTAs; illustrations `public/illustrations/jpg-to-webp-{hero,compare,steps}.webp`
- JPG vs WebP comparison table, why-WebP section, 10 FAQs, related tools
- Same convert engine via `LandingToolWorkspace` (source jpeg → target webp defaults)

## Verification
- typecheck / lint (0 errors) / vitest 351 / production build — pass
- Smoke: `http://127.0.0.1:3025/en/jpg-to-webp` and `/ur/jpg-to-webp`
