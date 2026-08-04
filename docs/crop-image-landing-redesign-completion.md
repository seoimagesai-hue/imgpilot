# Crop Image hub redesign — completion

## Scope
Premium master hub at `/crop-image` targeting **crop images online** keywords. Pillar page linking Crop JPG/PNG/WebP and related categories. EN + full Urdu RTL.

## Shipped
- Rewrote `src/app/[locale]/(marketing)/crop-image/page.tsx` with metadata + hub view
- `src/components/marketing/crop-image-landing-view.tsx`
- `src/components/marketing/crop-image-ctas.tsx`
- `src/lib/marketing/crop-image-landing-content.ts`
- Illustrations: `public/illustrations/crop-image-{hero,steps}.webp`

## Tool wiring
- Mounts existing `<GuestToolWorkspace config={cropToolConfig} />`
- Popular ratio cards only advertise engine-supported ratios: Free, 1:1, 4:3, 3:4, 16:9, 9:16 (no fake 4:5 / 3:2 / 21:9)
- Crop engine / handles / APIs / guest quota unchanged

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-crop-image-verify npm run build` — pass
- Smoke `http://127.0.0.1:3041/en/crop-image` — 200, hero/upload/ratios/intro/composition/FAQ(15)/schema/related OK
- Smoke `http://127.0.0.1:3041/ur/crop-image` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/crop-image-*.webp` — 200
- Internal links crop-jpg/png/webp + convert/compress/resize — 200
- `POST /api/guest/session` — 200 (guest pipeline still wired)
- Crop engine via existing `GuestToolWorkspace` + `cropToolConfig` — APIs unchanged
