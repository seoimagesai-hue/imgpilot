# SEO Images

Consumer-first multilingual image SEO platform — free public guest tools plus an authenticated bulk SaaS.

## Setup

```bash
cp .env.example .env.local
# Edit .env.local locally (do not paste secrets into chat):
# - DATABASE_URL=postgresql://...   # development DB; include sslmode=require for Neon/Supabase
# - AUTH_SECRET=...                 # openssl rand -base64 32
# - R2_* vars required for guest uploads and project uploads
npm install
npm run db:check
npm run db:migrate
npm run build
npm run start
```

Guest cleanup worker (separate process / cron):

```bash
npm run worker:guest-cleanup
```

Health: `GET /api/health/ready` (also `/api/health`, database, storage, worker, scheduler probes).

After cutover (Prompt 11), live guest schema is v2 (`0026`–`0028`). Optional live smoke:

```bash
npx tsx scripts/verify-guest-cutover-live.ts
```

Rollback build may exist at `.next-pre-v2-cutover` — do not delete until approved.

Open:
- http://localhost:3000/en — consumer homepage (guest tools)
- http://localhost:3000/en/compress-image — Compress (guest, no login)
- http://localhost:3000/en/resize-image — Resize (same GuestToolWorkspace)
- http://localhost:3000/en/crop-image — Crop (same GuestToolWorkspace + custom editor)
- http://localhost:3000/en/convert-image — Convert (same GuestToolWorkspace)
- http://localhost:3000/en/geotag-image — Geotag (JPEG GPS; same GuestToolWorkspace)
- http://localhost:3000/en/image-metadata — Metadata Viewer (same GuestToolWorkspace; no image derivative)
- http://localhost:3000/en/ai-alt-text — AI Alt Text (server-side OpenAI when configured)
- http://localhost:3000/en/image-metadata-editor — Metadata Editor (same workspace; sidecar exports + renamed download)
- http://localhost:3000/en/bulk-image-tools — Bulk Compress/Resize/Convert + ZIP (guest limits)
- http://localhost:3000/ur — Urdu (RTL) consumer homepage
- http://localhost:3000/en/pricing — plan limits (Checkout when Price IDs configured)
- http://localhost:3000/en/docs — public documentation
- http://localhost:3000/en/login — sign in
- http://localhost:3000/en/dashboard — requires sign-in

### Public marketing website (Prompt 23)

- Localized public routes under `/[locale]/…` (always-on `en` / `ur`). Root `/` redirects to the default locale.
- Marketing layout is separate from dashboard and admin shells (`src/app/[locale]/(marketing)/`).
- Copy lives in `src/messages/marketing/{en,ur}.json` (source-controlled; no marketing CMS).
- Pricing reads the server plan catalog (`getPublicPricingView`) — shows Free + paid **limits**; does **not** invent dollar prices. Paid Checkout CTAs appear only when approved Stripe Price IDs are configured.
- SEO: `src/server/marketing/seo.ts`, `/sitemap.xml`, `/robots.txt`. Private dashboard/admin routes are noindex and excluded from the sitemap.
- Format/convert/crop SEO landings: route registry `src/lib/marketing/tool-landing-registry.ts` + unique body copy `src/lib/marketing/tool-landing-content.ts` (Prompt 14). Sitemap paths come from the registry.
- Premium homepage copy/layout: `src/lib/marketing/homepage-content.ts` + `src/components/marketing/homepage-view.tsx` (centered upload → Compress).
- Legal pages include accurate product behaviour plus visible “legal review required” placeholders where company/jurisdiction data is missing.
- Optional `SUPPORT_EMAIL` in `.env.local` for the contact page.
- Verify: `npx vitest run tests/marketing.test.ts`
- Browser smoke (production server): `npx tsx scripts/verify-marketing-browser.ts http://localhost:3000`

Current public limitations: no fake testimonials, no public status page, no non-essential tracking. WordPress, Shopify, and Webflow CMS publish are dashboard-only.

### Webflow integration (Prompt 28)

- Requirements: Webflow **site access token** with `assets:read`/`assets:write` and CMS scopes; Data API v2.
- Connect: `/[locale]/dashboard/settings/integrations/webflow`. Token encrypted at rest; never returned; browser never calls Webflow.
- Configure field mapping (image + optional text fields), then publish from `/[locale]/dashboard/projects/<id>/webflow` to an **existing** CMS item.
- Worker: private R2 → create asset (MD5) → S3 upload → verify → patch CMS item → mapping. Does **not** publish the whole Webflow site. Max image **4 MiB**.
- SaaS delete/disconnect does **not** delete Webflow assets.
- Migrate: `npm run db:migrate` (includes `0025_webflow.sql`).
- Unit: `npx vitest run tests/webflow.test.ts`
- Live DB: `npm run verify:webflow`
- Browser: `npm run verify:webflow:browser -- http://localhost:3000`
- Reconcile: `npm run reconcile:webflow`
- Docs: `/docs/webflow`
- Live publish against a real Webflow site is **Blocked** until a safe test token exists.
- Not included: OAuth, Designer automation, CMS item creation, remote delete, whole-site publish.

### Shopify integration (Prompt 27)

- Requirements: Shopify Custom App with Admin API access token (`read_products`, `write_products`), shop on `*.myshopify.com`.
- Connect: `/[locale]/dashboard/settings/integrations/shopify`. Token encrypted at rest; never returned after save; browser never calls Shopify.
- Publish: `/[locale]/dashboard/projects/<id>/shopify` — select active store, existing product, eligible derivative, approved metadata language, filename mode.
- Worker runs private R2 → product image upload → verify → mapping. Partial success retries without duplicate upload. SaaS delete does **not** delete Shopify images.
- Migrate: `npm run db:migrate` (includes `0024_shopify.sql`).
- Env (optional): `SHOPIFY_*` — see `.env.example`.
- Unit: `npx vitest run tests/shopify.test.ts`
- Live DB (no real store): `npm run verify:shopify`
- Browser: `npm run verify:shopify:browser -- http://localhost:3000`
- Reconcile (dry-run): `npm run reconcile:shopify`
- Docs: `/docs/shopify`
- Live media publish against a real Shopify store is **Blocked** until a safe development store is available.
- Not included: OAuth install, product/variant CRUD, orders, inventory, remote delete, Webflow.

### WordPress integration (Prompt 26)

- Requirements: self-hosted WordPress over **HTTPS**, REST API enabled, **Application Password** (not the account password), user able to upload/edit media.
- Connect: `/[locale]/dashboard/settings/integrations/wordpress` (workspace-scoped). Credentials encrypted at rest; never returned after save; browser never calls WordPress.
- Publish: project page `/[locale]/dashboard/projects/<id>/wordpress` — select active connection, eligible derivative, approved metadata language, filename mode; confirm.
- Worker runs the publish saga (private R2 → media upload → metadata → remote verify → mapping). Partial success retries metadata without re-upload.
- Disconnect / SaaS delete does **not** delete remote WordPress media.
- Migrate: `npm run db:migrate` (includes `0023_wordpress.sql`).
- Env (optional): `INTEGRATION_ENCRYPTION_KEY`, `WORDPRESS_*` — see `.env.example`.
- Unit: `npx vitest run tests/wordpress.test.ts`
- Live DB (no real WP site): `npm run verify:wordpress`
- Browser: `npm run verify:wordpress:browser -- http://localhost:3000`
- Reconcile (dry-run): `npm run reconcile:wordpress`
- Docs: `/docs/wordpress`
- Live media publish against a real WordPress site is **Blocked** until a safe test site is available.
- Not included: posts/pages, featured image, WooCommerce, remote delete, plugin (Shopify/Webflow live: Prompts 27–28).

### Public API & webhooks (Prompt 25)

- Developer settings: `/[locale]/dashboard/settings/developer` (API keys + webhooks).
- Authenticate with `Authorization: Bearer si_live_…` or `si_test_…` (full key shown once at creation).
- Versioned routes under `/api/v1` — OpenAPI: `/api/v1/openapi`; docs: `/docs/api`, `/docs/webhooks`.
- Writes require `Idempotency-Key`. Rate limits are DB-backed per key (interim).
- Webhooks: HTTPS-only, signed HMAC (`X-Webhook-Signature: v1=…`), at-least-once delivery; consumers must dedupe by event ID.
- Migrate: `npm run db:migrate` (includes `0022_api_webhooks.sql`).
- Unit: `npx vitest run tests/api-webhooks.test.ts`
- Live: `npm run verify:api -- http://localhost:3000`
- Reconcile (dry-run): `npm run reconcile:api`
- Live external webhook delivery needs a safe public HTTPS receiver (otherwise Blocked).

### Organizations (Prompt 24)

- Personal workspace is virtual; create orgs under `/[locale]/dashboard/orgs/new`.
- Fixed roles: owner / admin / editor / viewer. Editors can approve metadata; viewers are read-only.
- Invitations use hashed tokens (7-day TTL). Without a mail provider, owner/admin get a **copy-link** after invite.
- Org billing uses the org **billing owner** user’s entitlements (Stripe customer stays per-user). Ownership transfer does not move billing.
- Migrate: `npm run db:migrate` (includes `0021_organizations.sql`).
- Unit: `npx vitest run tests/organizations.test.ts`
- Live: `npm run verify:organizations`
- Browser (production server): `npm run verify:organizations:browser -- http://localhost:3000`
- Reconcile (dry-run): `npm run reconcile:organizations`

## Database verification

1. Confirm `.env.local` has a non-empty development `DATABASE_URL` (never commit this file).
2. Run `npm run db:check` — must print `Database connection: ok`.
3. Run `npm run db:migrate` to apply auth, projects, and image-foundation migrations.
4. Register/login through the UI, then open `/en/dashboard/projects`.

Live credentials auth and project CRUD (including two-user ownership isolation) have been verified against Supabase:

```bash
npx tsx scripts/verify-auth-live.ts http://localhost:<port>
npx tsx scripts/verify-projects-live.ts http://localhost:<port>
```

### Image library (Prompt 8)

- Default: validated images, newest first, grid, 24 per page (12/24/48 allowed).
- Search by filename, status filters, sort, pagination — all server-side and owner-scoped.
- Private previews: short-lived signed GET for **validated images on the current page only**.
- No stored thumbnail files; large originals may load slowly.
- Grid/table toggle; selection foundation.
- Live DB checks: `npx tsx scripts/verify-library-live.ts http://localhost:<port>`

### Image delete / replace (Prompt 9)
- Delete hides the image immediately, then deletes the exact private R2 original (recoverable if cleanup fails).
- Replace uploads a **new** key; the old original stays active until the candidate is fully validated and promoted in the database.
- Old R2 object is deleted only after promotion commits. Temporary dual storage is expected.
- Recovery (dry-run): `npx tsx scripts/recover-image-lifecycle.ts --dry-run`
- Live verification: `npx tsx scripts/verify-delete-replace-live.ts http://localhost:<port>`
- Limitations: issued signed URLs may work until TTL/object deletion; no bulk delete/replace; no restore after storage deletion.

### Project quota (Prompt 10)
- Development defaults: **10,000 images** and **10 GiB** per project (not paid billing tiers).
- Authorize reserves image slots + declared bytes **before** pending image insert (migration `0009` relaxes reservation FKs).
- Confirm consumes reservation with trusted HeadObject size; browser-declared size is never final usage.
- Effective storage = active originals + reserved uploads + replacement candidates + cleanup-pending bytes.
- Soft-delete / hide does **not** release physical bytes until R2 absence is confirmed.
- Replacement temporarily uses old + new storage until old cleanup succeeds.
- Reconcile counters from source rows: `npx tsx scripts/reconcile-project-quota.ts [--dry-run] [--projectId=<uuid>]`
- Live verification: `npx tsx scripts/verify-quota-live.ts http://localhost:<port>`
- Browser UI check: `npx tsx scripts/verify-quota-browser.ts http://localhost:<port>` (requires running server)

### Ready for processing (Prompt 11 / Milestone 3 complete)
- Status `ready_for_processing` is distinct from `validated`.
- After successful validation the server auto-promotes when eligibility passes.
- Ready ≠ automatic processing; owner starts an explicit job.
- Summary API: `GET /api/projects/:projectId/ready` (owner only).
- Reconcile: `npx tsx scripts/reconcile-ready-for-processing.ts [--dry-run] [--projectId=<uuid>]`
- Live: `npx tsx scripts/verify-ready-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-ready-browser.ts http://localhost:<port>`

### Single-image processing (Prompt 12)
- Only `ready_for_processing` images may create a job.
- Synchronous model: `POST /api/projects/:projectId/processing/jobs` then `POST …/jobs/:jobId?action=execute`.
- Original R2 object is **never** overwritten; each attempt uses a new private `/derivatives/` key.
- First operation: same format + same dimensions, controlled-quality re-encode (not lossless).
- Metadata: EXIF/GPS stripped; ICC not retained; no auto-rotate.
- Formats for processing: JPEG/PNG/WebP/AVIF. Animated/GIF rejected.
- Retry: `?action=retry` (new key; attempt limit). Cancel: queued only.
- Preview: `POST …/jobs/:jobId/preview` (completed owned derivative; signed URL not shown as text).
- Generated-output quota is separate from original-upload quota (dev default 5 GiB).
- Reconcile: `npx tsx scripts/reconcile-processing-jobs.ts [--dry-run] [--projectId=<uuid>]`
- Live: `npx tsx scripts/verify-processing-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-processing-browser.ts http://localhost:<port>`
- Not included: queues/workers, bulk, resize, WebP/AVIF conversion, AI, ZIP, CSV, billing.

### Resize presets (Prompt 13)
- Fixed presets only: 256 / 512 / 1024 / 2048 px (longest edge).
- Create with `operation: "resize"` and `preset: "px_512"` (etc.); then execute.
- Never upscales; aspect ratio preserved; same format; always from the original.
- Unique private derivative per preset; owner signed preview when completed.
- Live: `npx tsx scripts/verify-resize-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-resize-browser.ts http://localhost:<port>`
- Not included: format conversion, queues, bulk, AI, ZIP, CSV, billing.

### Format conversion (Prompt 14)
- Create with `operation: "convert_format"` and `targetFormat: "webp"` (etc.); then execute.
- Allowed matrix only; PNG→JPEG rejected; dimensions unchanged; from original only.
- Unique private derivative per target; owner signed preview when completed.
- Live: `npx tsx scripts/verify-conversion-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-conversion-browser.ts http://localhost:<port>`
- Not included: queues, AI, ZIP, CSV, billing (bulk is Prompt 15).

### Bulk processing (Prompt 15)
- Create bulk job with selected image IDs (or select-all ready filtered), one operation, then `?action=run`.
- Reuses single-image processing; concurrency 3; max 100; real counters; partial completion.
- Cancel pending only; retry failed only; delete/replace safe for pending items.
- Reconcile: `npx tsx scripts/reconcile-bulk-jobs.ts [--dry-run] [--projectId=<uuid>]`
- Live: `npx tsx scripts/verify-bulk-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-bulk-browser.ts http://localhost:<port>`
- Not included: queues, workers, AI, ZIP, CSV, billing (queue is Prompt 16).

### Background queue & worker (Prompt 16)
- App server creates `queued` jobs; worker claims with lease + heartbeat and runs the existing engine.
- Start worker: `npm run worker:processing` (or `npx tsx scripts/processing-worker.ts`)
- Browser polls job status; HTTP execute is blocked (`QUEUE_WORKER_REQUIRED`).
- Live: `npx tsx scripts/verify-queue-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-queue-browser.ts http://localhost:<port>`
- Not included: ZIP, CSV, billing, Redis/BullMQ (AI is Prompt 17).

### AI metadata (Prompt 17)
- Single-image only. Worker runs `generate_metadata` jobs from the same queue.
- Requires `AI_PROVIDER=openai` + `OPENAI_API_KEY` (optional `AI_MODEL`, default `gpt-4o-mini`). Leave empty to disable AI safely.
- Never put AI keys in `NEXT_PUBLIC_*`. Partial AI config fails env validation.
- Privacy: a temporary bounded analysis copy is sent to the provider; the private original stays in R2 and is never public.
- Output language follows project metadata language (`en`/`ur`), not the UI locale. Urdu fields use RTL in the editor.
- Flow: Generate → draft → edit/save review → Approve (explicit). Reject / Regenerate / Retry supported.
- Filename suggestion is not applied (no rename). Approved snapshot is per image+language.
- Reconcile: `npx tsx scripts/reconcile-ai-metadata.ts [--dry-run] [--projectId=<uuid>]`
- Live: `npx tsx scripts/verify-metadata-live.ts http://localhost:<port>`
- Browser network smoke: `npx tsx scripts/verify-metadata-browser.ts http://localhost:<port>`
- Not included: bulk AI, ZIP, CSV, billing, publishing integrations.

### Metadata review (Prompt 18)
- Open: `/[locale]/dashboard/projects/<id>/metadata`
- Dashboard counts, search, filters, quality score, duplicate/missing flags.
- Bulk approve / reject / mark reviewed / regenerate (max 50).
- Compare approved vs draft; export foundation preview (no files):
  - `GET /api/projects/<id>/metadata/export-preview`
  - `GET /api/projects/<id>/metadata/review?mode=dashboard|list|compare`
  - `POST /api/projects/<id>/metadata/bulk`
- Live: `npx tsx scripts/verify-metadata-review-live.ts http://localhost:<port>`
- Not included: live CMS publishing, billing.

### Export packages (Prompt 19)
- Start export from metadata review UI or `POST /api/projects/<id>/exports`.
- Worker builds private ZIP (CSV/JSON/sidecars/HTML/README/CMS folders).
- Download: `POST .../exports/<exportId>?action=download-url` (owner signed URL) or GET `?action=download`.
- Live: `npx tsx scripts/verify-export-live.ts http://localhost:<port>`
- Requires `npm run worker:processing` and R2.
- Not included: billing, public CDN links (WordPress/Shopify live publish: Prompts 26–27).

### Analytics (Prompt 20)
- User overview: `/[locale]/dashboard/analytics`
- Project analytics: `/[locale]/dashboard/projects/<id>/analytics`
- APIs: `GET /api/analytics/overview?range=30d`, `GET /api/projects/<id>/analytics?range=30d`
- Ranges: `7d` | `30d` | `90d` | `all` (server-validated; UTC day buckets)
- Current-state totals from DB source tables; trends from real timestamps (no fabricated history)
- Activity via `analytics_events`; attention + limited queue/worker summary
- Live: `npx tsx scripts/verify-analytics-live.ts`
- Not included: billing, Stripe, super-admin, external analytics SDK, scheduled reports

### Billing (Prompt 21 + Consumer Redesign v2 Prompt 12)
- Public pricing: `/[locale]/pricing` (Guest / Free / Pro from server catalog — no invented $)
- Page: `/[locale]/dashboard/settings/billing` (+ `/success` confirming-payment UX)
- APIs: `GET /api/billing/summary`, `POST /api/billing/checkout`, `POST /api/billing/portal`, `POST /api/billing/webhook`
- Cleanup cron: `POST /api/internal/cron/cleanup` with `x-cron-secret` (`CRON_SECRET`)
- Env: see `.env.example` — Stripe secret + webhook together; Pro Price IDs unlock checkout
- Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- Browser smoke: `npx tsx scripts/verify-consumer-launch-browser.ts`
- Docs: `docs/consumer-redesign-v2-prompt-12-billing.md`, `docs/consumer-redesign-v2-prompt-12-deployment.md`
- **Checkout success redirect is not payment proof** — entitlements activate after webhook sync
- **Paid launch Blocked** until Price IDs are configured and test-mode verified
- Not included: invented prices, Business/Agency consumer SKUs, live checkout without Price IDs

### Super-admin operations (Prompt 22)
- Routes: `/[locale]/admin` (users, projects, jobs, queue, workers, storage, AI, exports, billing, audit, alerts)
- Provision: `npx tsx scripts/provision-super-admin.ts --email=you@example.com --apply` (dry-run without `--apply`)
- Demote: add `--demote` (blocked if last super-admin)
- API: `GET /api/admin/overview` (super-admin only; `Cache-Control: no-store`)
- Live DB: `npx tsx scripts/verify-admin-live.ts`
- Suspension preserves data; does not cancel Stripe
- Every admin write requires reason + immutable audit
- Sensitive fields never shown (password hashes, tokens, R2 keys, signed URLs, Stripe/AI secrets, lease tokens)
- Not included: impersonation, arbitrary SQL, R2 bucket browser, force job completion, manual subscription activation, revenue analytics, public marketing site

### Image upload + trusted validation (current)

- Image library + upload UI under each project.
- When R2 is configured: browser uploads via private presigned PUT; HeadObject confirms storage; Sharp validates via GetObject.
- Lifecycle: `pending_upload` → `uploaded` → `validating` → `validated` | `validation_failed`
- Full decode is required (`metadata()` alone is not enough). Version: `image-validation-v1`.
- Limits: 25 MB; 20k×20k; 100M pixels; 300 frames; 150M animated pixels.
- Formats: JPEG/PNG/WebP/GIF/AVIF. SVG/HEIC/TIFF disabled.
- Private previews only for `validated` images. Originals never mutated.
- When R2 is empty: app builds/runs; uploads return storage-not-configured.
- Partial R2 configuration is rejected.
- Sharp requires Node.js runtime (not Edge).
- CORS example: `docs/r2-cors.example.json`
- Fixtures: `npx tsx scripts/generate-image-fixtures.ts`
- Live R2 validation smoke:

```bash
npx tsx scripts/verify-image-validation-live.ts
```

- Domain verification (no R2 required):

```bash
npx tsx scripts/verify-images-domain.ts http://localhost:<port>
```

Expire stale pending rows:

```bash
npx tsx scripts/cleanup-expired-pending-uploads.ts
```

R2 vars (all empty OR all set): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, optional `R2_SIGNED_URL_TTL_SECONDS` (60–900, default 300).
Keep the bucket private. Never paste secrets into chat.

**Manual browser check (Not run by CI):** upload a JPEG → Uploaded → Validating → Validated; upload corrupt bytes named `.jpg` → storage may succeed → Validation failed (distinct from upload failed).
## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development (Turbopack) |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:check` | Connectivity check |

## Notes

- Google sign-in appears only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.
- Do not commit real secrets. Use `.env.local` locally (gitignored).
- See `PROJECT.md`, `ARCHITECTURE.md`, and `TASKS.md` for product and engineering source of truth.
