# Decisions

## 2026-08-04: Consumer stays on public tools; admin is separate (`/admin`)
**Decision:** Authenticated normal users remain on the public homepage and guest tool routes after login/register. Default auth callback falls back to homepage; already-authenticated visits to login/register redirect to `/account`. Public header gains a session-aware account panel (usage, billing, history, settings, sign out). `/dashboard` index redirects to `/account`; nested project/org/integration routes stay for data safety but are not linked from consumer nav. Saved files are omitted until a real consumer library exists. Guest files are not claimed into accounts on login. Super-admin platform ops live only under `/[locale]/admin/*` with `requireSuperAdmin`, ops chrome (no Compress/Resize tools), and audited mutations via `admin_audit_logs`. Plan/limit admin v1 is read-only against the code catalog + guest policy.
**Why:** Image tools are the product; a project dashboard after every login fights the consumer model. Mixing tools into admin leaks the wrong control surface.

## 2026-08-03: Consumer Frontend Redesign Phase A (Prompt 13)
**Decision:** Pause Stripe. Ship chrome + homepage + registry-driven format/convert/crop SEO landings that reuse `GuestToolWorkspace`. JPG routes are canonical; JPEG aliases redirect. Defer target-KB pages (no target-byte backend). Defer Instagram/Facebook/YouTube SEO pages until dated presets. Add minimal Privacy/Terms stubs. Cobalt primary (`#1d4ed8`) for consumer CTAs. Zero new UI packages for mega menu.
**Why:** Backend is ready; public UX and SEO IA were utility-thin. Honest product gates avoid fake KB pages and duplicate jpg/jpeg content.

## 2026-08-03: Consumer launch plans are Guest + Free + Pro (Prompt 12)
**Decision:** Sell Guest, Free Account, and Pro only. Do not offer Business/Agency on the consumer pricing page. Currency USD. Never invent display prices — gate paid checkout on configured `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_ANNUAL`. Webhook path is `/api/billing/webhook`. Entitlements activate only from signed Stripe events + `mapEntitlementState` (active/trialing full; past_due grace then restricted; else free fallback). Storage overage after downgrade blocks writes, keeps temporary reads, no surprise deletes. Cleanup retention uses external cron calling `POST /api/internal/cron/cleanup` with `CRON_SECRET`, not only the in-process worker.
**Why:** Match enforceable backend capabilities; keep a single honest commercial catalog; preserve free public launch when Stripe Price IDs are unapproved.

## 2026-08-03: Controlled guest v2 cutover archives legacy guest tables (Prompt 11)
**Decision:** On cutover, rename incompatible live `guest_*` tables/enums to `*_pre_v2_archive`, free colliding index/constraint names, then apply `0026`–`0028`. Do not drop authenticated data. Skip bulk R2 delete of archived guest keys. Preserve `.next` as `.next-pre-v2-cutover` until approval. Restore minimal `/api/health/*` in source so ready probes work after rebuild.
**Why:** Live DB had a prior guest shape that blocked naive migrate; temporary guest data was expired (active=0); production must run from a fresh source build, not a promoted verify directory.

## 2026-08-03: Authenticated bulkAi remains true; guest bulk AI off (Prompt 10)
**Decision:** Keep `getAiMetadataPolicy().bulkAi === true` for authenticated Prompt 31 AI metadata batches. Update stale tests/scripts that expected `false`. Public guest bulk tools do **not** offer AI Alt Text batches (`bulkAiGuestAllowed: false`); guests use single-image AI only.

**Why:** Policy matched shipping dashboard/API/batch services; the failing test was Prompt-17 leftover, not product intent.

## 2026-08-03: Guest public bulk sync + parent/child tables (Prompt 10)
**Decision:** Guest bulk uses `guest_bulk_jobs` / `guest_bulk_job_items`, sequential child `createGuestJob` calls (honors one active guest job), 1 op per processed file, JSZip archives on private R2 under `guest/{session}/bulk/{id}/archives/`. Authenticated visitors get elevated public-bulk caps without inventing Stripe prices. Dashboard `bulk_jobs` + processing worker remain the project-scale path.

**Why:** Guest stack has no processing worker; sync ≤5 files is safe and honest.

## 2026-08-03: Guest Metadata Editor sidecar-first (Prompt 9)
**Decision:** Guest Metadata Editor uses `metadata.edit` with schema `image-seo-metadata-v2`. Drafts are server-side on `guest_jobs` (op-free prepare/save/validate/import). Sidecar TXT/JSON/CSV/HTML exports are primary. Renamed download streams the original private object with `Content-Disposition` only — no R2 key rename, no pixel rewrite, no new embedded EXIF/IPTC/XMP library. Web alt text is framed as a CMS/page field, not a universal binary field. AI import reuses Prompt 8 results (same session + upload) without calling OpenAI or consuming AI/ops allowance.

**Why:** Honest SEO tooling without claiming binary embedding or rankings; stay on the shared guest workspace and cleanup path.

## 2026-08-03: Guest AI Alt Text reuses Chat Completions core (Prompt 8)
**Decision:** Guest AI uses `ai.generate_alt_text` with schema `image-seo-ai-v2`. Reuses `prepareAnalysisImage` + OpenAI Chat Completions from the authenticated AI stack. No Responses API exists in this repo — Completions is the only path (no fallback). Shared guest ops (not a separate AI quota). Client Blob TXT/JSON exports; no image derivative. Live generation stays Blocked until a real OpenAI request is verified.

**Why:** Avoid inventing a second AI pipeline while keeping guest prompts/schemas bounded and privacy-safe.

## 2026-08-03: Guest metadata viewer allow-list (Prompt 7)
**Decision:** Guest Metadata Viewer uses `metadata.inspect` with a bounded `guest-image-metadata-v2` schema. Formats: JPEG/PNG/WebP only. Sharp for image properties; piexifjs for JPEG allow-listed EXIF; GPS via existing safe reader. No derivative image; TXT/JSON exported client-side from the result summary. Sensitive fields (owner, copyright, maker notes, raw XMP/IPTC) never returned. Results scrubbed on re-inspect and session expiry.

**Why:** Metadata may contain PII; a strict allow-list plus viewer-only boundary keeps guest tools private without inventing a second export/storage pipeline.

## 2026-08-03: Guest geotag JPEG-only privacy-first GPS (Prompt 6)
**Decision:** Guest Geotag uses `geotag.write_gps` + piexifjs. Only JPEG supports verified embedded GPS. Non-GPS EXIF is stripped (Orientation may be retained). Browser geolocation is click-gated only; no IP geolocation, map, or geocoder. Existing GPS requires explicit replacement confirmation. Coordinates scrubbed from job rows on reprocess and session expiry.

**Why:** Minimize PII leakage while delivering a trustworthy GPS write with round-trip verification.

## 2026-08-03: Guest convert matrix separate from dashboard (Prompt 5)
**Decision:** Guest Convert uses `convert.format` + `lib/guest/convert-policy.ts`, not dashboard `convert_format` / `convertFormat()`. Guest allows PNG→JPEG only with explicit background; same-format is rejected (Compress). AVIF offered only when Sharp encode probe succeeds. Convert normalizes orientation with `rotate()`; Compress/Resize orientation unchanged.  
**Why:** Consumer honesty on transparency/AVIF without weakening authenticated conversion guarantees.

## 2026-08-03: Guest crop trust boundary (Prompt 4)
**Decision:** Crop uses a lightweight custom editor (no heavy image-editor npm package). Browser sends normalized crop only; server auto-orients with `sharp.rotate()`, converts to integer pixels (min 16×16), extracts, and verifies output decode. Identical crop options reuse the completed job; new crops enqueue prior output keys for cleanup. Zoom is UI-only.  
**Why:** Interactive tools must still share `GuestToolWorkspace` and never trust browser pixels/R2 keys.

## 2026-08-03: Pluggable GuestToolConfig (Prompt 3)
**Decision:** All consumer tools share one `GuestToolWorkspace`; each tool supplies a `GuestToolConfig` (options panel, defaults, job operation, result mapping). Resize is the proof tool (~90%+ UI reuse). Exact Size stays locked until a later prompt.  
**Why:** Avoid per-tool upload/processing/result page duplication (iLoveIMG / ImageResizer pattern).

## 2026-08-03: Reusable GuestToolWorkspace + Compress (Prompt 2)
**Decision:** Implement Compress as the first tool inside a shared consumer funnel (`GuestToolWorkspace`) with pluggable options/process metrics; single-image async guest jobs; Download All UI disabled until multi-file.  
**Why:** ImageResizer/iLoveIMG-style UX must stay consistent across Resize/Crop/Convert/etc. without rewriting chrome per tool.

## 2026-08-03: Consumer-first guest foundation (Redesign v2 Prompt 1)
**Decision:** Rebuild shared guest architecture in source (session cookie + HMAC, private R2 guest keys, lifecycle shell, cleanup worker, consumer layout) before any tool-specific transforms.  
**Why:** Prior guest implementation existed only in a compiled `.next` build; source must become the permanent truth. Tools ship sequentially from Prompt 2.

## 2026-08-03: Guest asset TTL is immutable
**Decision:** `expiresAt = createdAt + 1h` is set once; downloads and reprocessing must not extend it.  
**Why:** Matches privacy promise and prevents indefinite guest retention via refresh/download loops.

## 2026-08-03: Minimal authenticated stubs for compile health
**Decision:** Restore emptied dashboard modules with minimal type-compatible stubs (orgs/v1-handlers/workflows/cloudinary) only as needed for typecheck during Phase 1.  
**Why:** Unblock guest work without rewriting Prompt 24–28 behaviour in this phase.

## 2026-08-01: Webflow site access token (not OAuth)
**Decision:** Connect Webflow with a site/workspace access token encrypted at rest; API host is fixed `api.webflow.com/v2`.  
**Why:** Matches Shopify token model; no OAuth app/callback configured in repo.

## 2026-08-01: Webflow updates existing CMS items only
**Decision:** Upload assets and patch mapped image/text fields on existing CMS items; no item/collection creation; no automatic whole-site publish.  
**Why:** Keep Prompt 28 verifiable and avoid Designer/management sprawl.

## 2026-08-01: Webflow two-step asset upload with 4 MiB cap
**Decision:** Create asset metadata (fileName + MD5) then POST bytes to returned S3 `uploadUrl` after host allowlist checks; enforce Webflow’s 4 MiB image limit.  
**Why:** Required by Webflow Data API v2; SSRF-safe upload target validation.

## 2026-08-01: No automatic Webflow asset deletion
**Decision:** SaaS delete/disconnect does not delete Webflow assets; mappings become stale/historical.  
**Why:** Avoid surprising remote data loss.

## 2026-08-01: Shopify Custom App Admin API token (not OAuth)
**Decision:** Connect stores with a Custom App Admin API access token encrypted at rest; Admin API host is always `*.myshopify.com`.  
**Why:** Mirrors WordPress Application Password recoverability without OAuth callback surface; OAuth deferred.

## 2026-08-01: Shopify publishes to existing products only
**Decision:** Attach media to an existing product; no product/variant/collection/order/inventory APIs.  
**Why:** Keep Prompt 27 verifiable and avoid becoming a Shopify management product.

## 2026-08-01: No automatic Shopify asset deletion
**Decision:** SaaS delete/disconnect does not delete Shopify product images; mappings become stale/historical.  
**Why:** Avoid surprising remote data loss.

## 2026-08-01: WordPress Application Passwords only
**Decision:** Connect self-hosted WordPress via username + Application Password over HTTPS REST; no normal password storage; no plugin.  
**Why:** Least privilege media upload without browser-side WordPress calls.

## 2026-08-01: WordPress credentials encrypted (recoverable)
**Decision:** Application Passwords use AES-GCM at rest (workers must decrypt); API keys remain one-way hashed.  
**Why:** Different recoverability needs; never return credentials after save.

## 2026-08-01: Publish uses approved metadata + user-selected derivative
**Decision:** Only current approved metadata for the image source revision; user selects active derivative (or explicit original); drafts/stale blocked.  
**Why:** Preserve human approval and source immutability.

## 2026-08-01: WordPress/DB publishing is a recoverable saga
**Decision:** Upload, persist remote media ID, update metadata, verify remotely, then complete; partial success retries metadata without re-upload.  
**Why:** Not one atomic transaction across WordPress and PostgreSQL.

## 2026-08-01: No automatic remote media deletion
**Decision:** SaaS delete/disconnect/archive does not delete WordPress media; mappings become stale/historical.  
**Why:** Avoid surprising remote data loss; remote delete deferred.

## 2026-08-01: No posts/pages/Shopify/Webflow in Prompt 26
**Decision:** Media library publishing only; other CMS targets deferred.  
**Why:** Keep scope verifiable.

## 2026-08-01: Public API uses Bearer keys on `/api/v1`
**Decision:** External integrations authenticate with workspace-bound Bearer API keys (`si_live_|si_test_…`); dashboard session APIs stay separate.  
**Why:** Clear trust boundary; keys are hashed and shown once.

## 2026-08-01: Fixed API scopes without wildcards
**Decision:** Only allow-listed scopes; no `*` for normal keys; keys cannot manage billing, members, or other keys.  
**Why:** Least privilege and predictable audits.

## 2026-08-01: Org keys managed by owner/admin only
**Decision:** Organization API keys and webhooks are created/revoked by owner/admin; keys remain org-owned after creator leaves.  
**Why:** Editors/viewers must not mint workspace credentials.

## 2026-08-01: Idempotency-Key required for public writes
**Decision:** Public write routes require `Idempotency-Key` scoped to key+route+workspace with request fingerprint.  
**Why:** Safe client retries without duplicate quota/jobs.

## 2026-08-01: DB-backed API rate limits (interim)
**Decision:** Fixed-window rate limits use Postgres buckets shared across instances.  
**Why:** No Redis yet; document as temporary multi-instance backing store.

## 2026-08-01: Webhook secrets encrypted; API keys hashed
**Decision:** API keys are SHA-256 hashed (non-recoverable); outbound webhook signing secrets are AES-256-GCM encrypted so workers can sign.  
**Why:** Different recoverability requirements; never log either.

## 2026-08-01: HTTPS-only webhooks with SSRF guards
**Decision:** Endpoints must be public HTTPS; block localhost/private/link-local/metadata; re-resolve DNS on delivery; signed HMAC bodies; at-least-once delivery.  
**Why:** Prevent SSRF and document duplicate-delivery consumer duty.

## 2026-08-01: No OAuth apps or CMS publishing in Prompt 25
**Decision:** Do not add OAuth servers, Zapier, or direct WordPress/Shopify/Webflow publishing here.  
**Why:** Keep the foundation bounded and verifiable.

## 2026-08-01: Personal workspace is virtual (no fake org row)
**Decision:** Personal workspace is `type=personal` with `id=userId`; no synthetic organization per user.  
**Why:** Avoid backfill noise and keep personal ownership simple while org rows stay real shared tenants.

## 2026-08-01: Org billing uses interim billing owner (Option B)
**Decision:** `organizations.billing_owner_user_id` selects the user entitlement/Stripe customer for org work; ownership transfer does not move billing.  
**Why:** Stripe remains user-based; seat/org billing is deferred without inventing prices.

## 2026-08-01: Org roles are fixed four-value matrix
**Decision:** Roles are only `owner|admin|editor|viewer` with server-enforced permissions; editors may approve metadata; viewers are read-only.  
**Why:** Predictable collaboration without custom role builders in Milestone 1.

## 2026-08-01: Invitation tokens stored hashed only
**Decision:** Invite links use `crypto.randomBytes(32)` raw tokens; DB stores SHA-256 hash; 7-day TTL; accept requires normalized email match.  
**Why:** Stolen DB rows must not yield usable invite secrets.

## 2026-08-01: Session never carries org role claims long-term
**Decision:** Every org/project permission check re-reads active membership from DB (`noStore`).  
**Why:** Role/revocation freshness without JWT org claims.

## 2026-08-01: Marketing claims must map to verified features
**Decision:** Public site describes only features proven in the repository and configuration.  
**Why:** Prevent false commercial claims (unlimited, lossless, always-smaller, auto-publish, certifications).

## 2026-08-01: Pricing comes from configured plan catalog
**Decision:** Public pricing reads `listActivePlans()` limits; dollar displays stay null until Stripe Price IDs exist.  
**Why:** No invented customer-facing prices.

## 2026-08-01: No fake social proof
**Decision:** No testimonials, review stars, customer logos, or fabricated counters on marketing pages.  
**Why:** Trust and legal risk.

## 2026-08-01: Public and private layouts remain separate
**Decision:** Marketing uses `(marketing)` layout; dashboard and admin keep their shells.  
**Why:** Avoid leaking ops nav and keep public SSR light.

## 2026-08-01: Public docs are source-controlled (no CMS)
**Decision:** Documentation lives in TSX/content modules in-repo.  
**Why:** Prompt forbids adding a large CMS for static marketing pages.

## 2026-08-01: No public tracking platform in Prompt 23
**Decision:** Do not add session replay, ads pixels, or non-essential analytics cookies.  
**Why:** Cookie Policy covers essentials only; no banner for trackers that do not exist.

## 2026-08-01: Locale-prefixed public routes; private routes excluded from sitemap
**Decision:** Always-on `/en` `/ur`; sitemap lists marketing/docs/legal only; robots disallow dashboard/admin/auth patterns.  
**Why:** SEO without indexing private surfaces (auth remains access control).

## 2026-08-01: Public copy explains original immutability and AI approval
**Decision:** Marketing and docs state originals are never overwritten and AI metadata requires human approval.  
**Why:** Align expectations with processing/metadata architecture.

## 2026-08-01: CMS packages are exports, not direct publishing
**Decision:** Public site must not claim WordPress/Shopify/Webflow API publishing.  
**Why:** Packages prepare import folders only.

## 2026-08-01: Legal gaps require visible review placeholders
**Decision:** Do not invent company registration, governing law, or claim professional legal review.  
**Why:** Accurate legal posture until counsel reviews.

## 2026-08-01: Explicit server-enforced super-admin role
**Decision:** `users.role` enum `user` | `super_admin`; every admin route/API re-checks server-side.  
**Why:** Hiding navigation is not authorization.

## 2026-08-01: No email-domain-based admin grant
**Decision:** Provision only via controlled CLI (or future operator script), never by email domain.  
**Why:** Domains are spoofable/transferable.

## 2026-08-01: Admin writes require audit + reason
**Decision:** Sensitive admin writes require reason (≥8 chars) and append-only `admin_audit_logs`.  
**Why:** Support accountability without secret leakage.

## 2026-08-01: User suspension preserves data
**Decision:** Suspend blocks login/protected access; data and billing rows remain; no auto Stripe cancel.  
**Why:** Support safety and reversible remediation.

## 2026-08-01: Stripe cannot be manually activated in admin
**Decision:** Admin may resync from Stripe / reprocess failed events only — never force `active` in DB.  
**Why:** Stripe remains authoritative.

## 2026-08-01: No arbitrary DB editor / R2 browser / force-complete / impersonation
**Decision:** Out of Prompt 22 scope permanently for this panel shape.  
**Why:** Prevent catastrophic support mistakes and privacy breaches.

## 2026-08-01: Last-super-admin protection
**Decision:** Demote/suspend blocked when it would remove the last `super_admin`.  
**Why:** Avoid lockout.

## 2026-08-01: Admin panel separate from user dashboard
**Decision:** Distinct `/admin` shell; normal users never receive admin nav or admin API data.  
**Why:** Clear trust boundary.

## 2026-08-01: Stripe-hosted Checkout and Customer Portal

Card data never touches the app. Browser cannot choose Price ID, amount, customer, or status.

## 2026-08-01: One billing owner per user

Canonical Stripe customer per user; projects inherit user entitlements. No team billing yet.

## 2026-08-01: Webhooks are authoritative

Checkout success redirects are not payment proof. Entitlements activate after verified webhook sync.

## 2026-08-01: No invented prices

Paid plans require configured Stripe Price IDs. Until then checkout stays unavailable; Free entitlement preserves access.

## 2026-08-01: Local entitlement snapshot + monthly usage ledger

Runtime enforcement uses DB snapshot (no Stripe call per upload). Storage is current-state and does not reset monthly.

## 2026-08-01: Downgrade preserves data

Over-limit users can view/delete/cleanup; new over-limit writes blocked. Past-due has a 3-day grace period.

## 2026-08-01: No admin billing in Prompt 21

No super-admin panel, revenue analytics, or public pricing site.

## 2026-08-01: User analytics separate from super-admin analytics

Owner-scoped dashboards only. No cross-user or platform-wide metrics in Prompt 20.

## 2026-08-01: Current-state totals use source tables

Dashboard totals come from images/jobs/derivatives/metadata/exports/`project_quota_state`, not invented counters.

## 2026-08-01: Historical trends use real timestamps + append-only events

Trends bucket entity timestamps (UTC days). Activity uses `analytics_events`. No fabricated history.

## 2026-08-01: Bounded date ranges only

Allow-listed `7d` / `30d` / `90d` / `all`. No arbitrary SQL date input. All-time trend charts bounded to 90 days.

## 2026-08-01: Limited queue details for users

Pending/active/failed counts and summarized worker health only. No worker IDs, leases, hostnames, or global queue size.

## 2026-08-01: Section-level error isolation + CSS charts

Optional analytics sections fail independently. Charts are CSS/SVG with text summaries — no external analytics SDK; no billing in Prompt 20.

## 2026-08-01: Export packages via dedicated export_jobs + shared worker
**Decision:** Persist `export_jobs` separately from per-image `processing_jobs`. The same worker process claims export jobs with SKIP LOCKED and builds ZIP archives with JSZip.  
**Date:** 2026-08-01  
**Reason:** Multi-image packages do not fit a single image FK; reuse lease/heartbeat patterns.  
**Alternatives considered:** Fake sentinel processing_jobs; browser-side ZIP.  
**Consequences:** Operators must run `npm run worker:processing` for exports to complete.

## 2026-08-01: CMS packages are offline import kits
**Decision:** WordPress/Shopify/Webflow exports are folder layouts + README/IMPORT notes only. No live CMS APIs.  
**Date:** 2026-08-01  
**Reason:** Avoid OAuth/token sprawl before publishing milestone.  
**Alternatives considered:** Direct Media Library / Admin API uploads.  
**Consequences:** Users import manually; publishing integrations remain future work.

## 2026-08-01: Signed download only for export archives
**Decision:** Completed packages are private R2 objects. Downloads use short-lived signed URLs for owners.  
**Date:** 2026-08-01  
**Reason:** Match private-original security model.  
**Alternatives considered:** Public CDN URLs; inline base64 API responses.  
**Consequences:** Links expire; no permanent public export URLs.

## 2026-08-01: Deterministic SEO quality score (no AI)
**Decision:** Score metadata with fixed rules (length, stuffing, filename safety). Never call the provider for scoring.  
**Date:** 2026-08-01  
**Reason:** Predictable, cheap, and auditable for review workflows.  
**Alternatives considered:** LLM judge; ML classifier.  
**Consequences:** Scores may miss semantic nuance; humans still approve.

## 2026-08-01: Duplicate detection warns only
**Decision:** Flag duplicate alt/title/filename suggestions within a project+language. Never auto-rewrite.  
**Date:** 2026-08-01  
**Reason:** Avoid silent SEO changes; keep human control.  
**Alternatives considered:** Auto-suffix filenames; block approve on duplicates.  
**Consequences:** Operators can still approve duplicates if intentional.

## 2026-08-01: Export foundation without files
**Decision:** Ship `buildExportReadyMetadata` returning normalized approved items with `filesGenerated: false`. Defer ZIP/CSV/CMS to Prompt 19.  
**Date:** 2026-08-01  
**Reason:** Stabilize the data contract before packaging formats.  
**Alternatives considered:** Ship CSV immediately.  
**Consequences:** UI shows preview counts only; no downloads yet.

## 2026-08-01: Bulk review reuses single-image services
**Decision:** Bulk approve/reject/mark_reviewed call existing per-generation functions with concurrency 3 and max 50. Regenerate enqueues existing metadata jobs.  
**Date:** 2026-08-01  
**Reason:** Avoid a second approval engine.  
**Alternatives considered:** New bulk_jobs operation type for approvals.  
**Consequences:** Progress is request-scoped (API returns succeeded/failed counts).

## 2026-07-31: Human approval required for AI metadata
**Decision:** Every AI generation starts as `draft`. Current approved metadata is created only by explicit user approve. Regeneration never silently replaces approved values.  
**Date:** 2026-07-31  
**Reason:** Prevent inaccurate or unsafe SEO text from going live without review.  
**Alternatives considered:** Auto-approve; soft auto-apply with undo.  
**Consequences:** Export/publish later must read `image_metadata_approved`, not raw drafts.

## 2026-07-31: Metadata language separate from interface language
**Decision:** Generate metadata in `projects.metadata_language` (`en`|`ur`), not the browser/UI locale.  
**Date:** 2026-07-31  
**Reason:** Operators may use Urdu UI while targeting English SEO (or vice versa).  
**Alternatives considered:** Infer from Accept-Language / next-intl locale.  
**Consequences:** UI must display metadata language explicitly; EN/UR approvals are separate.

## 2026-07-31: Temporary bounded analysis copy for AI
**Decision:** Worker reads private original, builds an in-memory JPEG ≤1280px longest edge, strips for analysis, discards bytes after the provider call. Never persists analysis or makes it a derivative.  
**Date:** 2026-07-31  
**Reason:** Cost, privacy, and memory control; avoid sending full 25 MB originals.  
**Alternatives considered:** Public signed URL to provider; full-resolution submit; disk temp files.  
**Consequences:** Tiny details may be omitted; OCR is not guaranteed.

## 2026-07-31: OpenAI provider abstraction; single SDK
**Decision:** Ship one vision provider (OpenAI) behind `ImageMetadataProvider`. Env: `AI_PROVIDER=openai` + `OPENAI_API_KEY`. Gemini enum remains reserved but unavailable.  
**Date:** 2026-07-31  
**Reason:** Structured JSON + vision on `gpt-4o-mini`; avoid multi-SDK sprawl.  
**Alternatives considered:** Gemini primary; multi-provider fallback.  
**Consequences:** No automatic provider fallback; outages surface as safe `AI_*` errors.

## 2026-07-31: Filename suggestion never applied automatically
**Decision:** Store sanitized Latin ASCII slug suggestions only. Do not rename R2 keys or original filenames in Prompt 17. Urdu metadata text stays in fields; filenames are not Nastaliq.  
**Date:** 2026-07-31  
**Reason:** Renaming is a later export/filename workflow concern.  
**Alternatives considered:** Unicode slugs; auto-rename on approve.  
**Consequences:** UI must state suggestion-only; export can apply later.

## 2026-07-31: Single-image AI only; no billing in Prompt 17
**Decision:** Defer bulk AI, ZIP/CSV, Stripe, and paid tiers. Track neutral usage counters and daily caps only.  
**Date:** 2026-07-31  
**Reason:** Prove safe review lifecycle before scale and monetization.  
**Alternatives considered:** Bulk AI with selection; soft credit UI.  
**Consequences:** Operators generate one image at a time via the image detail panel.

## 2026-07-31: DB-backed queue with SKIP LOCKED leasing (no Redis yet)
**Decision:** Use `processing_jobs` as the persistent queue. Workers claim with `FOR UPDATE SKIP LOCKED`, lease TTL, and heartbeat. No Redis/BullMQ in this milestone.  
**Date:** 2026-07-31  
**Reason:** Match existing Postgres stack; avoid new infra until multi-region scale needs it.  
**Alternatives considered:** BullMQ/Redis; inline sync execute from API.  
**Consequences:** Operators must run `npm run worker:processing` alongside the app server.

## 2026-07-31: Browser never executes processing
**Decision:** HTTP `?action=execute` is rejected (`QUEUE_WORKER_REQUIRED`). UI creates jobs and polls status. Retry only re-queues.  
**Date:** 2026-07-31  
**Reason:** Separate request handling from CPU/R2 work; prevent duplicate browser-driven execution.  
**Alternatives considered:** Keep sync execute for single images.  
**Consequences:** Production requires a running worker for jobs to complete.

## 2026-07-31: Bulk is orchestration only; reuse single-image engine
**Decision:** Prompt 15 bulk jobs only schedule existing processing jobs. Never fork Sharp optimize/resize/convert, retry, cleanup, or quota logic.  
**Date:** 2026-07-31  
**Reason:** Keep one verified processing path; avoid divergent bulk bugs.  
**Alternatives considered:** Inline Sharp in bulk worker; pre-queue all child jobs at create time.  
**Consequences:** Create+execute per item at run time with concurrency 3; items stay pending until run.

## 2026-07-31: One operation per bulk run; cancel pending only
**Decision:** Disallow mixed operations in one bulk request. Cancel marks only pending items; running items finish. Retry only failed items.  
**Date:** 2026-07-31  
**Reason:** Predictable progress and no wasted recomputation of completed work.  
**Alternatives considered:** Mixed ops; cancel mid-flight Sharp work.  
**Consequences:** Partial completion status when some fail/cancel after successes.

## 2026-07-31: Central conversion matrix; never silent PNG→JPEG
**Decision:** Allow only an explicit source→target matrix. Reject PNG→JPEG and other unlisted paths. Preserve alpha when converting PNG to PNG/WebP/AVIF.  
**Date:** 2026-07-31  
**Reason:** Avoid accidental transparency loss and unpredictable SEO outputs.  
**Alternatives considered:** Auto-flatten to JPEG; free-form any-to-any conversion.  
**Consequences:** UI shows only allowed targets; unsupported requests return `CONVERSION_UNSUPPORTED`.

## 2026-07-31: Convert always from immutable original
**Decision:** Format conversion reads the trusted original only — never optimized or resized derivatives.  
**Date:** 2026-07-31  
**Reason:** Same revision safety and quality guarantees as resize.  
**Alternatives considered:** Convert from optimized derivative.  
**Consequences:** Independent converted derivatives per target format.

## 2026-07-31: Fixed resize presets only; never upscale
**Decision:** Support only longest-edge presets 256/512/1024/2048. Browser cannot submit arbitrary dimensions. Never upscale; keep source dimensions when already smaller.  
**Date:** 2026-07-31  
**Reason:** Dimension-safe SEO variants without stretch/crop complexity.  
**Alternatives considered:** Free-form width/height; always force exact edge.  
**Consequences:** UI shows fixed presets; tiny originals produce same-size “resized” outputs.

## 2026-07-31: Resize always from immutable original
**Decision:** Every resize preset reads the trusted original storage key — never an optimized or previous resize derivative.  
**Date:** 2026-07-31  
**Reason:** Prevent generational quality loss and revision confusion.  
**Alternatives considered:** Chain from optimized derivative.  
**Consequences:** More R2 GETs; independent derivatives per preset.

## 2026-07-31: Aspect-preserving fit-inside resize
**Decision:** Use Sharp `fit: 'inside'` with `withoutEnlargement: true`; no crop, pad, stretch, or rotate.  
**Date:** 2026-07-31  
**Reason:** Honest dimension-safe SEO copies.  
**Alternatives considered:** Cover/crop presets; letterboxing.  
**Consequences:** Output edge equals preset only on the longer side when downscaling.

## 2026-07-31: Originals are immutable; derivatives use unique keys
**Decision:** Processing never overwrites, rewrites, or deletes the active original R2 object. Every attempt writes a new private derivative key.  
**Date:** 2026-07-31  
**Reason:** Recoverability and source integrity; failed/retry outputs must not destroy originals.  
**Alternatives considered:** In-place overwrite; promote derivative to original.  
**Consequences:** Storage grows with derivatives; cleanup/reconcile required; replacement invalidates old-revision jobs.

## 2026-07-31: Same-format same-dimension first processing operation
**Decision:** Prompt 12 supports only `optimize_same_format` with controlled quality and unchanged dimensions/format. Not claimed lossless.  
**Date:** 2026-07-31  
**Reason:** Smallest production-safe pipeline foundation before resize/conversion.  
**Alternatives considered:** Immediate WebP conversion; lossless-only pipelines.  
**Consequences:** Output may be larger; GIF/animated rejected; resize/conversion deferred.

## 2026-07-31: Processing completion after HeadObject + DB commit
**Decision:** Mark jobs `completed` only after derivative PUT, trusted HeadObject, and derivative/job DB commit.  
**Date:** 2026-07-31  
**Reason:** Upload success alone is insufficient; R2 and Postgres are a recoverable saga, not one atomic transaction.  
**Alternatives considered:** Complete on PUT alone.  
**Consequences:** Intermediate statuses and reconciliation for interrupted sagas.

## 2026-07-31: Synchronous processing until worker milestone
**Decision:** Execute processing in the authenticated request path (create then execute). Do not fake background workers or progress timers.  
**Date:** 2026-07-31  
**Reason:** Honest lifecycle without installing queues in Prompt 12.  
**Alternatives considered:** Fake `queued` with timers; early BullMQ.  
**Consequences:** Duration limited by request/runtime; workers remain a later Milestone 4 task.

## 2026-07-31: Jobs bind to exact source revision
**Decision:** Snapshot `sourceStorageKey` on create; re-check before completion; replacement/delete marks jobs stale and prevents attaching old derivatives to new sources.  
**Date:** 2026-07-31  
**Reason:** Prevent stale optimized copies from being presented as belonging to a replaced original.  
**Alternatives considered:** Ignore revision; reuse old derivatives when dimensions match.  
**Consequences:** Stale jobs/derivatives after replace; new Ready source needs a new job.

## 2026-07-31: Processing metadata strip policy
**Decision:** Do not call Sharp `.rotate()` or `.withMetadata()` on optimize; EXIF/GPS removed; ICC not retained; pixel dimensions stay as stored.  
**Date:** 2026-07-31  
**Reason:** Avoid silent dimension changes from orientation and avoid shipping GPS in SEO outputs by default.  
**Alternatives considered:** Preserve all metadata; auto-orient always.  
**Consequences:** Honest UI copy; may differ from validation display assumptions for Orientation-tagged JPEGs.

## 2026-07-31: Separate generated-output quota
**Decision:** Track `generatedOutputBytes` / `reservedGeneratedBytes` separately from original-upload effective usage; reserve before execute; convert after HeadObject.  
**Date:** 2026-07-31  
**Reason:** Bound private derivative storage without conflating with original quotas (Prompt 10 deferred this).  
**Alternatives considered:** Defer all generated accounting; count derivatives inside original bytes.  
**Consequences:** 5 GiB generated default; reconcile may correct drift; originals quota unchanged.

## 2026-07-31: Completed derivative preview via signed URL only
**Decision:** Issue short-lived signed GET only for completed, owned, active derivatives; never public URLs or preview for non-completed outputs.  
**Date:** 2026-07-31  
**Reason:** Same privacy model as original previews.  
**Alternatives considered:** Public CDN; embed keys in HTML.  
**Consequences:** Preview API ownership checks; UI must not render raw signed URL text.

## 2026-07-31: No bulk processing in Prompt 12
**Decision:** Single-image jobs only; no Process All, queues, or multi-image workers.  
**Date:** 2026-07-31  
**Reason:** Keep foundation verifiable and source-safe.  
**Alternatives considered:** Batch API without workers.  
**Consequences:** Bulk remains later Milestone 4 work.

## 2026-07-31: Next.js App Router + TypeScript foundation
**Decision:** Use Next.js 15 App Router with strict TypeScript for the SaaS foundation.  
**Date:** 2026-07-31  
**Reason:** Matches the approved technology direction and supports RSC, locale segments, and middleware for i18n.  
**Alternatives considered:** Pages Router; Remix; separate Vite SPA + API.  
**Consequences:** Routes live under `src/app`; server/client component boundaries must be respected.

## 2026-08-07: Global multilingual architecture (25 languages)
**Decision:** English is unprefixed (`localePrefix: "as-needed"`). Twenty-four other locales use `/{locale}/...`. Legacy `/en` and `/en/*` permanently redirect (301) to unprefixed English. RTL applies to `ar` and `ur`. Incomplete locale message packs deep-merge over English.

**Update (Phase 3 Prompt 1):** Marketing body and Layer 1 UI are catalogued per locale. Indexability (sitemap/hreflang/robots) requires translation-quality status — do not index English-duplicate localized thin pages. Machine translations are labelled `machine_translated` until reviewed. URL slugs remain English in this phase. Technical dimensions keep Western digits; format codes are do-not-translate.
**Date:** 2026-08-07  
**Reason:** Match large SaaS i18n URL conventions, preserve English as canonical/`x-default`, and scale locale packs without blocking on full marketing translation.  
**Alternatives considered:** Keep always-on `/en`; cookie-only locale; runtime machine translation.  
**Consequences:** Canonical/hreflang/sitemap must use `localePath`/`absoluteUrl`; auth callbacks and return URLs accept unprefixed English.

## 2026-07-31: next-intl with locale-prefixed routing
**Decision:** Use `next-intl` with always-on `/en` and `/ur` prefixes.  
**Date:** 2026-07-31  
**Reason:** Explicit URLs are predictable, shareable, and easier to QA for LTR/RTL.  
**Alternatives considered:** Cookie-only locale; `next-i18next`; custom dictionary loader.  
**Consequences:** Every user-facing route is locale-prefixed; middleware negotiates locale.  
**Superseded by:** 2026-08-07 Global multilingual architecture (25 languages).

## 2026-07-31: RTL at the document level
**Decision:** Set `dir` and `lang` on `<html>` from the active locale in the locale layout.  
**Date:** 2026-07-31  
**Reason:** Native directionality fixes text, form controls, and logical CSS mirroring.  
**Alternatives considered:** Per-component RTL class toggles only.  
**Consequences:** New UI should prefer logical properties (`border-e`, `ms`/`me`, etc.).

## 2026-07-31: Defer real authentication
**Decision:** Do not ship fake auth or hardcoded credentials; mark dashboard protection as pending.  
**Date:** 2026-07-31  
**Reason:** Auth requires DB + Auth.js provider choices and real session tests.  
**Alternatives considered:** Mock session cookie; hardcoded admin password. Rejected as unsafe and misleading.  
**Consequences:** Dashboard is reachable without login until the auth task; UI states this clearly.

## 2026-07-31: Zod environment validation split
**Decision:** Validate env with Zod; separate server-only getters from client-safe `NEXT_PUBLIC_*` parsing.  
**Date:** 2026-07-31  
**Reason:** Fail clearly on bad public config; avoid accidental secret exposure patterns.  
**Alternatives considered:** `@t3-oss/env-nextjs`; untyped `process.env` usage.  
**Consequences:** Future required secrets become `.min()` / required when those features ship; today most service vars are optional empties.

## 2026-07-31: Vitest as the test runner
**Decision:** Use Vitest for the unit/foundation test suite.  
**Date:** 2026-07-31  
**Reason:** Fast, TypeScript-friendly, works without a full Playwright install for Milestone 0.  
**Alternatives considered:** Jest; Playwright-only.  
**Consequences:** Component/E2E browser tests remain a later addition if needed.

## 2026-07-31: Keep Next.js 15 middleware filename
**Decision:** Use `src/middleware.ts` (not `proxy.ts`) while the app is on Next.js 15.5.  
**Date:** 2026-07-31  
**Reason:** `proxy.ts` is the Next.js 16 convention; 15.5 expects `middleware.ts` for the request interceptor to run.  
**Alternatives considered:** Keeping an unused `proxy.ts` file.  
**Consequences:** When upgrading to Next.js 16, rename to `proxy.ts` per Next.js codemod / next-intl guidance.

## 2026-07-31: Defer Drizzle/R2/Sharp/Stripe package installs
**Decision:** Document PostgreSQL/Drizzle/R2/workers/AI/Stripe as planned; do not install those packages in Milestone 0.  
**Date:** 2026-07-31  
**Reason:** Avoid unused dependencies and false “implemented” claims.  
**Alternatives considered:** Installing full stack scaffolding unused.  
**Consequences:** `package.json` stays lean; architecture docs mark systems as planned.

## 2026-07-31: Patch Next.js 15.5 and React 19 for published CVEs
**Decision:** Upgrade to `next@15.5.22`, `eslint-config-next@15.5.22`, `react@19.1.2`, and `react-dom@19.1.2` while staying on the 15.5 line.  
**Date:** 2026-07-31  
**Reason:** `15.5.0` / early 15.5 patches were flagged for critical RSC vulnerabilities; remaining on 15.5 avoids a forced Next 16 `proxy.ts` migration in this task.  
**Alternatives considered:** Jumping to Next.js 16 immediately; leaving vulnerable 15.5.0.  
**Consequences:** App remains on middleware convention; security posture improved for foundation.

## 2026-07-31: ESLint FlatCompat for Next 15.5
**Decision:** Use `@eslint/eslintrc` FlatCompat with `next/core-web-vitals` and `next/typescript`.  
**Date:** 2026-07-31  
**Reason:** `eslint-config-next@15.5.x` still exports legacy `extends` objects, which are not directly iterable in native flat config.  
**Alternatives considered:** Hand-rolled plugin config; upgrading only ESLint packages to Next 16 style.  
**Consequences:** Lint works on ESLint 9; may simplify after a future Next major upgrade.

## 2026-07-31: Auth.js v5 beta for App Router
**Decision:** Use `next-auth@5.0.0-beta.32` with `@auth/drizzle-adapter`.  
**Date:** 2026-07-31  
**Reason:** Compatible with Next.js 15 App Router; official Auth.js line for App Router on npm is currently the v5 beta tag.  
**Alternatives considered:** next-auth v4; Clerk/Lucia.  
**Consequences:** Follow Auth.js v5 APIs (`handlers`, `auth`, `signIn`, `AUTH_*` env names).

## 2026-07-31: JWT session strategy
**Decision:** Use JWT sessions while persisting users/accounts with Drizzle.  
**Date:** 2026-07-31  
**Reason:** Auth.js Credentials provider requires JWT sessions.  
**Alternatives considered:** Database sessions only (incompatible with Credentials without custom session creation).  
**Consequences:** Session integrity depends on `AUTH_SECRET`; adapter still stores users/accounts for OAuth/registration.

## 2026-07-31: bcryptjs password hashing
**Decision:** Hash passwords with `bcryptjs` (cost factor 12).  
**Date:** 2026-07-31  
**Reason:** Maintained, pure-JS bcrypt suitable for Node without native build friction on Windows.  
**Alternatives considered:** `bcrypt` native; Argon2.  
**Consequences:** No plaintext passwords stored; hashes never exposed to clients.

## 2026-07-31: Dashboard protection in server layout
**Decision:** Protect `/[locale]/dashboard` in the dashboard layout via `auth()`, keep middleware for next-intl only.  
**Date:** 2026-07-31  
**Reason:** Avoid Edge runtime / DB access issues in middleware while preserving locale routing.  
**Alternatives considered:** Combined auth+intl middleware.  
**Consequences:** Authorization is server-enforced; client hiding is not relied upon.

## 2026-07-31: Conditional Google provider
**Decision:** Register Google provider only when both Google env vars are set; otherwise show disabled UI.  
**Date:** 2026-07-31  
**Reason:** Prevents a non-functional Google button and fails env validation if only one Google var is present.  
**Alternatives considered:** Always show Google and error at runtime.  
**Consequences:** Local/dev can ship credentials auth without Google setup.

## 2026-07-31: Drizzle migrations (generate, do not push)
**Decision:** Use Drizzle Kit SQL migrations; never silent production `push`/destructive sync.  
**Date:** 2026-07-31  
**Reason:** Reviewable schema history and safer apply step.  
**Alternatives considered:** `drizzle-kit push` as primary workflow.  
**Consequences:** Developers run `db:generate` then `db:migrate` against a real `DATABASE_URL`.

## 2026-07-31: Load `.env.local` for Drizzle CLI scripts
**Decision:** Load `.env.local` (then `.env`) in Drizzle/db CLI helpers without logging values.  
**Date:** 2026-07-31  
**Reason:** Next.js reads `.env.local`, but drizzle-kit/`tsx` scripts do not unless explicitly loaded — empty process env caused false “missing DATABASE_URL” confusion.  
**Alternatives considered:** Require exporting DATABASE_URL in the shell; duplicate values into `.env`.  
**Consequences:** `npm run db:check` / `db:migrate` see the same local secrets file as the app, still without printing them.

## 2026-07-31: Soft archive for projects
**Decision:** Archive projects by setting `status=archived` and `archived_at`; restore clears archive; no permanent delete UI in v1.  
**Date:** 2026-07-31  
**Reason:** Safer recovery, simpler first workflow, keeps ownership intact for future images.  
**Alternatives considered:** Hard delete only; both archive and delete in the same UI.  
**Consequences:** Filters expose Active / Archived / All; CASCADE delete still applies if a user account is removed.

## 2026-07-31: Project ownership query pattern
**Decision:** Every project query and mutation scopes by authenticated `userId` plus `projectId`; missing and unauthorized share not-found.  
**Date:** 2026-07-31  
**Reason:** Prevents cross-user IDOR without leaking whether another user’s project ID exists.  
**Alternatives considered:** Authorize after fetch by ID only; client-hidden userId fields.  
**Consequences:** Server actions must call `requireUser()`; forms never submit owner IDs.

## 2026-07-31: Metadata language on the project
**Decision:** Store `metadata_language` (`en` | `ur` enum) on each project, independent of next-intl UI locale.  
**Date:** 2026-07-31  
**Reason:** Product requires generated filenames/alt text language separate from interface language.  
**Alternatives considered:** Derive from UI locale; global user-only setting without per-project override.  
**Consequences:** Adding languages is an enum + translation update; no metadata generation in this task.

## 2026-07-31: Website URL normalization (HTTP/HTTPS only)
**Decision:** Optional website URL; trim; accept only `http:` / `https:`; reject javascript and other schemes.  
**Date:** 2026-07-31  
**Reason:** Avoid XSS-style URL protocols without crawling live sites.  
**Alternatives considered:** Required URL; live HEAD/GET validation.  
**Consequences:** Empty URL allowed; no network checks during CRUD.

## 2026-07-31: Pagination-ready project lists with fixed limit
**Decision:** List queries take filter + limit/offset; first UI version uses a fixed page size without infinite scroll.  
**Date:** 2026-07-31  
**Reason:** Avoid unbounded loads while staying ready for true pagination later.  
**Alternatives considered:** Load all projects; cursor pagination in v1.  
**Consequences:** Filter via safe URL query (`status=active|archived|all`); invalid values normalize to `active`.

## 2026-07-31: Project CRUD via server actions
**Decision:** Implement project mutations as authenticated server actions with Zod, not a public REST CRUD API.  
**Date:** 2026-07-31  
**Reason:** Matches Auth.js registration patterns and keeps ownership checks colocated with forms.  
**Alternatives considered:** Route handlers for every mutation.  
**Consequences:** Actions revalidate localized project paths; no unauthenticated public write API.

## 2026-07-31: Cloudflare R2 reserved as initial provider (not connected yet)
**Decision:** Reserve Cloudflare R2 as the first durable storage provider; keep a disabled server-only storage abstraction until the dedicated R2 task.  
**Date:** 2026-07-31  
**Reason:** Avoid local-disk production fallbacks and keep the next integration S3-compatible without schema churn.  
**Alternatives considered:** Implement R2 in the same task; local disk staging; PostgreSQL bytea.  
**Consequences:** App builds without R2 credentials; uploads explicitly fail with `StorageNotConfiguredError`.

## 2026-07-31: Final image row only after durable storage confirmation
**Decision:** Do not insert final `uploaded` image rows from the placeholder upload UI; finalize only after object persistence is confirmed in the R2 task.  
**Date:** 2026-07-31  
**Reason:** Prevent orphan DB records detached from real objects.  
**Alternatives considered:** Insert `pending_upload` rows before storage; mark uploaded optimistically.  
**Consequences:** Empty library is the normal live state until R2 lands.

## 2026-07-31: SVG deferred from upload allowlist
**Decision:** Disable SVG uploads for now.  
**Date:** 2026-07-31  
**Reason:** SVG can contain scripts and external references; sanitization is out of scope.  
**Alternatives considered:** Allow SVG with client-only checks.  
**Consequences:** Raster formats only (jpeg/png/webp/gif/avif).

## 2026-07-31: 25 MB per image and 500-file batch limits
**Decision:** Enforce 25 MB per file and 500 files per batch in the upload policy module (no total-storage quota yet).  
**Date:** 2026-07-31  
**Reason:** Matches the Milestone 3 product plan without inventing billing quotas early.  
**Alternatives considered:** Enforce a 10 GB project quota now.  
**Consequences:** Quota/billing remains a later milestone.

## 2026-07-31: Soft image deletion
**Decision:** Soft-delete images via `deleted_at` + `status=deleted`; exclude from default queries; no delete UI until real storage exists.  
**Date:** 2026-07-31  
**Reason:** Coordinate future DB + object deletion safely.  
**Alternatives considered:** Hard delete immediately.  
**Consequences:** Physical R2 deletion is deferred.

## 2026-07-31: Original filename separated from storage key
**Decision:** Keep `original_filename` for display; generate unique `storage_key` server-side under `originals/...`.  
**Date:** 2026-07-31  
**Reason:** Filenames are unsafe as paths and must not authorize access.  
**Alternatives considered:** Use original filename as object key.  
**Consequences:** Sanitized suffixes are helpers only; IDs provide uniqueness.

## 2026-07-31: Original images remain immutable
**Decision:** Never mutate uploaded originals in place; future processing writes separate optimized copies.  
**Date:** 2026-07-31  
**Reason:** Core product safety rule.  
**Alternatives considered:** Overwrite originals after optimization.  
**Consequences:** Processing statuses stay out of this foundation schema.

## 2026-07-31: Private R2 with presigned PUT (not POST)
**Decision:** Upload originals to a private Cloudflare R2 bucket using short-lived S3-compatible presigned `PUT` URLs; browsers upload directly; the app confirms with `HeadObject`.  
**Date:** 2026-07-31  
**Reason:** R2 does not support presigned HTML POST; private buckets avoid public originals; app server must not proxy bulk bytes.  
**Alternatives considered:** Public bucket; POST forms; proxying through Next.js.  
**Consequences:** CORS is required; TTL 60–900s; multipart deferred.

## 2026-07-31: Client upload concurrency capped at 4
**Decision:** Limit simultaneous browser PUTs to 4.  
**Date:** 2026-07-31  
**Reason:** Avoid opening hundreds of concurrent connections for bulk selection.  
**Alternatives considered:** Unlimited parallel PUTs; single-file only.  
**Consequences:** Large batches still work sequentially in waves.

## 2026-07-31: Sharp as trusted decoder (Node.js only)
**Decision:** Use Sharp for trusted metadata inspection and bounded full decode; never run on Edge.  
**Date:** 2026-07-31  
**Reason:** Need real decode proof beyond HeadObject/MIME; Sharp/libvips is the standard Node path.  
**Alternatives considered:** ImageMagick; metadata-only; browser-only checks.  
**Consequences:** `serverExternalPackages: ["sharp"]`; validation routes set `runtime = "nodejs"`.

## 2026-07-31: Metadata plus full decode
**Decision:** Always run `metadata()` then a bounded `.raw().toBuffer()` decode; discard pixels.  
**Date:** 2026-07-31  
**Reason:** Sharp `metadata()` does not fully decode compressed pixels; corrupt/truncated files can pass headers.  
**Alternatives considered:** Metadata-only; decode all animation frames.  
**Consequences:** First-frame full decode for animated images; frame limits from metadata.

## 2026-07-31: Pixel and animation safety limits
**Decision:** Enforce 20k×20k, 100M pixels, 300 frames, 150M animated pixels with Sharp `limitInputPixels`.  
**Date:** 2026-07-31  
**Reason:** 25 MB compressed size alone allows decompression bombs.  
**Alternatives considered:** Looser limits; reject all animation.  
**Consequences:** Oversized/animated-beyond-policy images become `validation_failed`.

## 2026-07-31: Separate uploaded vs validated
**Decision:** Keep storage confirmation (`uploaded`) distinct from trusted validation (`validated`).  
**Date:** 2026-07-31  
**Reason:** Storage success ≠ decodable safe image; UX and processing gates must stay honest.  
**Alternatives considered:** Merge into one status; add `ready_for_processing` now.  
**Consequences:** Previews only after `validated`; processing eligibility is a later review step.

## 2026-07-31: Keep invalid R2 objects (no immediate delete)
**Decision:** On validation failure, mark `validation_failed` and keep the private object until delete milestone.  
**Date:** 2026-07-31  
**Reason:** Supports retry/diagnostics without implementing delete/replace yet.  
**Alternatives considered:** Immediate DeleteObject; quarantine prefix.  
**Consequences:** Failed objects never get normal previews or processing eligibility.

## 2026-07-31: Encoded dimensions + orientation without rotating originals
**Decision:** Persist encoded width/height and raw EXIF orientation; never rotate/strip the original object.  
**Date:** 2026-07-31  
**Reason:** Original immutability; display orientation belongs to future processing copies.  
**Alternatives considered:** Auto-orient originals; store display-swapped dimensions only.  
**Consequences:** UI may show encoded dimensions that differ from display orientation.

## 2026-07-31: Library uses current-page signed originals as previews
**Decision:** Do not generate stored thumbnail objects yet; sign short-lived GET URLs only for validated images on the visible page.  
**Date:** 2026-07-31  
**Reason:** Avoid R2 mutation/derivative complexity while enabling a usable library.  
**Alternatives considered:** Eagerly sign whole project; public bucket; Sharp thumbnail derivatives now.  
**Consequences:** Large originals may load slowly; animated files use placeholders; generated thumbnails deferred.

## 2026-07-31: Server-side library pagination and allow-listed sort
**Decision:** Offset pagination with bounded page sizes and allow-listed sort/status/view query params.  
**Date:** 2026-07-31  
**Reason:** Prevent unbounded queries and SQL injection via sort strings.  
**Alternatives considered:** Client-side full library load; cursor pagination now.  
**Consequences:** Cursor pagination may be needed later for very large projects.

## 2026-07-31: Bulk selection without destructive actions
**Decision:** Ship checkbox selection foundation without delete/process/export actions.  
**Date:** 2026-07-31  
**Reason:** Selection UX is needed before delete/replace; destructive flows belong in the next milestone task.  
**Alternatives considered:** Hide selection entirely; show disabled destructive buttons.  
**Consequences:** Selected IDs remain client-only until a future owned-ID validation helper is used by actions.

## 2026-07-31: No distributed DB+R2 transaction claim
**Decision:** Model delete/replace as a recoverable saga with explicit statuses, not one atomic cross-system transaction.  
**Date:** 2026-07-31  
**Reason:** PostgreSQL cannot roll back a completed R2 `DeleteObject`; R2 cannot roll back DB promotion.  
**Alternatives considered:** Pretend 2PC; delete storage first.  
**Consequences:** Product-hide / promote in DB first where required; exact-key retries; recovery CLI.

## 2026-07-31: Product-hide before R2 deletion
**Decision:** Acquire `deletion_pending` + `deleted_at` before calling R2 delete.  
**Date:** 2026-07-31  
**Reason:** Users must stop seeing the image immediately; cleanup failures must not restore normal use.  
**Alternatives considered:** Wait for R2 success before hiding.  
**Consequences:** `deletion_failed` stays hidden with retry.

## 2026-07-31: Replacement candidate + new immutable key
**Decision:** Keep stable `images.id`; store candidates in `image_replacements` with a new unique `new_storage_key`; promote only after full trusted validation; delete old key only after DB promotion commits.  
**Date:** 2026-07-31  
**Reason:** Failed replacements must not displace the active original; in-place overwrite is unsafe.  
**Alternatives considered:** Overwrite same key; two active image rows.  
**Consequences:** Temporary dual storage; old cleanup failure does not undo promotion; one open replacement per image.

## 2026-07-31: Soft-deleted rows retained
**Decision:** Keep soft-deleted image rows for audit, idempotency, and cleanup retries; exclude from all normal product queries.  
**Date:** 2026-07-31  
**Reason:** Supports retry without reappearing in the library.  
**Alternatives considered:** Hard-delete DB row immediately.  
**Consequences:** Physical DB purge remains a later retention task.

## 2026-07-31: Browser-side quota reservations at authorize
**Decision:** Reserve image slots and declared bytes in PostgreSQL when authorize succeeds, before the browser PUT; consume on confirm with trusted HeadObject size; release on cancel/expiry.  
**Date:** 2026-07-31  
**Reason:** Prevent concurrent uploads from overshooting limits; declared size is the best pre-upload signal.  
**Alternatives considered:** Count only after confirm; optimistic UI without reservations.  
**Consequences:** Pending uploads consume quota; expired reservations must be released.

## 2026-07-31: R2 HeadObject size is authoritative on confirm
**Decision:** Adjust quota counters using trusted storage size from HeadObject on confirm, not browser-declared size alone.  
**Date:** 2026-07-31  
**Reason:** Clients can lie about bytes; storage is the enforcement boundary.  
**Alternatives considered:** Trust declared size permanently.  
**Consequences:** Trusted size may differ from reserved declared size; delta applied at consume.

## 2026-07-31: Release reservations after absence
**Decision:** Release expired/cancelled reservations and decrement counters when uploads fail or are abandoned.  
**Date:** 2026-07-31  
**Reason:** Avoid permanently locked slots/bytes from abandoned browser sessions.  
**Alternatives considered:** Manual operator cleanup only.  
**Consequences:** Requires reservation status tracking and idempotent release paths.

## 2026-07-31: Dual storage counts during replacement
**Decision:** Count replacement candidate bytes in effective usage until promotion + old-object cleanup completes.  
**Date:** 2026-07-31  
**Reason:** Both old and new originals may exist in R2 temporarily; quota must reflect real storage pressure.  
**Alternatives considered:** Count only active original until promote.  
**Consequences:** Replacement uploads need sufficient headroom; UI explains temporary extra usage.

## 2026-07-31: Cleanup-pending bytes remain counted
**Decision:** Bytes for images in deletion/cleanup states remain in effective usage until R2 absence is confirmed.  
**Date:** 2026-07-31  
**Reason:** Objects may still exist while cleanup retries; free space is not real until deletion succeeds.  
**Alternatives considered:** Stop counting immediately on DB hide.  
**Consequences:** Quota may stay elevated briefly after delete/replace promote until cleanup completes.

## 2026-07-31: Development quota defaults, not billing tiers
**Decision:** Enforce 10,000 images and 10 GiB per project as development defaults in code constants; do not wire Stripe plans yet.  
**Date:** 2026-07-31  
**Reason:** Milestone 3 needs enforcement without inventing paid tiers early.  
**Alternatives considered:** Per-user limits; unlimited until billing.  
**Consequences:** Limits are uniform; billing milestone will replace constants with plan-aware policy later.

## 2026-07-31: Reconcile CLI for counter drift
**Decision:** Provide `reconcile-project-quota.ts` to recompute counters from `images` + `image_replacements` source rows.  
**Date:** 2026-07-31  
**Reason:** Saga failures or manual ops may drift counters; operators need a safe repair path.  
**Alternatives considered:** Always trust incremental counters; nightly cron only.  
**Consequences:** `inconsistencyFlag` may surface in UI; reconcile is manual until scheduled jobs exist.

## 2026-07-31: Reservation rows without image/replacement FKs
**Decision:** Allow `quota_reservations.image_id` / `replacement_id` without foreign keys to images/replacements (migration `0009`); keep project FK.  
**Date:** 2026-07-31  
**Reason:** Authorize reserves capacity before inserting pending image/replacement rows.  
**Alternatives considered:** Insert image first then reserve; deferrable FKs.  
**Consequences:** Orphan reservation IDs possible if insert fails after reserve — release/cancel paths must clean them up.

## 2026-07-31: Logical slot released on delete acquire; bytes after R2 absence
**Decision:** Decrement active image count when deletion is acquired; move bytes to cleanup-pending; release bytes only after verified R2 absence.  
**Date:** 2026-07-31  
**Reason:** Product slot capacity should free for new uploads; physical storage must not be undercounted.  
**Alternatives considered:** Hold both until cleanup completes.  
**Consequences:** Available image slots can recover before storage bytes.

## 2026-07-31: Distinct ready_for_processing status
**Decision:** Add explicit `ready_for_processing` after `validated`; do not overload validated as the processing gate.  
**Date:** 2026-07-31  
**Reason:** Validated means trusted bytes/metadata; Ready means eligible for a future processing pipeline.  
**Alternatives considered:** Treat validated as ready.  
**Consequences:** Library default filter is Ready; processing eligibility checks Ready only.

## 2026-07-31: Auto-promote Ready after validation
**Decision:** Automatically evaluate and promote to Ready after successful validation when eligibility passes; no manual Ready button.  
**Date:** 2026-07-31  
**Reason:** Milestone 3 closure should leave images intake-ready without operator clicks.  
**Alternatives considered:** Explicit “Mark ready” UI.  
**Consequences:** Open replacement / missing metadata keeps status at validated.

## 2026-07-31: Replacement demotes Ready until promotion
**Decision:** When replacement begins, demote Ready → validated; after successful promotion, re-evaluate Ready.  
**Date:** 2026-07-31  
**Reason:** Active image must not stay Ready while a candidate is in flight.  
**Alternatives considered:** Keep Ready during replacement.  
**Consequences:** Temporary Ready count drop during replace flows.
