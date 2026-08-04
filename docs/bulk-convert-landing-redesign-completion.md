# Bulk Convert landing redesign — completion

## Scope
New dedicated `/bulk-convert` commercial landing for **batch format conversion** (agencies, ecommerce, photographers, designers, developers). Distinct from single-image convert pair pages. EN + full Urdu RTL.

## Shipped
- `src/app/[locale]/(marketing)/(seo-landings)/bulk-convert/page.tsx`
- `src/components/marketing/bulk-convert-landing-view.tsx`
- `src/components/marketing/bulk-convert-ctas.tsx`
- `src/lib/marketing/bulk-convert-landing-content.ts`
- Illustrations: `public/illustrations/bulk-convert-{hero,compare,steps}.webp`
- Sitemap path: `/bulk-convert`
- Related links on Bulk Resize / Bulk Compress updated to `/bulk-convert`
- Live Output Format chip via `statsOutputTemplate` on `BulkToolWorkspace` (real `targetFormat`)

## Supported conversion cards
All still-image matrix paths shown (no AVIF in bulk picker):
JPG→WebP, WebP→JPG, PNG→JPG, PNG→WebP, WebP→PNG, JPG→PNG

## Tool wiring
- `<BulkToolWorkspace initialTool="convert" />` with tabs/header hidden
- Upload/queue/ZIP/APIs unchanged

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-bulk-convert-verify npm run build` — pass
- Smoke `http://127.0.0.1:3037/en/bulk-convert` — 200, hero/upload/conversions/workflow/guide/FAQ/schema/related OK
- Smoke `http://127.0.0.1:3037/ur/bulk-convert` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/bulk-convert-*.webp` — 200
- Bulk convert APIs / queue / ZIP logic untouched (presentation-only workspace props + live Output Format chip)
