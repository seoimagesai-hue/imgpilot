# Architecture

Status legend: **Implemented** | **Planned (not implemented)**

## Consumer guest foundation (Redesign v2 Prompt 1–10) — Implemented

Public visitors use guest tools without login. Shared modules live under `src/server/guest/` and `src/app/api/guest/`.

| Piece | Detail |
| --- | --- |
| Session | `guest_sessions` + HttpOnly `seoimages_guest` cookie; raw token never stored (HMAC-SHA256) |
| Isolation | Per-session `publicId` + `tokenHash`; A/B `cohort` |
| Limits | Policy-driven (default 10 MiB, 5 ops / 24h, 1 active job, 1h immutable TTL); Metadata Editor draft save/import is op-free; bulk counts **1 op per processed file** |
| Storage | Private R2 keys `guest/{sessionPublicId}/originals|outputs|bulk/…`; server-generated only |
| Upload | `POST /api/guest/upload/authorize` + `confirm` (HeadObject + Sharp full decode) |
| Jobs | compress/resize/crop/convert/geotag/metadata.inspect/`ai.generate_alt_text`/`metadata.edit` + guest bulk parent/child |
| Bulk | `/bulk-image-tools` + `guest_bulk_*`; Compress/Resize/Convert; sequential child jobs; ZIP via JSZip |
| Download | Signed GET; Viewer/AI hide image download; Editor renamed download; bulk ZIP archive |
| Cleanup | exact-key R2 queue; geotag/metadata/AI/editor/bulk archives scrubbed on expiry |
| UI | Pluggable `GuestToolWorkspace` + `BulkToolWorkspace` |
| AI | OpenAI Chat Completions via guest adapter; authenticated `bulkAi: true` (Prompt 31); guest bulk AI off |
| Editor | Draft APIs under `/api/guest/metadata-editor/*`; schema `image-seo-metadata-v2` |
| Migration | `0026_guest_foundation`, `0027_guest_job_options`, `0028_guest_bulk` — **applied on cutover DB** (legacy guest tables archived as `*_pre_v2_archive`) |
| Health | Minimal `/api/health/*` restored in source for ready/DB/R2/worker probes |

Live Stripe Checkout remains **Blocked** until Price IDs + test-mode verification (Prompt 12 plumbing is wired). Rollback build may remain at `.next-pre-v2-cutover` until operator deletes it. Authenticated cleanup: `POST /api/internal/cron/cleanup` + scheduler heartbeat.

### Guest AI notes
- No Responses API in repo; Completions only; no automatic fallback path.
- Live generation **Blocked** until a real keyed OpenAI request succeeds.
- Purpose allow-list + language allow-list; no browser freeform prompts / model selection.
- Filename sanitized to Latin ASCII slug; Urdu content fields supported.
- Metadata Editor may import completed AI results for the same session+upload only (no new provider call).

### Guest Metadata Editor notes
- Alt text framed as website/CMS field; not claimed as universal binary metadata.
- Embedded SEO write deferred; sidecar exports + renamed-copy download only.
- Validation is a checklist (recommendation/warning/blocking) — no ranking score %.

## Frontend — Implemented

### Consumer account + admin (2026-08-04) — Implemented

| Piece | Detail |
| --- | --- |
| Callbacks | Tool return when safe; fallback homepage; authed login → `/account` |
| Header | Session-aware account panel; no Saved files / Admin in consumer menu |
| Account | `/[locale]/account/*` under marketing chrome (`noindex`) |
| Dashboard | Index redirects to `/account`; nested projects legacy/unlinked |
| Admin | `/[locale]/admin/*` + `requireSuperAdmin`; audited mutations |

## Frontend (prior) — Implemented
- Next.js App Router under `src/app`
- React Server Components by default; Client Components only for interactivity
- Tailwind CSS v4
- shadcn/ui-compatible layout helpers
- Locale-prefixed dashboard shell with desktop sidebar and mobile navigation
- Localized login and registration forms
- Localized project list, create, detail, edit, image library, and upload-foundation UI under `/[locale]/dashboard/projects`

## Server routes — Implemented (auth + projects + image foundation) / Planned (storage)
- **Implemented:** `/api/auth/[...nextauth]`, localized `/login` and `/register`, protected `/dashboard`, project CRUD, `.../images`, `.../images/upload`
- **Planned:** Cloudflare R2 APIs, multipart upload, processing workers, billing webhooks

## Database — Implemented (auth + projects + images)
- PostgreSQL via `postgres`.js + Drizzle ORM
- Singleton client in `src/db/index.ts` (hot-reload safe)
- Schema in `src/db/schema.ts`:
  - Auth: `users`, `accounts`, `sessions`, `verification_tokens`, `authenticators`
  - Product: `projects` (owned by `users`), `images` (owned via project)
- Enums: `project_status`, `metadata_language`, `image_status` (upload/validation + deletion saga: `deletion_pending` | `storage_deleting` | `deletion_failed` | `deleted`), `storage_provider` (`r2`), `image_replacement_status`
- Table `image_replacements`: candidate originals for replace lifecycle (never exposed storage keys to clients)
- Drizzle Kit config (`drizzle.config.ts`) and SQL migrations under `drizzle/`
- Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:check`
- **PostgreSQL never stores image bytes**
- Optimized-copy / batch / billing tables are **not** created
- **PostgreSQL and R2 do not share one distributed transaction.** Delete/replace use a recoverable saga with conditional DB state, exact-key R2 ops, retries, and recovery scripts.

### Images table
| Column | Notes |
| --- | --- |
| `id` | UUID text |
| `project_id` | FK → `projects.id`, `ON DELETE CASCADE` |
| `original_filename` | User-facing; never used as a storage path |
| `storage_key` | Unique; server-generated; required for persisted records |
| `storage_provider` | Controlled (`r2` reserved) |
| `mime_type` / `file_extension` | Declared metadata; binary inspection later |
| `size_bytes` | Integer bytes |
| `width` / `height` | Nullable until trusted server inspection |
| `status` | Upload lifecycle only (no processing statuses yet) |
| `failure_code` / `failure_message` | Nullable safe failure fields |
| `uploaded_at` | Set only after durable storage confirmation (future) |
| `created_at` / `updated_at` | DB timestamps |
| `deleted_at` | Soft delete |

Indexes: `project_id`; `(project_id, status)`; `(project_id, created_at)`; unique `storage_key`.

### Ownership inheritance
- **Personal projects:** `workspace_type=personal`, `organization_id` null; access via personal owner (`projects.user_id`).
- **Organization projects:** `workspace_type=organization` + `organization_id`; `projects.user_id` is creator (audit); access via active membership + permission (`getAccessibleProject`).
- Image/export/AI/processing paths call `getOwnedProject(userId, projectId, permission)` with write permissions on mutations.
- Org entitlements resolve through `organizations.billing_owner_user_id` (interim Option B).
- Missing and unauthorized share not-found behaviour.
- Soft-deleted images (`deleted_at` set / `status=deleted`) are excluded by default.
- Project soft-archive does not cascade to image rows.

### Organizations (Prompt 24) — Implemented
- Tables: `organizations`, `organization_members`, `organization_invitations`, `organization_audit_logs`
- Virtual personal workspace + cookie hint `seoimages_workspace` (validated server-side)
- Roles: `owner|admin|editor|viewer`; invites never create owners; tokens stored as SHA-256 only
- UI: `/[locale]/dashboard/orgs/*`, `/dashboard/invitations/[token]`, workspace switcher
- Reconcile: `scripts/reconcile-organizations.ts`

### Public API & outbound webhooks (Prompt 25) — Implemented
- `/api/v1/*` Bearer API keys (`si_live_|si_test_`); SHA-256 hashed; fixed scopes; workspace-bound
- DB rate-limit buckets + `Idempotency-Key` records; consistent `{ok,data|error,requestId}` envelope
- Webhooks: encrypted secrets, HTTPS SSRF checks, HMAC `v1=` signatures, delivery worker in `processing-worker`
- At-least-once delivery with bounded exponential backoff; consumers dedupe by event ID
- Developer UI: `/dashboard/settings/developer`; OpenAPI `/api/v1/openapi`; docs `/docs/api`, `/docs/webhooks`
- Separate from Stripe ingress webhook (`/api/billing/webhook`)
- No OAuth apps, GraphQL, or direct CMS publishing

### WordPress direct publishing (Prompt 26) — Implemented
- Connections: encrypted Application Passwords; HTTPS SSRF-safe site URLs; REST discovery + capability checks
- Publish jobs (DB lease saga): private R2 read → `wp/v2/media` upload → metadata update → remote verify → mapping
- Partial success preserves `remoteMediaId`; retries do not duplicate uploads
- Roles: `integrations.manage` for credentials; `wordpress.publish` for editors; no auto remote delete
- UI: `/dashboard/settings/integrations/wordpress`; project publish page; docs `/docs/wordpress`
- Self-hosted WordPress only; no posts/pages, plugin, or Webflow

### Shopify product-media publishing (Prompt 27) — Implemented
- Connections: encrypted Custom App Admin API tokens; shop host locked to `*.myshopify.com`; shop.json verification
- Publish jobs (DB lease saga): private R2 read → product images REST upload → preserve remote image ID → alt update → verify → mapping
- Product search/list server-side only; browser never calls Shopify; existing products only
- Roles: `integrations.manage` for tokens; `shopify.publish` for editors; no auto remote delete
- UI: `/dashboard/settings/integrations/shopify`; project publish page; docs `/docs/shopify`
- No OAuth, orders, inventory, product CRUD, or theme editing

### Webflow CMS asset publishing (Prompt 28) — Implemented
- Connections: encrypted site access tokens; fixed `api.webflow.com/v2`; site/collection/field discovery
- Field mappings: versioned image + optional text fields; revalidated before publish
- Publish jobs (DB lease saga): private R2 → create asset + MD5 → S3 upload (allowlisted) → verify asset → patch CMS item → verify → mapping
- Existing CMS items only; no automatic whole-site publish; no Designer automation
- Roles: `integrations.manage` for tokens/mappings; `webflow.publish` for editors; no auto remote delete
- UI: `/dashboard/settings/integrations/webflow`; project publish page; docs `/docs/webflow`

### Record integrity / finalization boundary
- Storage confirmation (`HeadObject`) yields `uploaded` — not binary proof.
- Trusted validation (`GetObject` + Sharp metadata + full decode) yields `validated`.
- Placeholder/disabled storage never inserts uploaded rows.

### Object storage — Cloudflare R2 (private direct upload)
- S3-compatible client (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), region `auto`
- Provider interface remains independent; `R2ObjectStorageProvider` when configured, else disabled
- **No local-disk / Postgres blob fallback**
- Flow: authorize → staged `pending_upload` → browser **PUT** → confirm via **HeadObject** → `uploaded` → validate via **GetObject** + Sharp → `validated` | `validation_failed`
- Browser success alone is never trusted; HeadObject alone is never full validation
- Storage key: `users/{userId}/projects/{projectId}/originals/{imageId}/{safeSuffix}`
- Originals immutable; optimized copies must use a different prefix later
- Signed GET read URLs for owned **validated** images only; never persisted
- CORS required for browser PUT (`docs/r2-cors.example.json`)
- Concurrency: 4 client uploads
- Stale pending rows expire via `uploadExpiresAt`; excluded from library; cleanup script marks failed
- Partial R2 env configuration is rejected

### Trusted validation (Sharp, Node.js only)
- Version: `image-validation-v1`
- Step 1: `metadata()` with `failOn: "error"` + `limitInputPixels`
- Step 2: bounded full decode via `.raw().toBuffer()`; pixels discarded immediately
- Metadata-only inspection is **not** claimed as full validation
- Declared MIME / extension / R2 Content-Type compared to Sharp-detected format
- Limits: 20k×20k, 100M pixels, 300 frames, 150M animated pixels; 25 MB compressed
- Animation: GIF/WebP allowed within limits (first-frame full decode); animated AVIF unsupported
- HEIC/TIFF/SVG/PDF rejected; orientation stored raw (no rotate of original)
- Invalid objects: keep in private R2, status `validation_failed`, no normal preview
- Conditional DB acquire `uploaded|validation_failed|stale validating` → `validating` (no long DB transaction across R2/decode)
- Stale `validating` retryable after 15 minutes
- `validated` means eligible for later processing **review**, not guaranteed processable by every future op

### Upload HTTP APIs
- `POST /api/projects/[projectId]/images/uploads/authorize`
- `POST /api/projects/[projectId]/images/uploads/[imageId]/confirm`
- `POST /api/projects/[projectId]/images/[imageId]/validate`
- `GET /api/projects/[projectId]/images/[imageId]/read-url`

### Upload policy module
- `src/server/images/policy.ts` + Zod validation in `validation.ts`
- Max 25 MB per file; max 500 files per batch
- Allowed MIME: jpeg, png, webp, gif, avif
- SVG deferred (active content risk)
- Zero-byte rejected; ZIP/PDF/PSD/exe/js rejected
- Declared MIME/extension checks at authorize; binary proof at validation
- **Project quota (Prompt 10):** per-project counters in `project_quota_state`; reservations in `quota_reservations`
- Reservations may reference image/replacement IDs before those rows exist (migration `0009` drops those FKs; project FK remains)
- Development defaults: 10,000 images and 10 GiB total storage (not Stripe billing tiers)
- **Effective usage bytes** = `activeOriginalBytes + reservedUploadBytes + replacementCandidateBytes + cleanupPendingBytes`
- Soft-delete / product-hide does **not** release physical bytes; release only after trusted R2 absence
- Browser declares size at authorize; server reserves slots/bytes; HeadObject trusted size on confirm adjusts counters
- Cleanup-pending bytes count until R2 absence confirmed; replacement temporarily uses dual storage
- Reconcile CLI: `npx tsx scripts/reconcile-project-quota.ts [--dry-run] [--projectId=…]` (SQL uses `now()`; no JS Date binding)
- API: `GET /api/projects/[projectId]/quota` (owner-scoped; safe numbers only)

### Ready for processing (Prompt 11 / Milestone 3 closure)
- Distinct status: `ready_for_processing` (not overloaded `validated`)
- Eligibility: upload confirmed, HeadObject trusted, validation succeeded, trusted metadata, active, owned, no open replacement, not deleting/deleted, no quota conflict
- Auto-evaluate after successful validation; promote when eligible
- Replacement demotes Ready until promotion completes, then re-evaluates
- Library default filter: Ready; badges + summary; no Process/Queue buttons
- API: `GET /api/projects/[projectId]/ready` (owner-scoped)
- Reconcile: `npx tsx scripts/reconcile-ready-for-processing.ts [--dry-run] [--projectId=…]`
- Ready ≠ processing started automatically; owner starts an explicit processing job

### Single-image processing (Prompt 12)
- **Execution model:** synchronous — client creates job, then calls execute; no queue/worker yet
- **Statuses:** `queued` → `processing` → `uploading_output` → `verifying_output` → `completed` | `failed` | `cancelled` | `cleanup_pending` | `cleanup_failed` | `stale`
- **Immutable source:** trusted original key from DB; never overwritten, never deleted by processing; never promoted from derivative
- **Source revision snapshot:** job stores `sourceStorageKey` + size/format/dimensions; completion re-checks active key
- **First operation:** `optimize_same_format` — same MIME family, same width/height, controlled quality (JPEG q82 mozjpeg; PNG compression; WebP/AVIF quality)
- **Metadata policy:** no Sharp `.rotate()`; no `.withMetadata()` → EXIF/GPS stripped; ICC not retained
- **Derivative keys:** `users/{userId}/projects/{projectId}/derivatives/{imageId}/{jobId}/a{attempt}-…` (unique per attempt)
- **Saga:** generate → PUT → HeadObject → DB derivative + job complete; failure cleans exact derivative key; cleanup_failed recoverable
- **Generated-output quota:** separate `generatedOutputBytes` + `reservedGeneratedBytes` (default 5 GiB); not counted as original-upload bytes
- **Preview:** short-lived signed GET for completed, owned, active derivative only
- **Delete:** stale active jobs; derivatives → cleanup_pending → exact-key delete
- **Replace:** stale jobs + mark derivatives stale (old revision); new Ready source may get a new job
- **Reconcile:** `npx tsx scripts/reconcile-processing-jobs.ts [--dry-run] [--projectId=…]` (bounded; exact keys; never deletes originals)
- APIs: `POST …/processing/jobs`, `GET|POST …/jobs/[jobId]?action=execute|retry|cancel`, `POST …/preview`
- Out of scope here: bulk, workers, resize, conversion, AI, ZIP, CSV, billing

### Resize presets (Prompt 13)
- Operation: `resize` with fixed presets `px_256` | `px_512` | `px_1024` | `px_2048` (longest edge)
- Always reads immutable original; never another derivative
- Sharp `fit: inside` + `withoutEnlargement: true` + lanczos3; same-format encode
- No upscale: if source longest edge ≤ preset, output keeps source width/height
- Aspect ratio preserved; no crop/stretch/pad/rotate
- Derivative kind `resized`; unique key includes preset variant folder
- Duplicate create for same image+preset returns existing completed job when source revision matches
- UI: `ImageResizePanel` with per-preset generate/retry/preview
- Project summary: optimized + resize derivative counts + generated storage bytes
- Still out of scope: format conversion, queues, bulk, AI, ZIP, CSV, billing

### Format conversion (Prompt 14)
- Operation: `convert_format` with target stored as preset `to_{jpeg|png|webp|avif}`
- Matrix-enforced: JPEG→JPEG/WebP/AVIF; PNG→PNG/WebP/AVIF; WebP→WebP/AVIF; AVIF→AVIF
- PNG→JPEG rejected in policy and Sharp safety layer; alpha kept for PNG→WebP/AVIF
- Always from immutable original; same dimensions; no derivative chaining
- Derivative kind `converted`; unique key variant `to_webp` etc.
- UI: `ImageConvertPanel`; summary: converted derivative count
- Still out of scope: queues, AI, ZIP, CSV, billing (bulk is Prompt 15)

### Bulk processing orchestration (Prompt 15)
- Tables: `bulk_jobs` + `bulk_job_items` — orchestration only; each image still uses `processing_jobs`
- Reuses `createProcessingJob` / `executeProcessingJob`; never duplicates Sharp optimize/resize/convert
- One operation per bulk run; ready-only selection; invalid images skipped with reason
- Bounded concurrency (`BULK_MAX_CONCURRENCY = 3`); max 100 images; real DB counters (no fake timers)
- Partial completion; cancel pending only; retry failed only
- Delete cancels pending bulk items; replacement stales pending bulk items
- UI: `ImageBulkToolbar` on library selection; APIs `/processing/bulk`
- Reconcile CLI: `scripts/reconcile-bulk-jobs.ts`
- Still out of scope: queues, workers, AI, ZIP, CSV, billing

### Background queue & worker (Prompt 16)
- Queue: `processing_jobs` rows in `queued`; workers claim via `FOR UPDATE SKIP LOCKED`
- Lease: `lease_owner`, `lease_expires_at`, `heartbeat_at`; expired leases requeue safely
- Worker: `scripts/processing-worker.ts` — poll, claim, heartbeat, execute existing engine, graceful shutdown
- Metrics: `worker_heartbeats` table (not exposed to browser)
- Browser: create + poll only; execute API blocked
- Bulk: enqueues children; worker syncs item terminals via `onProcessingJobTerminalForBulk`
- Still out of scope: ZIP, CSV, billing, Redis/BullMQ (AI is Prompt 17)

### AI metadata generation (Prompt 17)
- Operation: `generate_metadata` on the same `processing_jobs` queue (no second queue)
- Provider abstraction: `ImageMetadataProvider` in `ai-provider.ts` — OpenAI only; no SDK in routes/UI
- Analysis input: private original from R2 → in-memory JPEG ≤1280 longest edge (no upscale, not persisted, not a derivative)
- Output language: project `metadata_language` (`en`|`ur`), never inferred from interface locale
- Prompt: centralized `buildMetadataPrompt` + version `metadata-v1`; grounding + sensitive-inference bans
- Structured Zod validation before draft persist; filename suggestions Latin ASCII only (Urdu fields stay Urdu)
- Lifecycle: `queued` → `generating` → `validating_output` → `draft` → `reviewed` → `approved` (or `rejected`/`failed`/`stale`/`cancelled`)
- Human approval required — AI never auto-approves, renames, or publishes
- `metadata_generations` = immutable history; `image_metadata_approved` = current per image+language
- Regeneration creates a new draft; current approved snapshot stays until a new draft is approved
- Source replace/delete stales or cancels active/draft generations
- Usage: input/output tokens + provider/model stored; daily generation caps (abuse control, not billing)
- Browser never calls the provider; never receives API keys, raw payloads, or storage keys
- Reconcile: `scripts/reconcile-ai-metadata.ts` (dry-run, bounded)
- Out of scope: bulk AI, ZIP/CSV, billing, WordPress/Shopify publish, auto-rename

### Metadata management & approval (Prompt 18)
- Review UI: `/[locale]/dashboard/projects/[projectId]/metadata`
- Deterministic quality score 0–100 (alt/title/description/filename/caption rules; no AI scoring)
- Within-project duplicate warnings for alt/title/filename suggestion (never auto-fix)
- Missing approved metadata vs eligible images
- Filters + search across alt/title/filename
- Bulk approve / reject / mark_reviewed / regenerate (≤50; regenerate uses existing `generate_metadata` queue jobs)
- Version comparison: approved snapshot vs draft (word-level added/removed)
- Export foundation: `ExportReadyPackage` from approved rows only; `filesGenerated: false`
- Still out of scope: ZIP/CSV/JSON file download, CMS packages, billing

### Export packages (Prompt 19)
- Table: `export_jobs` claimed by the same processing worker (SKIP LOCKED lease)
- Builders: CSV, JSON, sidecar TXT/JSON, HTML report, README; CMS folders without live APIs
- Output: private R2 `users/{user}/projects/{project}/exports/{jobId}/…`
- Download: short-lived signed URL; owner-only; no storage keys to browser except via signed GET
- Default filter: approved metadata; optional draft/reviewed; optional include images
- Quota: reserved/generated bytes for package size
- Still out of scope: WordPress/Shopify API publishing, billing, permanent public links

### Analytics (Prompt 20)
- Routes: `/[locale]/dashboard/analytics`, `/[locale]/dashboard/projects/[projectId]/analytics`
- APIs: `/api/analytics/overview`, `/api/projects/[projectId]/analytics`
- Owner-scoped only; browser never supplies trusted counts
- Current-state metrics: images / derivatives / jobs / metadata / exports / `project_quota_state`
- Trends: real timestamps bucketed by UTC day; zero-filled; all-time charts bounded to 90 days
- Append-only `analytics_events` for activity timeline (safe metadata; idempotent keys)
- Attention panel: validation/upload/processing/metadata/export failures, quota near limit, cleanup pending
- Queue/worker: pending/active/recent failures + summarized health (`available|busy|delayed|unavailable`); no worker IDs/leases
- Charts: CSS/SVG + text summaries; no external analytics SDK; no R2 listing; no processing triggers
- Freshness: request-time for counters/trends; worker health is a heartbeat snapshot with timestamp
- Still out of scope: billing, super-admin, revenue analytics, scheduled/PDF/email reports

### Billing (Prompt 21)
- Owner model: one Stripe customer + subscription per user; projects inherit entitlements
- Plan catalog server-controlled (`free` + paid placeholders); checkout disabled without Price IDs
- Stripe Checkout + Customer Portal (hosted); webhook `/api/billing/webhook` signature-verified
- Event ledger idempotent; stale/out-of-order events ignored safely
- Entitlement snapshot drives quota/processing/AI/export limits without calling Stripe on every request
- Monthly usage ledger for processing (on complete), AI (before provider call), exports (on complete)
- Storage counters are current-state and do not reset monthly
- Downgrade/past_due: preserve data; restrict new over-limit writes; 3-day grace; cancel-at-period-end stays enabled until period end
- Billing UI: `/[locale]/dashboard/settings/billing` — success page is not payment proof
- Reconcile: `npx tsx scripts/reconcile-billing.ts` (dry-run default)
- Still out of scope: inventing prices, super-admin billing, revenue analytics, card forms

### Public marketing website (Prompt 23 + Phase 3 Prompt 1)
- Route group: `src/app/[locale]/(marketing)/**` with dedicated layout (PublicHeader / PublicFooter / skip link)
- Dashboard (`(dashboard)`) and admin (`/admin`) layouts remain separate and protected; public pages do not require auth
- Locale prefixes: English unprefixed (`as-needed`); 24 other locales under `/{locale}/...`; `/en/*` 301 → English root; RTL for `ar`/`ur`
- Layer 1 UI messages: `src/messages/**`; marketing catalogs: `src/content/locales/{locale}/**` + `_status`
- Translation CLI (server/CLI only): `scripts/i18n/{extract,audit,translate,populate-curated}.ts` with provider abstraction + glossary/TM
- Indexability gate (`src/i18n/indexability.ts`) filters sitemap, hreflang, and robots for incomplete locales/pages
- Pricing view: `src/server/marketing/pricing-view.ts` reads `listActivePlans()` — shows limits; never invents `$` amounts; Checkout entry only when Price IDs exist (otherwise “pricing being configured”)
- Checkout remains existing `/api/billing/checkout` (server Price resolution); browsers cannot submit arbitrary Price IDs
- Docs: source-controlled TSX pages via `src/server/marketing/docs-content.tsx` — no marketing CMS
- SEO: `buildPublicMetadata`, `src/app/sitemap.ts`, `src/app/robots.ts`; structured data Organization / WebSite / SoftwareApplication / BreadcrumbList only when accurate
- Public assets stay in app/static public paths — never user R2 objects or signed URLs
- Contact: validated form only (no ticket platform); support email from env when set
- Cache boundary: marketing pages must not embed user-specific project/admin data
- Claims policy: only verified product behaviour; CMS packages are export kits, not live publishing
- Machine-translated content is labelled in `_status` until human review — never claim professional approval by default

### Super-admin operations (Prompt 22)
- Role model: `users.role` = `user` | `super_admin` (default `user`); never client-controlled
- Account suspension: `account_status` = `active` | `suspended` (+ reason/by/at); preserves data; does not auto-cancel Stripe
- Provisioning: CLI `scripts/provision-super-admin.ts` only (no email-domain grant; no UI role editor in P22)
- Route gate: `requireSuperAdmin` → login if signed out; `notFound` if non-admin
- API gate: `assertSuperAdmin` re-reads role from DB on every call
- Audit: append-only `admin_audit_logs` (reason required on writes; no secrets/keys/payloads)
- Support notes: append-only `admin_support_notes` (admin-only)
- Admin surfaces: `/[locale]/admin/*` — overview, users, projects, storage, jobs, queue, workers, AI, exports, billing support, audit, alerts
- Actions reuse domain services (retry/cancel/reconcile/resync); no force-complete; no manual Stripe activation; no SQL console; no R2 bucket browser; no impersonation
- Redaction: `src/server/admin/redaction.ts`
- Stripe remains authoritative; admin may resync / reprocess failed events only

### Project image library (Prompt 8)
- Route: `/[locale]/dashboard/projects/[projectId]/images`
- Defaults: `validated`, sort `newest`, view `grid`, page size `24` (allowed 12/24/48)
- Server-side search on `original_filename` (ILIKE, escaped, max 100 chars)
- Allow-listed sorts; offset pagination; grouped status counts
- List DTOs omit `storageKey`; signed GET previews attached only for **validated rows on the current page**
- No stored thumbnail derivatives — originals used as temporary private previews
- Animated validated images use a placeholder (no autoplay)
- Grid/table toggle + selection foundation
- Single-image delete confirmation + replace panel in details dialog (no bulk delete/replace, no ZIP/process/AI)

### Delete / replace lifecycle (Prompt 9)
- **Delete ordering:** authenticate → ownership → conditional acquire (`deletion_pending` + `deleted_at`) → hide from library/previews/validation/replace → DeleteObject(trusted key) → HeadObject absence → `deleted` | `deletion_failed` + retry
- **Never** delete R2 before DB hide. Failed cleanup keeps the image product-hidden.
- **Replace:** separate `image_replacements` row + **new immutable storage key**; old active image stays until candidate is confirmed + full-decode validated + DB promotion commits; then old key cleanup
- Temporary dual storage during replacement is expected
- Already-issued signed URLs may work until TTL or object deletion; app stops issuing new ones once deletion begins
- Recovery: `recoverImageLifecycle` / `scripts/recover-image-lifecycle.ts` (dry-run supported; not scheduled)
- Soft-deleted DB rows retained for audit/idempotency; excluded from library counts/search/filters/preview

## Orphan prevention (delete/replace)
| Case | Product state | Recovery |
| --- | --- | --- |
| Delete DB hide OK, R2 delete fails | Hidden (`deletion_failed`) | Retry cleanup / recovery job |
| R2 delete OK, final DB mark fails | Hidden mid-saga | Recovery retries → `deleted` |
| Candidate uploaded, never validated | Old image active | Cancel / stale recovery |
| Validation fails | Old image unchanged | Cancel cleans candidate key |
| Promote OK, old cleanup fails | New image active | Retry old cleanup (never delete active key) |
| Cancel cleanup fails | Candidate inactive | `cancel_cleanup_failed` retry |
- Detail dialog is non-destructive and owner-scoped
- Indexes: project+status, project+created, project+filename, project+size, project+validated_at
- `/[locale]/dashboard/projects/[projectId]/images`
- `/[locale]/dashboard/projects/[projectId]/images/upload`
- Auth + project ownership required; EN LTR / UR RTL

### Projects table
| Column | Notes |
| --- | --- |
| `id` | UUID text (same strategy as users) |
| `user_id` | FK → `users.id`, `ON DELETE CASCADE` |
| `name` | Required |
| `website_url` | Optional; HTTP(S) only after validation |
| `description` | Optional plain text |
| `metadata_language` | Future AI/filename output language; **not** UI locale |
| `status` | `active` or `archived` |
| `created_at` / `updated_at` | DB timestamps |
| `archived_at` | Set on archive; cleared on restore |

Indexes: `user_id`; `(user_id, status)`; `(user_id, updated_at)` for filtered/paginated lists.

### Ownership and query boundaries
- Every project read/update/archive/restore filters by **both** `projects.id` and `projects.user_id` from the authenticated session.
- Missing and unauthorized projects share the same not-found behaviour (no existence leak).
- User ID is never accepted from form input.
- Soft archive only in the UI; permanent delete is not exposed.

### Pagination-ready list queries
- List queries accept status filter + fixed `limit` / `offset` (first version uses a sensible fixed page size).
- Do not load unbounded project sets.

### CRUD action architecture
- Server Actions in `src/server/projects/actions.ts` (not a public REST CRUD API).
- Zod schemas in `src/server/projects/validation.ts`.
- Data access in `src/server/projects/queries.ts`.
- Authenticate inside each action; revalidate localized project routes after mutations.

## Authentication — Implemented
- Auth.js (`next-auth@5.0.0-beta.32`) with App Router handlers
- Credentials provider (email/password)
- Google provider loaded only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set
- Registration via server action with Zod validation + bcrypt hashing
- Login/logout via Auth.js; generic invalid-credentials messaging
- Safe internal callback URLs only (open-redirect prevention)

### Session strategy — JWT
JWT sessions are used because Auth.js Credentials provider requires JWT. Users/accounts still persist through the Drizzle adapter for OAuth and registration records. Database `sessions` table remains for adapter compatibility / future use.

### Route protection
- Enforced in the localized dashboard layout with `auth()` + `requireUser()` (server-side)
- Middleware remains next-intl-only to avoid Edge/database incompatibilities
- Unauthenticated `/en/dashboard` → `/en/login?callbackUrl=...`
- Unauthenticated `/ur/dashboard` → `/ur/login?callbackUrl=...`
- Authenticated visitors are redirected away from login/register

### Deferred auth features
- Email verification delivery
- Password reset emails
- Magic links
- Distributed rate limiting / brute-force controls (architecture note only)

## Internationalization — Implemented
- next-intl with `/en` and `/ur`
- Auth copy in `authentication`; project copy in `projects` (EN + UR)
- Interface language remains separate from project `metadata_language`

## RTL handling — Implemented
- Locale layout sets `<html lang dir>`
- English LTR; Urdu RTL
- Auth and project forms use logical layout-friendly utilities

## Date handling
- Store UTC/DB timestamps; render with the active **interface** locale
- Do not persist formatted date strings

## Security boundaries
- Server-only secrets via Zod (`DATABASE_URL`, `AUTH_SECRET`, Google secrets)
- Password hashes never returned to clients or sessions
- Google credentials must be paired (both set or both empty)
- Auth/project event logs omit passwords, hashes, tokens, and secrets
- SQL injection mitigated by Drizzle parameterized queries
- Project descriptions rendered as text (not HTML)
- Website URLs reject non-HTTP(S) protocols
- Rate limiting is deferred and tracked in `KNOWN_ISSUES.md`

## Future systems — Planned
- R2 multipart uploads, Sharp workers, job queue, AI providers, Stripe billing

## Folder structure
```
src/
  app/                 # locale routes, dashboard, projects, api/auth
  components/auth/
  components/dashboard/
  components/projects/
  components/images/
  db/
  server/auth/
  server/projects/
  server/images/       # policy, validation, owner-scoped queries, placeholder actions
  server/storage/      # ObjectStorageProvider abstraction (disabled until R2)
  auth.ts
  i18n/
  messages/
  lib/env.ts
drizzle/               # 0000 auth, 0001 projects, 0002 early images, 0003 image foundation reshape
scripts/
```
