# Convert Image hub redesign — completion

## Scope
Premium master hub at `/convert-image` targeting **image converter** keywords. Pillar page linking to pair converters, compress/resize/crop hubs and bulk tools. EN + full Urdu RTL.

## Shipped
- Rewrote `src/app/[locale]/(marketing)/convert-image/page.tsx` with metadata + hub view
- `src/components/marketing/convert-image-landing-view.tsx`
- `src/components/marketing/convert-image-ctas.tsx`
- `src/lib/marketing/convert-image-landing-content.ts`
- Illustrations: `public/illustrations/convert-image-{hero,steps}.webp`

## Tool wiring
- Mounts existing `<GuestToolWorkspace config={convertToolConfig} />` with presentation-only chrome
- Convert engine / APIs / guest quota unchanged
- Popular cards (existing only): JPG→WebP, WebP→JPG, PNG→JPG, PNG→WebP, WebP→PNG

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-convert-image-verify npm run build` — pass
- Smoke `http://127.0.0.1:3038/en/convert-image` — 200, hero/upload/intro/comparison/FAQ/schema/related OK
- Smoke `http://127.0.0.1:3038/ur/convert-image` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/convert-image-*.webp` — 200
- Convert engine via existing `GuestToolWorkspace` + `convertToolConfig` — APIs unchanged
