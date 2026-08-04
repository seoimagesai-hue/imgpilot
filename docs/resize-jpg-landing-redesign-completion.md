# Resize JPG landing redesign — completion

## Scope
Premium marketing redesign for **`/resize-jpg` only**. Guest upload/resize/download, quota, countdown, and API routes unchanged.

## Shipped
- Dedicated route: `src/app/[locale]/(marketing)/(seo-landings)/resize-jpg/page.tsx`
- View + copy: `resize-jpg-landing-view.tsx`, `resize-jpg-landing-content.ts`
- Illustrations: `public/illustrations/resize-jpg-{hero,compare,steps}.webp`
- Presentation-only guest UI hooks (`GuestToolPresentation`): premium status bar, upload labels, feature strip, popular sizes (custom dimensions), Compress JPG quality note, external reset CTA
- Metadata title/description + WebApplication / BreadcrumbList / FAQPage JSON-LD
- SEO registry entry kept in sync for shared landing tests

## Honest quality note
JPG quality is **not** on the resize engine. Options panel links to Compress JPG instead of inventing a quality slider.

## Verification
- `npm run typecheck` — pass
- `npm run lint` — pass (pre-existing warnings only)
- `npm test` — 351 passed
- `npm run build` — pass
- Smoke: `http://127.0.0.1:3020/en/resize-jpg` and `/ur/resize-jpg` — 200, H1/FAQ/schema/illustrations present
