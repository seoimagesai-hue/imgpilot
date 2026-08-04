# Resize Image hub redesign — completion

## Scope
Premium master hub at `/resize-image` targeting **image resizer** / change-size keywords. Pillar page linking Resize JPG/PNG/WebP + Bulk Resize and related categories. EN + full Urdu RTL.

## Shipped
- Rewrote `src/app/[locale]/(marketing)/resize-image/page.tsx` with metadata + hub view
- `src/components/marketing/resize-image-landing-view.tsx`
- `src/components/marketing/resize-image-ctas.tsx`
- `src/lib/marketing/resize-image-landing-content.ts`
- Illustrations: `public/illustrations/resize-image-{hero,steps}.webp`

## Tool wiring
- Mounts existing `<GuestToolWorkspace config={resizeToolConfig} />`
- `showPopularSizes: true` with `RESIZE_IMAGE_POPULAR_SIZES` (Instagram / Facebook / YouTube / Website Hero / Blog / Mobile Banner)
- Preset marketing cards scroll to `#tool-workspace` (same sizes as the real options panel; Custom Size focuses manual width/height)
- Resize engine / APIs / guest quota unchanged

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-resize-image-verify npm run build` — pass
- Smoke `http://127.0.0.1:3040/en/resize-image` — 200, hero/upload/presets/intro/guide/FAQ(15)/schema/related OK
- Smoke `http://127.0.0.1:3040/ur/resize-image` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/resize-image-*.webp` — 200
- Internal links resize-jpg/png/webp, bulk-resize, convert/compress/crop — 200
- `POST /api/guest/session` — 200 (guest pipeline still wired)
- Resize engine via existing `GuestToolWorkspace` + `resizeToolConfig` — APIs unchanged
