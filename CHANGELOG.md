# Changelog

## 2026-08-03 — Homepage PNG illustrations

- Replaced placeholder SVGs with polished soft-3D PNG illustrations (10 assets).
- Wired via `next/image` with stable dimensions; how-it-works steps now illustrated.
- Homepage Playwright 42/42; build `J1-t6YUZaf5QnuIi59bdf`.

## 2026-08-03 — Premium homepage redesign

- Rebuilt public homepage with approved copy (16 sections) and navy/blue/violet design system.
- Sticky premium header + expanded dark footer; About/Contact stubs; homepage SVGs.
- Centered Compress upload handoff (single primary action); WebSite/WebPage/FAQPage JSON-LD.
- Browser smokes EN/UR desktop+mobile; Vitest **351/351**; build `42NLUMF48ocHKHqYg_zO0`.

## 2026-08-03 — Consumer Frontend SEO Prompt 14

- Central SEO content registry (`tool-landing-content.ts`) with unique copy for all 19 indexable landings.
- Landing architecture: Hero → upload tool → Why → Benefits → How → Technical → FAQ → Related → CTA.
- FAQPage + BreadcrumbList + WebPage JSON-LD; SVG operation motifs; Server Component marketing sections.
- Uniqueness/coverage tests; Vitest **351/351**; production build `W3G6ceTXWz_1CVKStcGfR`.
- Roadmap: Stripe test-mode moved off the “Prompt 14” label; programmatic SEO → Prompt 15.

## 2026-08-03 — Consumer Frontend Redesign Prompt 13 Phase A

- Consumer chrome mega menu + mobile accordion; homepage upload-first redesign.
- Registry-driven SEO landings for format/convert/crop (shared GuestToolWorkspace).
- JPG canonical + JPEG redirects; sitemap/robots; Privacy/Terms stubs.
- Cobalt design tokens; two-column tool workspace after upload.
- Target-KB and social SEO pages deferred; Stripe still paused.
- Vitest 347; production build `pvNx7UbwJJQHJacxyG5tb`.

## 2026-08-03 — R2 expected-absence logging quieted

- `mapR2SdkError` no longer `console.error`s for NotFound / NoSuchKey / HTTP 404.
- Optional `R2_DEBUG_ABSENCE=1` enables `console.debug` for absence checks.
- Guest cleanup drain: remaining pending queue cleared (13/13); approved prior run 25/25 recorded in Prompt 12 completion docs.

## 2026-08-03 — Consumer Redesign v2 Prompt 12: Commercial billing + launch readiness

- Wired Stripe checkout/portal/webhook + central Pro plan catalog + entitlement status mapping.
- Honest `/pricing` and `/dashboard/settings/billing` (no invented $; checkout gated on Price IDs).
- Authenticated cleanup cron `POST /api/internal/cron/cleanup` + scheduler heartbeat/health.
- Vitest **334/334**; production rebuild `B9c4mpgTjBua5sEpoOSoY`; rollback `.next-pre-v2-cutover` retained.
- Playwright consumer suite **101/101** (EN/UR desktop+mobile+keyboard+console).
- Guest `/api/guest/status` soft 200 when no cookie (avoids console 403 noise during bootstrap).
- Classification: **Ready for public free launch — paid launch Blocked**.

## 2026-08-03 — Consumer Redesign v2 Prompt 11: Controlled cutover

- Archived incompatible live guest tables/enums; applied guest foundation + options + bulk SQL (`0026`–`0028`).
- Fresh `npm run build` → `.next` (`BUILD_ID` `cBA-_N_Bki5mMQqy78Jxl`); old build retained at `.next-pre-v2-cutover`.
- Restored `/api/health/*`; fixed AI Alt / Metadata Editor client boundary 500s.
- Live API-heavy E2E Passed; Vitest 324/324; live OpenAI still Blocked. Rollback not required.

## 2026-08-03 — Consumer Redesign v2 Prompt 10: Public bulk + ZIP + gates

- Public `/bulk-image-tools` for Compress/Resize/Convert; guest parent/child jobs; ZIP+manifest; free gates; signed-in elevated caps. Resolved `bulkAi` (authenticated true; guest bulk AI off). Full suite green. Live `.next` not cut over.

## 2026-08-03 — Consumer Redesign v2 Prompt 9: Metadata Editor on shared workspace

- Metadata Editor mounts shared workspace (~91% UI reuse). Guest `metadata.edit` + `image-seo-metadata-v2`; blank draft; same-session AI import without provider call; client TXT/JSON/CSV/HTML exports; renamed download via Content-Disposition only. Baseline `bulkAi` failure unchanged; no new test regressions.

## 2026-08-03 — Consumer Redesign v2 Prompt 8: AI Alt Text on shared workspace

- AI Alt Text mounts shared workspace (~91% UI reuse). Guest `image-seo-ai-v2` via OpenAI Chat Completions (no Responses API in repo). Live generation Blocked without keyed request. Baseline `bulkAi` failure unchanged; no new test regressions.

## 2026-08-03 — Consumer Redesign v2 Prompt 7: Metadata Viewer on shared workspace

- Metadata Viewer mounts shared workspace (~92% UI reuse). Viewer-only `metadata.inspect`; allow-listed Sharp/piexifjs extraction; client TXT/JSON Blob exports. Baseline `ai-metadata.test.ts` bulkAi failure unchanged; no new test regressions.

## 2026-08-03 — Consumer Redesign v2 Prompt 6: Geotag on shared workspace

- Geotag page mounts shared workspace (~91% UI reuse). JPEG-only GPS write via piexifjs with round-trip verification; coordinate scrub on cleanup. Baseline `ai-metadata.test.ts` bulkAi failure unchanged; no new test regressions.

## 2026-08-03 — Consumer Redesign v2 Prompt 5: Convert on shared workspace
- Guest `convert.format` with dedicated matrix (PNG→JPEG only via explicit white/black flatten); AVIF runtime probe; quality presets.
- Convert page mounts shared workspace (~92% UI reuse). Baseline `ai-metadata.test.ts` bulkAi failure unchanged; no new test regressions.
- Docs: prompt-5 inspection + completion. Live `.next` not cut over.

## 2026-08-03 — Consumer Redesign v2 Prompt 4: Crop on shared workspace
- Custom crop editor (no new dependency) + `crop.same_format`; normalized coords; `rotate()` before extract; reprocess cleans prior outputs.
- Crop homepage card ready; EN/UR crop strings; ~91% UI reuse of `GuestToolWorkspace`.
- Docs: `docs/consumer-redesign-v2-prompt-4-inspection.md`, completion note. Live `.next` not cut over.

## 2026-08-03 — Consumer Redesign v2 Prompt 3: Resize on shared workspace
- Pluggable `GuestToolConfig` + shared `GuestToolWorkspace`; Compress/Resize mount the same shell (~92% UI reuse).
- Guest `resize.same_format` (by width/height/fit inside; Exact Size locked); homepage Resize ready; EN/UR resize + compare strings.
- Docs: `docs/consumer-redesign-v2-prompt-3-inspection.md`, `docs/consumer-redesign-v2-prompt-3-completion.md`. Live `.next` not cut over.

## 2026-08-03 — Consumer Redesign v2 Prompt 2: compress + reusable tool UX

- Reusable `GuestToolWorkspace` funnel (drag/drop/paste, large CTA, presets + strength slider without exposing Sharp numbers, real progress stages, before/after metadata, results panel, download / compress another).
- Guest compress: `compress.same_format`; size-saved + processing time; privacy-safe analytics (no filenames/bytes).
- Migration `0027_guest_job_options`; homepage handoff; EN/UR; upgrade CTA when near free limits.
- Docs: inspection + completion. Live `:3000` `.next` not replaced.

## 2026-08-03 — Consumer Redesign v2 Prompt 1: guest foundation

- Shared guest architecture: session, HttpOnly `seoimages_guest` cookie, HMAC token storage, A/B cohort, rolling limits, one-active-job guard.
- Private R2 guest keys (`guest/{session}/…`), authorize/confirm uploads, Sharp validation, signed downloads that do not extend 1-hour expiry.
- Job lifecycle shell only (`foundation.noop`) — no compress/resize/etc. tool transforms yet.
- Cleanup queue + `npm run worker:guest-cleanup`; migration `0026_guest_foundation`.
- Consumer marketing layout, tool-first homepage, shared guest UI components, EN/UR `messages/guest/*`.
- Minimal authenticated compile restores (quota-policy, login, org/api stubs) so source typechecks.
- Completion: `docs/consumer-redesign-v2-prompt-1-completion.md`. Next: Prompt 2 Compress (pending approval). Live `.next` on :3000 not replaced in this phase.

## 2026-08-01 — Prompt 28: Webflow CMS asset publishing

- Migration `0025_webflow.sql`: encrypted site tokens, field mappings, publish jobs, media mappings, bulk parents.
- Auth: Site access token (Bearer) only — not OAuth; API host fixed to `api.webflow.com/v2`.
- Two-step asset upload (MD5 + S3 form POST); 4 MiB image cap; update existing CMS items only; no whole-site publish.
- Roles: owner/admin manage credentials/mappings; editors publish; viewers view-only. Plan defaults (no invented $).
- UI: `/dashboard/settings/integrations/webflow`, project publish page; EN/UR; docs `/docs/webflow`.
- Worker claim/execute beside WP/Shopify; reconcile `npm run reconcile:webflow`.
- Live Webflow publish: Blocked without safe test site/token. No Designer automation, item creation, or remote delete.

## 2026-08-01 — Prompt 27: Shopify product-media publishing

- Migration `0024_shopify.sql`: encrypted Custom App Admin API tokens, publish jobs, product media mappings, bulk parents.
- Auth: Custom App access token only (not OAuth); API host locked to `*.myshopify.com`; attach images to existing products only.
- Publish saga reuses queue leasing: private R2 → product image upload → preserve remote image ID → alt update → verify → mapping.
- Roles: owner/admin manage connections; owner/admin/editor publish; viewer view-only. Plan defaults for connections/monthly publishes (no invented $).
- UI: `/dashboard/settings/integrations/shopify`, project publish page; EN/UR; docs `/docs/shopify`.
- Worker claim/execute beside WordPress; reconcile `npm run reconcile:shopify`.
- Live Shopify development-store publish: Blocked without safe store. No orders/inventory/product CRUD/remote delete/OAuth.

## 2026-08-01 — Prompt 26: Direct WordPress integration

- Migration `0023_wordpress.sql`: connections (encrypted Application Passwords), publish jobs, media mappings, bulk parents.
- Self-hosted HTTPS WordPress only; Application Password auth; SSRF-safe URL checks; REST discovery + capability verification.
- Publish saga: private R2 read → media upload → preserve remote ID → metadata update → verify → mapping; partial success + metadata-only retry.
- Roles: owner/admin manage connections; owner/admin/editor publish; viewer view-only. Plan defaults for connections/monthly publishes (no invented $).
- UI: `/dashboard/settings/integrations/wordpress`, project publish page; EN/UR; docs `/docs/wordpress`.
- Worker claim/execute in `processing-worker`; reconcile `npm run reconcile:wordpress`.
- Live self-hosted media publish: Blocked without safe test site. No posts/pages, no remote delete, no plugin, no Shopify/Webflow.

## 2026-08-01 — Prompt 25: Public API keys, webhooks & integrations foundation

- Migration `0022_api_webhooks.sql`: API keys, idempotency, DB rate-limit buckets, usage counters, webhook endpoints/events/deliveries, integration audit.
- Versioned REST API under `/api/v1` (projects, images, uploads, processing, metadata, exports) with Bearer keys, scopes, idempotency, cursor pagination.
- API keys: `si_live_|si_test_` format, SHA-256 at rest, one-time display, revoke/rotate, workspace-bound; owner/admin manage org keys.
- Outbound webhooks: HTTPS SSRF guards, encrypted secrets, HMAC signatures, verification, retries with backoff, delivery history (at-least-once).
- Developer UI EN/UR: `/dashboard/settings/developer`; OpenAPI at `/api/v1/openapi`; public docs `/docs/api` + `/docs/webhooks`.
- Plan defaults: `apiAccessEnabled` / `webhooksEnabled` + conservative caps (no invented prices).
- Reconcile: `npm run reconcile:api`. Live: `npm run verify:api`. Live external HTTPS delivery: Blocked without safe receiver.
- No OAuth apps, GraphQL, CMS publishing, or Zapier.

## 2026-08-01 — Prompt 24: Organizations, roles & shared collaboration

- Migration `0021_organizations.sql`: organizations, members, invitations (hashed tokens), audit logs; `projects.workspace_type` / `organization_id` / `created_by_user_id` with personal backfill.
- Virtual personal workspace (`type=personal`, id=userId); org projects belong to `organizationId`; existing project URLs unchanged.
- Fixed roles `owner|admin|editor|viewer` with server permission matrix; `getAccessibleProject` / `getOwnedProject(permission)` on shared paths.
- Billing **Option B**: `billing_owner_user_id`; entitlements/monthly usage from billing owner; ownership transfer does not move Stripe.
- Invitations: SHA-256 token hash, 7-day TTL, email match, single-use; copy-link for owner/admin when no mail provider (email delivery Blocked).
- UI: workspace switcher; `/dashboard/orgs/*`; invitation accept/decline; personal→org project transfer; EN/UR `organizations.*`.
- Reconcile: `npm run reconcile:organizations` (dry-run default). Live: `verify:organizations`. Browser: `verify:organizations:browser`.
- Unit: `tests/organizations.test.ts`. Org→personal transfer deferred. No SSO / seat billing / R2 key rewrite.

## 2026-08-01 — Prompt 23: Public marketing website, pricing, docs & SEO

- Public marketing layout under `[locale]/(marketing)` with nav, footer, skip link — separate from dashboard/admin shells.
- Homepage, features hub + six feature pages, how-it-works, pricing, security, FAQ, contact.
- Docs hub + getting-started, uploads, validation, processing, AI metadata, exports, billing (source-controlled; no CMS).
- Legal: Privacy, Terms, Cookies, Acceptable Use — accurate behaviour + visible legal-review placeholders where company/jurisdiction missing.
- EN + UR marketing messages; Urdu RTL; locale switch preserves route.
- Pricing from server plan catalog limits only; **no invented dollar amounts**; paid Checkout CTAs only when Stripe Price IDs configured.
- SEO: unique titles/descriptions, canonicals, hreflang, Open Graph, `/sitemap.xml`, `/robots.txt`, Organization/WebSite/SoftwareApplication (+ BreadcrumbList on docs).
- Dashboard/admin/auth remain noindex and excluded from sitemap; Checkout stays server-controlled.
- Tests: `tests/marketing.test.ts`; browser: `scripts/verify-marketing-browser.ts`.
- No new processing/AI/export features; no direct CMS publishing; no fake social proof; no non-essential tracking.

## 2026-08-01 — Prompt 22: Super-admin operations panel

- Migration `0020_admin.sql`: `user_role` / `account_status` on `users`, append-only `admin_audit_logs`, `admin_support_notes`.
- Explicit `super_admin` role (default `user`); existing users remain normal users; registration/profile cannot set role.
- Provisioning: `npx tsx scripts/provision-super-admin.ts --email=... --apply` (CLI only; no UI role changes; last-admin protected on demote/suspend).
- Session JWT carries `role` + `accountStatus` refreshed from DB; suspended accounts cannot sign in / use protected routes.
- Admin UI: `/[locale]/admin` (+ users, projects, jobs, queue, workers, storage, AI, exports, billing, audit, alerts) — distinct dark ops shell; not shown to normal users.
- Every admin write: server re-checks super-admin, requires reason (≥8 chars), writes audit (no secrets).
- Safe ops reuse domain services: job retry/cancel, bulk retry/cancel, quota/processing reconcile, stale lease recovery, cleanup retry, Stripe resync + failed webhook reprocess (Stripe remains authoritative; no manual activation).
- Redaction: no password hashes, tokens, R2 keys, signed URLs, Stripe/AI secrets, lease tokens, raw webhook/provider payloads.
- Live verify: `scripts/verify-admin-live.ts`. Unit: `tests/admin.test.ts`.

## 2026-08-01 — Prompt 21: Stripe billing & commercial entitlements

- Migration `0019_billing.sql`: billing accounts, subscriptions, entitlement snapshots, Stripe event ledger, monthly usage ledger.
- Official `stripe` SDK (server-only); Checkout + Customer Portal; webhook signature verification + idempotency + stale-event handling.
- Plan catalog: Free (always) + Starter/Professional/Agency placeholders — **no invented customer-facing prices**; checkout blocked until Price IDs configured.
- Entitlements feed existing quota/processing/AI/export limits; monthly usage recorded idempotently; storage does not reset monthly.
- Downgrade/past_due: data preserved; restricted writes; 3-day grace; cancel-at-period-end remains active until period end.
- Billing UI: `/[locale]/dashboard/settings/billing` (+ success page that is not payment proof).
- Live: `scripts/verify-billing-live.ts`; reconcile: `scripts/reconcile-billing.ts`.
- Live Stripe paid checkout: Blocked until operator sets test-mode keys + Price IDs.

## 2026-08-01 — Prompt 20: Analytics dashboard & usage reporting

- Migration `0018_analytics_events.sql`: append-only `analytics_events` + indexes on jobs/exports/derivatives/metadata timestamps.
- User overview and project analytics dashboards (EN/UR, RTL-safe).
- Date ranges: last 7/30/90 days and all-time (UTC day buckets; no fabricated history).
- Current-state totals from source tables / `project_quota_state`; trends from real entity timestamps.
- Attention panel, activity timeline, summarized queue/worker health (no worker IDs/leases).
- CSS/SVG charts with text summaries; no external analytics SDK; no billing/admin.
- APIs: `/api/analytics/overview`, `/api/projects/[projectId]/analytics`.
- Live: `scripts/verify-analytics-live.ts`. Tests: `tests/analytics-policy.test.ts`.

## 2026-08-01 — Prompt 19: ZIP/CSV/JSON & CMS export packages

- Migration `0017_export_packages.sql`: `export_jobs` with lease fields.
- Worker builds packages (`jszip`) and uploads private R2 objects under `/exports/`.
- Contents: metadata.csv, metadata.json, report.html, README.txt, sidecars/, cms/{generic|wordpress|shopify|webflow}/.
- Optional image bytes in ZIP; default source = approved metadata.
- Signed download via owner-only API; no public URLs; no CMS API connections.
- Review UI: start export + poll + download.
- Live: `scripts/verify-export-live.ts`.
- No WordPress/Shopify publishing APIs; no billing.

## 2026-08-01 — Prompt 18: metadata management & approval workflow

- Review dashboard at `/[locale]/dashboard/projects/[projectId]/metadata`.
- Deterministic SEO quality scoring (no AI); duplicate + missing-approved detection.
- Search/filters for draft/reviewed/approved/rejected/failed/stale/missing/duplicate/low_quality.
- Bulk approve, reject, mark reviewed, regenerate (bounded ≤50; regenerate reuses queue).
- Side-by-side approved vs draft word diff.
- Export foundation: `buildExportReadyMetadata` + `/metadata/export-preview` (normalized JSON only; no ZIP/CSV files).
- Tests: `tests/metadata-review.test.ts`; live: `scripts/verify-metadata-review-live.ts`.
- No ZIP/CSV/WordPress/Shopify/billing.

## 2026-07-31 — Prompt 17: AI metadata generation

- Migration `0016_ai_metadata.sql`: `generate_metadata` operation, `metadata_generations`, `image_metadata_approved`.
- Provider abstraction (OpenAI `gpt-4o-mini`); server-only `AI_*` / `OPENAI_API_KEY`; app builds with AI disabled.
- Worker reuses Prompt 16 queue; temporary bounded analysis JPEG (≤1280px); originals never modified or public.
- Structured fields: alt, title, caption, description, filename suggestion (Latin ASCII slug; never auto-applied).
- Lifecycle: queued → generating → draft → reviewed → approved (explicit human approval only).
- EN/UR metadata language separate from interface locale; RTL editor for Urdu metadata.
- Usage token tracking; daily per-image/project safeguards (not billing).
- Reconcile: `scripts/reconcile-ai-metadata.ts`; live: `verify-metadata-live.ts`; browser: `verify-metadata-browser.ts`.
- No bulk AI, ZIP, CSV, billing, auto-rename, or publishing.

## 2026-07-31 — Prompt 16: background queue & worker

- Migration `0015_processing_queue.sql`: lease columns on `processing_jobs` + `worker_heartbeats`.
- DB-backed queue with `FOR UPDATE SKIP LOCKED` claim; lease TTL + heartbeat; expired-lease requeue.
- Worker: `npm run worker:processing` / `scripts/processing-worker.ts` — graceful SIGINT/SIGTERM.
- Browser creates/polls only; HTTP execute returns `QUEUE_WORKER_REQUIRED`.
- Bulk enqueues child jobs; worker updates bulk item terminals.
- Reuses Prompt 12–14 processing engine unchanged.
- Live: `scripts/verify-queue-live.ts`; browser: `scripts/verify-queue-browser.ts`.
- No AI, ZIP, CSV, or billing.

## 2026-07-31 — Prompt 15: bulk processing (synchronous)

- Migration `0014_bulk_processing.sql`: `bulk_jobs` + `bulk_job_items` orchestration tables.
- Reuses Prompt 12–14 `createProcessingJob` / `executeProcessingJob` — no duplicated Sharp logic.
- One operation per run (optimize / resize preset / convert target); ready-only selection; skip with reason.
- Bounded concurrency (`BULK_MAX_CONCURRENCY = 3`); max 100 images; real progress counters; partial completion.
- Cancel affects pending only; retry failed only; delete/replace stale pending bulk items.
- UI bulk toolbar on library selection; APIs under `/api/projects/.../processing/bulk`.
- Reconcile: `scripts/reconcile-bulk-jobs.ts`.
- Live: `scripts/verify-bulk-live.ts`; browser: `scripts/verify-bulk-browser.ts`.
- No queues, workers, AI, ZIP, CSV, or billing.

## 2026-07-31 — Prompt 14: format conversion

- Migration `0013_format_conversion.sql`: `convert_format` operation + `converted` derivative kind.
- Central conversion matrix: JPEG→JPEG/WebP/AVIF; PNG→PNG/WebP/AVIF; WebP→WebP/AVIF; AVIF→AVIF.
- PNG→JPEG explicitly rejected (no silent flatten). Alpha preserved for PNG→WebP/AVIF.
- Always reads immutable original; same dimensions; unique private derivative per target format.
- UI convert panel (EN/UR); project summary converted derivative count.
- Live: `scripts/verify-conversion-live.ts`; browser: `scripts/verify-conversion-browser.ts`.
- No queues, bulk, AI, ZIP, CSV, or billing.

## 2026-07-31 — Prompt 13: resize presets

- Migration `0012_resize_presets.sql`: `resize` operation, `resized` derivative kind, `preset` / checksum / duration columns.
- Fixed presets only: `px_256`, `px_512`, `px_1024`, `px_2048` (longest-edge).
- Never upscales; aspect ratio preserved; no crop/stretch/pad/rotate; same format as source.
- Always reads immutable original — never another derivative.
- Unique derivative key per job/preset/attempt; trusted HeadObject + checksum + duration.
- Project summary shows optimized/resize derivative counts and generated storage.
- Live: `scripts/verify-resize-live.ts`; browser: `scripts/verify-resize-browser.ts`.
- No format conversion, queues, bulk, AI, ZIP, CSV, or billing.

## 2026-07-31 — Prompt 12: single-image processing foundation

- Migration `0011_processing_jobs.sql`: `processing_jobs`, `image_derivatives`, generated-output quota columns.
- Synchronous create → execute job lifecycle (`queued` → `processing` → `uploading_output` → `verifying_output` → `completed` / `failed`).
- First operation: same-format / same-dimension controlled-quality optimize (JPEG/PNG/WebP/AVIF sources; GIF/animated rejected).
- Originals immutable; every attempt uses a new private derivative key under `/derivatives/`.
- Completion only after R2 HeadObject verification + DB derivative/job commit (recoverable saga).
- Retry with new key; failed-output cleanup; delete/replace stale invalidation.
- Separate `generatedOutputBytes` / `reservedGeneratedBytes` (5 GiB project default; not billing).
- Owner signed preview for completed derivatives only.
- Reconcile: `scripts/reconcile-processing-jobs.ts`; live/browser verify scripts.
- No queue workers, bulk, resize, format conversion, AI, ZIP, CSV, or billing.

## 2026-07-31 — Ready for processing & Milestone 3 closure

- Migration `0010_ready_for_processing.sql`: distinct `ready_for_processing` image status.
- Auto-promote after trusted validation when eligibility passes; remain `validated` otherwise.
- Replacement start demotes Ready → validated; successful promotion re-evaluates Ready.
- Ready summary API `GET /api/projects/[projectId]/ready`; library Ready filter/badge/summary.
- Reconcile CLI: `scripts/reconcile-ready-for-processing.ts`; live/browser verify scripts.
- Milestone 3 marked complete. No processing queues, compression, AI, ZIP, or billing.

## 2026-07-31 — Project quota and storage accounting

- Migration `0008_project_quota.sql`: `project_quota_state` + `quota_reservations`.
- Migration `0009_quota_reservation_fk_relax.sql`: drop reservation FKs to images/replacements so capacity can be reserved before related rows exist.
- Development defaults: 10,000 images / 10 GiB per project (not Stripe billing tiers).
- Reservation flow at authorize; consume on confirm with trusted HeadObject size; release on cancel/expiry.
- Effective usage includes active originals, reserved uploads, replacement candidates, and cleanup-pending bytes.
- Soft-delete / hide does **not** release physical bytes until trusted R2 absence.
- Owner-scoped `GET /api/projects/[projectId]/quota`; library + upload UI summary; EN/UR strings.
- Upload panel client-side limit hints; safe quota error mapping on upload/replace.
- Reconcile CLI: `scripts/reconcile-project-quota.ts`; live: `scripts/verify-quota-live.ts`; browser: `scripts/verify-quota-browser.ts`.
- Live R2 + interactive Playwright (EN/UR/mobile) + concurrent last-slot race Passed.
- No processing/AI/ZIP/billing.

## 2026-07-31 — Image delete and replace lifecycle

- Recoverable delete saga: hide in DB first, then exact-key private R2 cleanup with retry.
- Replacement candidates use a new immutable storage key; old original stays active until trusted validation + DB promotion.
- Old R2 object deleted only after promotion commits; cleanup failure does not undo the promoted image.
- Owner-scoped delete/replace APIs, details-dialog UI, EN/UR strings, recovery CLI (dry-run).
- Migration `0007_image_delete_replace`. Live R2 + interactive Playwright verification Passed.
- No processing/AI/ZIP/billing/quota.

## 2026-07-31 — Image library polish

- Server-side pagination, filename search, allow-listed sort, status filters, status counts.
- Grid/table views with query-string state; bulk selection foundation (no destructive actions).
- Private signed previews only for **validated images on the current page** (no stored thumbnail derivatives).
- Image detail dialog; loading/empty states; EN/UR strings; indexes migration `0006_library_indexes`.
- Interactive Playwright verification Passed (EN/UR, mobile, preview network, User B + signed-out isolation).
- No delete/replace, processing, AI, ZIP, or billing.

## 2026-07-31 — Trusted server-side image validation

- Added Sharp (`^0.35.3`) for Node.js-only metadata inspection **and** bounded full decode (not metadata-only).
- Lifecycle: `uploaded` → `validating` → `validated` | `validation_failed`.
- Migration `0005_image_validation.sql` (additive enum values + metadata columns).
- R2 `GetObject` via `getObjectBuffer` using trusted DB storage keys only.
- Validate API + post-confirm UI validation; library default `validated`; previews only when validated.
- Invalid originals kept privately in R2 (delete deferred); originals never mutated.
- Live script Passed for JPEG/PNG/WebP + corrupt reject. Browser UI / two-user validation Not run.
- No compression, resize, format conversion, queue, AI, delete/replace, or billing.

## 2026-07-31 — Cloudflare R2 private direct upload

- Added AWS SDK v3 S3 client + presigner; R2 provider behind storage abstraction.
- Staged uploads: authorize → browser PUT → HeadObject confirm → `uploaded`.
- Migration `0004_r2_upload_staging.sql` (expiry, etag, confirmation metadata).
- APIs for authorize/confirm/signed read; concurrency-limited upload UI.
- CORS example and expired-pending cleanup script.
- Operator live R2 upload verified on private `seoimages-dev` (credentials + CORS).
- No multipart, processing, AI, or billing.

## 2026-07-31 — Live R2 upload verification

- Confirmed authorize → browser PUT → HeadObject confirm path against Cloudflare R2.
- `R2_ENDPOINT` required in env group (partial config rejected without it).

## 2026-07-31 — Image upload domain foundation

- Added/reshaped `images` schema (statuses, soft delete, storage provider, failure fields).
- Applied migration `drizzle/0003_image_domain_foundation.sql` (images table only; auth/projects untouched).
- Added upload policy, Zod validation, disabled storage abstraction (`StorageNotConfiguredError`).
- Added localized image library + upload placeholder routes; project detail entry point.
- Removed premature AWS SDK / R2 API integration from this phase.
- Placeholder upload cannot report success and creates no image rows / no local files.
- Unit + domain verification scripts updated; real R2 upload remains Not run.

## 2026-07-31 — Project CRUD

- Added `projects` table (Drizzle) with owner FK, status/metadata enums, and ownership indexes.
- Generated and applied non-destructive migration `drizzle/0001_lean_omega_sentinel.sql`.
- Localized create/list/view/edit + soft archive/restore under `/[locale]/dashboard/projects`.
- Server actions enforce session ownership; metadata language separate from UI locale.
- Unit tests for validation/filters; live two-user isolation via `scripts/verify-projects-live.ts`.
- No uploads, storage, processing, AI, or billing in this change.

## 2026-07-31 — Supabase live auth verification

- Connected development Supabase PostgreSQL via `DATABASE_URL` (secrets not committed).
- Applied auth migration; verified tables/constraints.
- Live verification passed (33/33): registration hash storage, duplicates, login, invalid login, EN/UR protection, logout, cleanup.
- Added `scripts/verify-auth-live.ts` and `scripts/inspect-auth-schema.ts` for repeatable checks.
- URL-encoded special characters in DB passwords when present in connection strings.

## 2026-07-31 — Live DB verification attempted (blocked)

- Re-inspected auth migration: auth-only CREATE TABLE / FK statements; no destructive DROP/TRUNCATE.
- Improved DB CLI env loading from `.env.local` without logging secret values.
- Enabled TLS for Neon/Supabase-style connection URLs in the Postgres client.

## 2026-07-31 — Auth + database foundation

- Added PostgreSQL/Drizzle auth schema and Auth.js credentials authentication.
- Generated initial migration; localized login/register; protected dashboard.

## 2026-07-31 — Milestone 0 foundation (validated)

- Next.js App Router foundation, i18n/RTL, docs, lint/test/build scripts.
