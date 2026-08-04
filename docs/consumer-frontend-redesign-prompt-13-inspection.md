# Consumer Frontend Redesign — Prompt 13 inspection

**Date:** 2026-08-03  
**Status:** Inspection approved — **Phase A implementation in progress**  
**Operator decisions:**
- JPG primary; JPEG aliases redirect to JPG
- Target-KB pages deferred (no target-byte backend)
- Social Instagram/Facebook/YouTube pages deferred to Phase 13b
- Minimal Privacy/Terms stubs for footer
- Phase A: chrome, homepage, format/convert/crop landings — Stripe paused


---

## Executive summary

Backend guest processing is production-capable. The public UI is still a **thin utility shell**:

- Tools work through a strong shared `GuestToolWorkspace` + `GuestToolConfig` system.
- There is **no mega menu**, weak mobile nav, almost **no SEO metadata** on tool pages, **no sitemap/robots routes**, no breadcrumbs/related-tools/FAQ components, and **no format/conversion landing pages**.
- `PUBLIC_SITEMAP_PATHS` lists many marketing/legal pages that **do not exist** as `page.tsx`, while real tool routes are **omitted**.
- **Target-byte compress/resize pages must not ship as functional tools** — backend cannot honestly meet “to 20 KB / 50 KB …” today.
- **Social resize pages** need a dated, central preset matrix; today only a generic `social` 1080×1080 box exists.

**Recommended Prompt 13 shape:** redesign chrome + homepage + generic tool shells + central landing registry for format/conversion/crop pages that map to existing engines. Defer target-KB and treat social presets as optional Phase 13b only after verified dimensions.

---

## Existing UI problems

1. **Dashboard-adjacent marketing chrome** — flat teal/utility look; unused hero CSS in `globals.css`; Segoe/system stack.
2. **Header** — logo + Pricing/Docs/Sign in/Register only; no grouped mega menus.
3. **Tool nav** — horizontal chip strip (`ConsumerToolNav`); scrolls on mobile; English hardcoded `aria-label="Tools"`.
4. **No consumer mobile drawer** — dashboard has `mobile-nav`, marketing does not.
5. **Homepage** — long H1, hardcoded `GuestLimitBanner used={0}`, compress upload works via `HomeCompressEntry`, but thin FAQ (2 questions), no format actions, no how-it-works section density of a consumer site.
6. **Tool pages** — ~10-line server wrappers; workspace only; no SEO body above/below fold structure from Prompt 13.
7. **Broken / missing legal links** — footer → `/privacy`, `/terms` without pages.
8. **Docs i18n gap** — docs expect `marketing.*` messages; marketing message files empty / not merged in `i18n/request.ts`.
9. **Pricing** — hardcoded English; billing disabled honesty OK for Stripe pause.
10. **SEO debt** — no `src/app/sitemap.ts` / `robots.ts`; helper `buildPublicMetadata` unused by tools/home.
11. **Upgrade banners** can sit near upload (homepage) — should move below primary action per Prompt 13.
12. **Double expiry messaging** in workspace + footer.

---

## Reusable components (keep / extend)

| Component | Path | Notes |
| --- | --- | --- |
| `GuestToolWorkspace` | `src/components/guest/guest-tool-workspace.tsx` | Core flow — extend layout only |
| `GuestToolConfig` | `src/components/guest/tool-config.ts` | Config injection for SEO landings |
| Compress / Resize / Crop / Convert / Geotag / Metadata / AI / Editor tools | `src/components/guest/tools/*` | Do not fork engines |
| `UploadDropzone` | `src/components/guest/upload-dropzone.tsx` | Hero + tools |
| `HomeCompressEntry` | `src/components/guest/home-compress-entry.tsx` | Pattern for hero upload |
| `BeforeAfterPreview`, `ProgressCard`, `ToolActionBar`, `ToolResultPanel`, `ToolHeader` | `src/components/guest/*` | Restyle, not rewrite logic |
| `buildPublicMetadata` / `hreflangAlternates` | `src/server/marketing/seo.ts` | Extend; fix path registry |
| Guest EN/UR messages | `src/messages/guest/{en,ur}.json` | Expand keys |
| Docs registry pattern | `docs-data` / docs pages | Model for landing registry |

---

## Components requiring redesign

| Area | Current | Target |
| --- | --- | --- |
| `ConsumerHeader` | Minimal links | Logo + mega menus + CTAs |
| `ConsumerToolNav` | Chip strip | Fold into mega menu / remove |
| `ConsumerFooter` | Retention + 2 links | Grouped tool + company columns |
| Homepage | Sparse sections | Hero-upload-first + grids + trust + privacy + FAQ |
| Tool page shell | Workspace only | Landing shell around workspace |
| Banners | Often above hero | Subtle / post-limit |
| Tokens / typography | Utility teal | Premium consumer tokens (original) |

**New reusable UI (proposed names):**  
`PublicHeader`, `ToolsMegaMenu`, `MobileToolsMenu`, `PublicFooter`, `ToolLandingHero`, `UploadHeroCard`, `ToolTrustRow`, `PopularToolsGrid`, `FormatActionsGrid`, `HowItWorks`, `PrivacySection`, `ToolBenefits`, `ToolHowTo`, `RelatedTools`, `ToolFaq`, `ToolLandingPage`, compact `Breadcrumbs`.

---

## Backend capability checks (honest product gates)

### Target-byte compression (`compress-image-to-*kb`)

| Check | Result |
| --- | --- |
| Guest compress API | Quality presets + strength → quality (`compress-policy` / `compress-service`) |
| Exact KB targeting | **Not implemented** |
| Decision | **Do not ship functional target-KB SEO pages** in Prompt 13. Exclude from sitemap. Document as later backend enhancement. |

### Social resize pages

| Check | Result |
| --- | --- |
| Presets today | `GUEST_RESIZE_PRESET_BOX.social = 1080×1080` plus website/thumbnail |
| Instagram / Facebook / YouTube matrices | **Absent** |
| Exact Size resize | **Locked** in UI + server `OPERATION_NOT_SUPPORTED` for guest exact_size unlock |
| Decision | Social SEO pages **Blocked until** a dated central `socialPresets` catalog is approved (retrieve/verify platform sizes). Prefer `fit_inside` / documented crop/fill policy; do not claim permanent platform specs. |

### Conversion matrix (supported)

From `GUEST_CONVERT_MATRIX`:

| Source → | Targets |
| --- | --- |
| jpeg | png, webp, avif |
| png | jpeg, webp, avif |
| webp | jpeg, png, avif |

Same-format conversion is rejected (use Compress). AVIF encode is **runtime-gated** via Sharp probe (`isGuestAvifEncodeSupported`).

**AVIF SEO pages:** include in registry but:

- Index only when encode supported **or**
- Prefer always-indexable pages that disclose “AVIF available when this server supports encoding” and disable process when unsupported (honest). **Recommendation:** build pages with capability check; if unsupported at request time, show unavailable state and **noindex** optional — default: show page, block process, keep in sitemap only if process can succeed more often than not in production. Safer Prompt 13: **ship AVIF landings with live capability gate; omit from sitemap when runtime probe fails at build/deploy verification**.

### Crop / compress / resize format pages

| Tool | Format accept | Notes |
| --- | --- | --- |
| Compress / Resize / Crop / Convert | JPEG, PNG, WebP MIME | Workspace allowlist |
| Geotag | JPEG-only (existing) | Keep off format mega-menu as multi-format |
| Format landing | Pre-filter MIME or reject with link to generic | Prefer soft reject + CTA to generic tool |

---

## Route-generation strategy

**Do not** hand-code 40+ unrelated page implementations.

```text
src/server/marketing/tool-landing-registry.ts   # source of truth
src/app/[locale]/(marketing)/[... or discrete]/  # thin pages OR dynamic slug
src/components/marketing/tool-landing-page.tsx  # shell
```

**Recommended generation (Prompt 13):**

1. Central `ToolLandingDefinition[]` with slug, operation, formats, defaults, copy keys, related slugs, indexable flag.
2. One shared `ToolLandingPage` server component that:
   - Renders SEO chrome (H1, intro, benefits, how-to, related, FAQ)
   - Mounts existing workspace with **injected config overrides** (default format/target/preset)
3. Explicit `page.tsx` files per slug **or** a controlled dynamic segment validated against the registry (prefer **static paths from registry** for clearer Next metadata/caching).

Generic routes remain:

```text
/compress-image /resize-image /crop-image /convert-image
/geotag-image /image-metadata /ai-alt-text /image-metadata-editor /bulk-image-tools
```

---

## Content configuration strategy

| Layer | Content |
| --- | --- |
| Registry | slug, operation, sourceFormat, targetFormat, defaultPreset, related[], indexable |
| i18n | `guest.landings.<slug>.*` or structured marketing messages loaded intentionally |
| Shared FAQ builders | Format-aware question sets with verified answers |
| Uniqueness | Human-authored unique intro + 3–5 benefits + 3–5 FAQs per slug — **no keyword-only clones** |

Avoid doorway pages: if two slugs cannot differ except casing (jpg/jpeg), use canonical strategy below.

---

## Navigation architecture

### Desktop mega menu groups

1. **Image Tools** — Resize, Compress, Crop, Convert, Geotag, Metadata Viewer  
2. **Resize** — format / (future size) / (future social)  
3. **Compress** — format / (future KB — Coming Soon only if listed)  
4. **Convert** — columns by target format  
5. **SEO Tools** — AI Alt, Metadata Viewer, Metadata Editor, Geotag  
6. **Bulk Tools** — links to `/bulk-image-tools` with deep-link query/hash if already supported; otherwise single Bulk entry + in-page tabs  

Also: Pricing, Login, Register CTA.

### Mobile

Grouped accordion drawer; Escape / outside click / focus return; RTL-safe.

### Rules

- Only link **functional** routes.
- Target-KB → omit or mark Coming Soon **without** sitemap.
- Unsupported convert pairs → never link.

---

## SEO duplication risks

| Risk | Mitigation |
| --- | --- |
| jpg vs jpeg landings | See canonical strategy |
| Thin format pages | Unique copy + registry content review checklist |
| Generic + format page cannibalization | Distinct titles; cross-links; format pages = format intent |
| Stale `PUBLIC_SITEMAP_PATHS` | Rebuild from registry + real tools only |
| Docs vs guest conflict | Keep docs under `/docs`; consumer landings under tool slugs |
| Duplicate `/image-alt-text` | Keep redirect; sitemap only `/ai-alt-text` |

---

## JPG / JPEG canonical strategy (recommended)

**Decision recommendation for approval:**

- **Primary slugs:** `resize-jpg`, `compress-jpg`, `crop-jpg`, `jpg-to-*`
- **Alias slugs:** `resize-jpeg`, `compress-jpeg`, `jpeg-to-*` → **308/redirect or `canonical` to primary jpg** with thin alias page **or** redirect-only (prefer **redirect** to avoid duplicate content).
- MIME acceptance remains both `image/jpeg` and `image/jpg`.

Do not maintain two full unique content trees for jpg and jpeg.

---

## Canonical strategy (general)

- Each distinct intentional landing: **self-canonical** + hreflang EN/UR + `x-default`.
- Aliases: redirect or rel=canonical to primary.
- Generic tools: self-canonical (`/en/compress-image`).
- Use `buildPublicMetadata` everywhere public.

---

## Sitemap strategy

1. Add `src/app/sitemap.ts` and `src/app/robots.ts`.
2. Build URLs from: homepage + generic tools + **indexable registry entries** + pricing + real docs that exist.
3. Exclude: Coming Soon, unsupported AVIF when not verifyable, aliases, login/dashboard, guest job URLs, query variants.
4. Delete or rewrite stale `PUBLIC_SITEMAP_PATHS` feature/legal stubs until pages exist.

---

## Mobile strategy

- 375 / 430 / tablet breakpoints.
- Accordion nav; stacked workspace (preview → controls → action).
- No horizontal page scroll; truncate filenames; bidi isolate technical values.
- Touch targets ≥ ~44px (existing `min-h-11` pattern).

---

## Accessibility strategy

- Skip link on marketing layout.
- Mega menu: keyboard open/close, Escape, focus return, aria-expanded.
- Upload: keep keyboard + browse fallback; fix nested interactive dropzone if present.
- FAQ accordion ARIA; error `role="alert"`; progress `aria-live`.
- Reduced motion: preserve globals.
- EN LTR / UR RTL regression for every new chrome component.

---

## Target-size page decision (Prompt 13)

**Blocked / out of scope for functional shipping.**

Routes such as `/compress-image-to-20kb` … `/200kb` and `/resize-image-to-*kb`:

- Not in sitemap.
- Not in mega menu as available.
- Optional “later” note in docs only.

---

## Social preset page decision (Prompt 13)

**Phase 13a:** Do not ship Instagram/Facebook/YouTube dedicated pages without a verified central preset file + retrieval date.

**Phase 13b (optional same prompt if approved):** Add `src/server/marketing/social-presets.ts` with dated sources; landings set default width/height/`fit_inside`; disclaim platform changeability.

---

## Packages required

| Package | Need |
| --- | --- |
| Existing Tailwind 4 + lucide-react | Sufficient for custom mega menu |
| Radix Navigation Menu / Headless UI | **Optional** — prefer zero new deps matching dashboard disclosure patterns unless hover complexity requires it |

No Stripe packages in this prompt.

---

## Migration requirements

- **No DB / R2 migrations.**
- Additive routes + messages only.
- Guest session / processing / cleanup unchanged unless a real layout regression forces a tiny compatibility fix.
- Footer legal links: either stub honest legal placeholders or remove until ready (prefer restore minimal Privacy/Terms pages if linking).

---

## Files to create (planned)

```text
docs/consumer-frontend-redesign-prompt-13-inspection.md          # this file
docs/consumer-frontend-redesign-prompt-13-design-system.md       # after approval
docs/consumer-frontend-redesign-prompt-13-route-registry.md
docs/consumer-frontend-redesign-prompt-13-completion.md

src/server/marketing/tool-landing-registry.ts
src/components/marketing/public-header.tsx (+ mega + mobile)
src/components/marketing/public-footer.tsx
src/components/marketing/tool-landing-page.tsx
src/components/marketing/related-tools.tsx
src/components/marketing/tool-faq.tsx
src/components/marketing/breadcrumbs.tsx
src/components/marketing/... (hero, trust, how-it-works, etc.)
src/app/sitemap.ts
src/app/robots.ts
src/app/[locale]/(marketing)/<slug>/page.tsx   # generated from registry
src/messages/guest or marketing landing strings
tests/tool-landing-registry.test.ts
```

---

## Files to modify (planned)

```text
src/components/marketing/consumer-chrome.tsx   # replace/refactor
src/app/[locale]/(marketing)/layout.tsx
src/app/[locale]/(marketing)/page.tsx
src/app/globals.css                           # tokens
src/components/guest/guest-tool-workspace.tsx # layout chrome only
src/components/guest/tool-config.ts           # optional landing overrides
src/server/marketing/seo.ts                   # sitemap paths from registry
src/i18n/request.ts                           # load marketing/landing messages if needed
src/messages/guest/en.json + ur.json
PROJECT.md ROADMAP.md ARCHITECTURE.md DECISIONS.md CHANGELOG.md TASKS.md KNOWN_ISSUES.md README.md
```

---

## Proposed Prompt 13 route list (Phase A — ship if approved)

### Keep generics

All current tool routes remain.

### Resize format

`/resize-jpg` (+ `/resize-jpeg` alias), `/resize-png`, `/resize-webp`

### Compress format

`/compress-jpg` (+ jpeg alias), `/compress-png`, `/compress-webp`

### Crop format

`/crop-jpg`, `/crop-png`, `/crop-webp`  
(+ `/crop-image-square` if mapped to existing 1:1 ratio — **supported**)

### Convert (supported pairs only)

```text
/jpg-to-png /jpg-to-webp /jpg-to-avif
/png-to-jpg /png-to-webp /png-to-avif
/webp-to-jpg /webp-to-png /webp-to-avif
```

Plus jpeg→* as redirects to jpg→*.

### Deferred

- All `*-to-20kb` / `*-to-50kb` / etc.
- Social use-case pages until presets approved
- Crop Instagram/YouTube until social presets approved

---

## Verification plan (after implementation)

1. Inspection approved → design tokens → chrome → homepage → workspace layout → registry → pages.  
2. Typecheck, lint, full Vitest, production build, ready 200.  
3. Playwright: EN/UR desktop menus, representative landings (Resize PNG, Compress JPG, PNG to WebP, WebP to JPG, Crop PNG), mobile accordion, keyboard mega menu.  
4. Regression: guest upload/process/download for compress/resize/crop/convert + one bulk smoke.  
5. Sitemap contains only indexable functional routes; console clean of secrets.

---

## Production risks

1. Bundle bloat if all landings pull all tool clients — mitigate with per-operation dynamic imports.  
2. Duplicate content / SEO penalties from jpg/jpeg twins — redirects required.  
3. AVIF pages over-promising — capability gate.  
4. Broken footer legal URLs continue to harm trust until fixed.  
5. Docs i18n already broken — fix while touching i18n loader.  
6. Visual redesign without layout regression tests could hide process CTAs on mobile.

---

## Rollback plan

- Frontend-only: redeploy previous `.next` that includes Prompt 12 billing/cleanup behavior.
- No guest schema change → no DB rollback for Prompt 13.
- Feature flag optional: `NEXT_PUBLIC_CONSUMER_REDESIGN=0` if needed (not required if cutover is atomic).

---

## Open decisions for operator approval

1. **JPG primary + JPEG redirect** — Recommended: yes.  
2. **Target-KB pages** — Recommended: defer entirely.  
3. **Social pages** — Recommended: defer to 13b with dated presets.  
4. **crop-image-square** — Recommended: include (maps to existing 1:1).  
5. **New UI packages** — Recommended: none first; Radix only if custom menu fails a11y.  
6. **Legal stubs** — Recommended: minimal Privacy/Terms pages so footer is not 404.  
7. **Design accent** — Prompt 13 asks blue/purple OK; avoid copying prior teal-only utilitarian look; define **original** tokens in design-system doc (avoid purple-on-white AI cliché per user frontend rules — prefer a distinctive but clean primary).

---

## Implementation readiness

| Item | Status |
| --- | --- |
| Inspection document | **Complete** |
| Implementation | **Not started** |
| Stripe | **Paused** |
| Next step after approval | Design-system doc + header/homepage + landing registry (no Stripe) |

---

## One recommended next task after approval

Implement **design tokens + PublicHeader mega menu + homepage upload-first redesign**, then land the **tool-landing registry** for format/convert pages that reuse existing configs — still without Stripe.
