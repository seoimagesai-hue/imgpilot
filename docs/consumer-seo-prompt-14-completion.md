# Consumer Frontend SEO — Prompt 14 completion

**Date:** 2026-08-03  
**Status:** Complete  
**Scope:** SEO content layer only (no UI redesign; no guest/R2/billing/Stripe/auth/dashboard changes)  
**Note:** This is **Consumer SEO Prompt 14**. Product roadmap “Prompt 14 = Stripe test-mode” remains deferred and is renumbered below as a later Stripe milestone item.

---

## Verdict

**Passed.** All 19 indexable format/convert/crop landings now render unique SEO bodies from a centralized content registry, with FAQPage + BreadcrumbList JSON-LD, SVG motifs, related links, sitemap coverage, upload tool still immediately under the hero intro, and green typecheck / lint / vitest / production build.

---

## Inspection

See `docs/consumer-seo-prompt-14-inspection.md`.

---

## Landing registry

- Route/config: `src/lib/marketing/tool-landing-registry.ts` (19 indexable + JPEG redirects)
- Model merge: `src/lib/marketing/resolve-landing.ts` → `getLandingPageModel(slug)`
- Sitemap continues to use `listSitemapPaths()` (generics + indexable landings; redirects excluded)

---

## Content registry

- `src/lib/marketing/tool-landing-content.ts` — unique `intro` / `why` / benefit cards / how-to / technical / FAQs / CTA per slug
- Coverage: all 19 indexable slugs; uniqueness enforced in `tests/landing-seo-content.test.ts`
- Template `formatFaqs` / `convertFaqs` in the route registry are no longer rendered on landings (page uses SEO registry FAQs)

---

## Page architecture (fixed order)

1. Hero (H1 + intro + motif)  
2. Upload tool (`#tool-workspace`)  
3. Why use this tool  
4. Benefit cards  
5. How it works  
6. Technical explanation  
7. FAQ  
8. Related tools  
9. Bottom CTA (“process another”)

Implemented in `src/app/[locale]/(marketing)/(seo-landings)/[slug]/page.tsx` via server components in `landing-seo-sections.tsx`, `landing-motif.tsx`, `json-ld.tsx`.

---

## Metadata / canonical / sitemap

- Unchanged `buildPublicMetadata` (title/description/canonical/hreflang)
- Sitemap auto-includes indexable registry slugs
- JPEG aliases still redirect (HTTP 307 verified for `/en/resize-jpeg`)

---

## Schema

- `WebPage` + `BreadcrumbList` + `FAQPage` JSON-LD once per landing
- No Product/AggregateRating inventation
- FAQ UI answers match JSON-LD

---

## Internal links

- `related` arrays on registry entries → `RelatedTools`
- Format→compress/convert chains preserved (e.g. Resize PNG → Compress PNG / PNG to WebP)

---

## Performance

- Marketing SEO sections are Server Components
- Only the existing guest tool workspace hydrates as a client island

---

## Browser verification

Served production build on `http://127.0.0.1:3014` (`BUILD_ID` `W3G6ceTXWz_1CVKStcGfR`).

| Check | Result |
| --- | --- |
| `/en/compress-jpg` | 200 — Why/FAQ/JSON-LD/Related/tool |
| `/en/resize-png` | 200 |
| `/en/png-to-webp` | 200 |
| `/en/crop-image-square` | 200 |
| `/ur/compress-jpg` | 200 (EN body in UR shell — noted limitation) |
| `/en/resize-jpeg` | 307 → resize-jpg |
| Sitemap landings | Present; jpeg redirects absent |
| Tool before Why | Confirmed (`#tool-workspace` precedes “Why use this tool”) |

Port 3000 was occupied by a prior Prompt 13 server; verification used 3014 without killing the prior process.

---

## Automated verification

| Check | Result |
| --- | --- |
| Typecheck | Pass |
| Lint | Pass (0 errors; pre-existing warnings elsewhere) |
| Vitest | **351/351** |
| Production build | Pass — `BUILD_ID` `W3G6ceTXWz_1CVKStcGfR` |

---

## Limitations / next

- UR landings reuse EN SEO body inside RTL shell (full UR copy pack deferred)
- Target-KB and Instagram/Facebook SEO pages still deferred
- **Prompt 15 (planned):** programmatic SEO expansion from the same registry pattern (`compress-*`, `resize-*`, convert matrix, later social templates)
- Stripe Price IDs / paid launch remain **Blocked** (separate from this SEO prompt)

---

## Files touched (high level)

**Create:** content registry, resolve helper, SEO section components, JSON-LD, motif, tests, inspection + completion docs  
**Modify:** landing `[slug]/page.tsx`, registry comment, PROJECT / ROADMAP / CHANGELOG / README / TASKS
