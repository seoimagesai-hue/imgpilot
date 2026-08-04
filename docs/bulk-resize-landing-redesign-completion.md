# Bulk Resize landing redesign — completion

## Scope
New dedicated `/bulk-resize` commercial landing for **teams and power users** (agencies, ecommerce, photographers, marketers). Distinct from single-image Resize JPG/PNG/WebP pages. EN + full Urdu RTL.

## Shipped
- `src/app/[locale]/(marketing)/(seo-landings)/bulk-resize/page.tsx`
- `src/components/marketing/bulk-resize-landing-view.tsx`
- `src/components/marketing/bulk-resize-ctas.tsx`
- `src/lib/marketing/bulk-resize-landing-content.ts`
- Illustrations: `public/illustrations/bulk-resize-{hero,compare,steps}.webp`
- Sitemap path: `/bulk-resize` in `GENERIC_PUBLIC_TOOL_PATHS`
- Optional `presentation` chrome on `BulkToolWorkspace` (header/tabs hide, upload labels, real selection stats, external reset)

## Tool wiring
- Embeds existing `<BulkToolWorkspace initialTool="resize" />`
- Resize-only on this page (`hideToolPicker`)
- Multi-file upload, queue, batch resize, ZIP and guest limits unchanged
- `/bulk-image-tools` kept as the multi-tool hub

## Backend unchanged
No API or resize-engine changes — presentation-only workspace options.

## Verification (2026-08-03)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-bulk-resize-verify npm run build` — pass
- Smoke `http://127.0.0.1:3035/en/bulk-resize` — 200, hero/upload/workflow/FAQ/schema/related OK
- Smoke `http://127.0.0.1:3035/ur/bulk-resize` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/bulk-resize-*.webp` — 200
- Bulk APIs / resize queue / ZIP logic untouched (presentation-only workspace props)
