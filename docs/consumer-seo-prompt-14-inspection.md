# Consumer Frontend SEO — Prompt 14 inspection

**Date:** 2026-08-03  
**Status:** Inspection complete → implementation follows  
**Scope:** SEO content layer only. No UI redesign, guest/R2/billing/Stripe changes.  
**Note:** Product roadmap “Prompt 14 Stripe” is deferred; this document is **Consumer SEO Prompt 14**.

---

## Current state (post Prompt 14)

| Area | Finding |
| --- | --- |
| Landing registry | Routes/formats/related in `tool-landing-registry.ts` |
| Content registry | Unique bodies in `tool-landing-content.ts` (Prompt 14 shipped) |
| Landing page | Hero → tool → Why → Benefits → How → Technical → FAQ → Related → CTA |
| FAQs | Unique per slug; template FAQs no longer rendered |
| JSON-LD | WebPage + BreadcrumbList + FAQPage |
| Sitemap | `listSitemapPaths()` OK |
| UR locale | EN body in UR shell (limitation documented) |

Historical pre-implementation notes below are retained for audit trail.

---

## Problems to fix

1. Duplicate FAQ patterns across pages.  
2. Thin doorway-like body content.  
3. No dedicated `why` / `technical` fields.  
4. No FAQPage / BreadcrumbList JSON-LD.  
5. Content mixed into route registry (harder to review uniqueness).

---

## Content strategy

1. Keep **route/config** in `tool-landing-registry.ts` (operation, formats, related, indexable).  
2. Add **`tool-landing-content.ts`** with unique SEO fields per slug.  
3. Resolve with `getLandingPageModel(slug)` merging both.  
4. Landing page order: Hero → Tool → Why → Benefits → How → Technical → FAQ → Related → CTA.  
5. Target **400–700 words** marketing content below/around tool; tool stays first after short intro.  
6. EN primary copy; UR uses same structure (EN body acceptable until dedicated UR content pack — document as limitation unless short UR intros added).

---

## Schema plan

- Add `FAQPage` + `BreadcrumbList` JSON-LD once per landing.  
- Do not invent Organization/Product ratings.  
- Soft FAQ UI (details) + JSON-LD answers must match.

---

## Illustrations

- Lightweight CSS/SVG motif per operation (`compress` | `resize` | `crop` | `convert`) — no stock photos, no new image CDN.

---

## Files to create/modify

**Create:** content registry, resolve helper, SEO section components, JSON-LD, tests, docs.  
**Modify:** landing `[slug]/page.tsx`, possibly trim prose fields from route registry to avoid dual sources (keep title/h1/description in registry for metadata; body in content registry).

---

## Verification plan

- Unit: unique FAQ questions across slugs; required fields present; sitemap unchanged coverage.  
- Typecheck, lint, vitest, build.  
- Browser: representative landings; tool still above fold; no console secrets.
