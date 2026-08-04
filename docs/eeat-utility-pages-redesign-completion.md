# EEAT / utility pages redesign — completion

## Scope
Contact Us, Privacy, Terms, Cookies, custom 404, and `/search` tool discovery. Contact first, then legal cluster + utility pages.

## Shipped
### Contact
- `src/app/[locale]/(marketing)/contact/page.tsx`
- `src/components/marketing/contact-landing-view.tsx`
- `src/components/marketing/contact-mailto-form.tsx` — mailto only (no new API)
- `src/lib/marketing/contact-landing-content.ts`
- `public/illustrations/contact-hero.webp`

### Legal
- Shared `legal-document-view.tsx` + sticky `legal-toc.tsx`
- Privacy / Terms keep exact prior stub paragraphs (`PRIVACY_LEGAL_PARAGRAPHS` / `TERMS_LEGAL_PARAGRAPHS`)
- New `/cookies` honest cookie summary
- Illustrations: `privacy-hero.webp`, `terms-hero.webp`, `cookies-hero.webp`

### Search + 404
- `/search` discovery UI (`tool-search-client.tsx`, catalog)
- `[locale]/not-found.tsx` + root `not-found.tsx`
- `not-found-hero.webp`, `search-hero.webp`

### Wiring
- Footer: Cookie Policy + Search Tools
- Sitemap: `/cookies`, `/search`
- Test: `tests/legal-stub-wording.test.ts`

## Verification (2026-08-04)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors, existing warnings only)
- `npm test` — 353 passed (includes legal stub wording)
- `NEXT_DIST_DIR=.next-eeat-verify npm run build` — pass
- Smoke EN: `/contact`, `/privacy`, `/terms`, `/cookies`, `/search` — 200
- Smoke UR: `/contact`, `/privacy` — 200 + `dir="rtl"`
- Illustrations — 200
- Soft 404 `/en/this-page-does-not-exist-xyz` — HTTP 404 with premium markers
- Privacy/Terms wording assertions — pass
