# Bulk Compress landing redesign — completion

## Scope
New dedicated `/bulk-compress` commercial landing focused on **storage saving, faster websites and batch workflow automation**. Distinct from single-image Compress JPG/PNG/WebP. EN + full Urdu RTL.

## Shipped
- `src/app/[locale]/(marketing)/(seo-landings)/bulk-compress/page.tsx`
- `src/components/marketing/bulk-compress-landing-view.tsx`
- `src/components/marketing/bulk-compress-ctas.tsx`
- `src/lib/marketing/bulk-compress-landing-content.ts`
- Illustrations: `public/illustrations/bulk-compress-{hero,compare,steps}.webp`
- Sitemap path: `/bulk-compress` in `GENERIC_PUBLIC_TOOL_PATHS`
- Bulk Resize related link updated to `/bulk-compress`

## Tool wiring
- Embeds `<BulkToolWorkspace initialTool="compress" />`
- Compress-only on this page (`hideToolPicker`)
- Real selection stats only (`{count} Images Ready`, `{size} Total`, Ready for Processing) — no fake estimated output sizes
- Upload/queue/ZIP/APIs unchanged

## Verification (2026-08-03)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 351 passed
- `NEXT_DIST_DIR=.next-bulk-compress-verify npm run build` — pass
- Smoke `http://127.0.0.1:3036/en/bulk-compress` — 200, hero/upload/workflow/guide/FAQ/schema/related OK
- Smoke `http://127.0.0.1:3036/ur/bulk-compress` — 200, `dir="rtl"` + Urdu copy OK
- Illustrations `/illustrations/bulk-compress-*.webp` — 200
- Bulk APIs / compress queue / ZIP logic untouched (presentation-only workspace props)
