# Compress Image hub redesign — completion

## Scope
Premium master hub at `/compress-image` targeting **image compressor** / reduce-size keywords. Pillar page linking Compress JPG/PNG/WebP + Bulk Compress and related categories. EN + full Urdu RTL.

## Shipped
- Rewrote `src/app/[locale]/(marketing)/compress-image/page.tsx` with metadata + hub view
- `src/components/marketing/compress-image-landing-view.tsx`
- `src/components/marketing/compress-image-ctas.tsx`
- `src/lib/marketing/compress-image-landing-content.ts`
- Illustrations: `public/illustrations/compress-image-{hero,steps}.webp`

## Tool wiring
- Mounts existing `<GuestToolWorkspace config={compressToolConfig} />`
- `marketingCompressPresets: true` for honest Maximum Quality / Balanced / Maximum Compression UI labels
- Compression Types cards map educationally to those intents (no fake separate engines)
- Compress engine / APIs / guest quota unchanged

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-compress-image-verify npm run build` — pass
- Smoke `http://127.0.0.1:3039/en/compress-image` — 200, hero/upload/intro/how-it-works/FAQ(15)/schema/related OK
- Smoke `http://127.0.0.1:3039/ur/compress-image` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/compress-image-*.webp` — 200
- Internal links compress-jpg/png/webp, bulk-compress, convert/resize/crop — 200
- `POST /api/guest/session` — 200 (guest pipeline still wired)
- Compress engine via existing `GuestToolWorkspace` + `compressToolConfig` — APIs unchanged
