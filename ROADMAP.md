# Roadmap

## Consumer Redesign v2
- [x] Prompt 1 — Shared guest foundation (session, R2, cleanup, consumer shell)
- [x] Prompt 2 — Compress Image + reusable GuestToolWorkspace UX
- [x] Prompt 3 — Resize Image
- [x] Prompt 4 — Crop Image
- [x] Prompt 5 — Convert Image
- [x] Prompt 6 — Geotag Image
- [x] Prompt 7 — Image Metadata Viewer
- [x] Prompt 8 — AI Alt Text Generator
- [x] Prompt 9 — Public Image SEO Metadata Editor
- [x] Prompt 10 — Bulk consumer tools and pricing gates
- [x] Prompt 11 — Controlled DB migration, cutover build, live E2E
- [x] Prompt 12 — Commercial pricing, Stripe subscriptions, production deployment and launch readiness (free-launch Ready; paid Blocked without Stripe Price IDs)
- [x] Prompt 13 Phase A — Public UI redesign, mega menu, SEO format/convert/crop landings (Stripe paused; target-KB/social deferred)
- [x] Prompt 14 — Consumer Frontend SEO content layer (unique content registry, FAQ/Breadcrumb JSON-LD; Stripe still deferred)
- [x] Premium homepage redesign — approved content, centered upload hero, expanded sections/footer (awaiting operator approval)
- [x] User account experience + separate admin panel (`/account/*`, `/admin/*`, auth callbacks)
- [ ] Prompt 15 — Programmatic SEO expansion from landing registry (more format/social long-tails; keep unique copy rules)
- [ ] Stripe — Final pricing decisions and Stripe test-mode setup (paid launch; was previously labeled “Prompt 14”)

## Milestone 0: Product foundation
- [x] Next.js / TypeScript application structure
- [x] Tailwind CSS foundation
- [x] Source-of-truth documentation system
- [x] English and Urdu translation architecture
- [x] RTL foundation (Urdu)
- [x] Basic protected-route-ready dashboard shell (auth pending)
- [x] Zod environment validation foundation
- [x] ESLint and Vitest testing foundation
- [x] Dependencies installed; typecheck, lint, tests, and production build verified in this environment
- [x] Database foundation (Drizzle schema + migration applied on Supabase)
- [x] Authentication (Auth.js credentials verified live; Google OAuth not tested)


## Milestone 1: Public website
- [x] Homepage
- [x] Features
- [x] Pricing
- [x] Tool landing-page structure
- [x] Legal pages (privacy, terms, retention)
- [x] Public documentation hub
- [x] FAQ / contact / security
- [x] Technical SEO (metadata, sitemap, robots, structured data)
- [x] English and Urdu public UI

## Milestone 2: User dashboard and projects
- [x] Database schema (users + projects; settings deferred)
- [x] Project CRUD (create, list, view, edit, soft archive/restore, ownership filters)
- [ ] Account settings
- [x] Separate metadata output language on projects (interface locale remains independent)

## Milestone 3: Bulk image upload
- [x] Image upload domain foundation (schema, policy, storage abstraction, library/upload placeholders; no real persistence yet)
- [x] Cloudflare R2 private bucket integration and direct upload (live operator upload verified on `seoimages-dev`)
- [x] Trusted server-side image validation and metadata inspection (Sharp metadata + full decode; live R2 JPEG/PNG/WebP script passed)
- [x] Project image library polish (thumbnails via private originals, filters, search, sort, pagination, grid/table, selection foundation)
- [x] Image delete / replace (recoverable saga + private R2 cleanup; live R2 verified)
- [x] Project upload limits / storage accounting / quota enforcement (dev defaults; not billing)
- [ ] Drag and drop polish
- [ ] Multipart upload
- [ ] ZIP upload
- [ ] Validation and progress polish
- [ ] R2 optimized key prefix (processing)
- [ ] Upload batches polish
- [ ] Billing credits (Stripe tiers deferred to Milestone 8)
- [x] Ready-for-processing lifecycle

**Milestone 3 status: Complete** (upload, validation, library, delete/replace, quota, ready-for-processing). Remaining unchecked items are polish deferred beyond core M3 closure.

## Milestone 4: Image processing
- [x] Single-image processing job foundation (synchronous; no queue workers yet)
- [x] Immutable source processing (originals never overwritten)
- [x] First same-format / same-dimension controlled optimization
- [x] Private derivative storage + trusted HeadObject verification
- [x] Processing retry + failed-output cleanup
- [x] Processing reconciliation CLI (dry-run / bounded)
- [x] Completed derivative owner-only signed preview
- [x] Resize presets and dimension-safe processing (no upscale; aspect preserved)
- [x] Format conversion (JPEG/PNG/WebP/AVIF matrix; immutable source)
- [x] Bulk processing (synchronous orchestration; bounded concurrency)
- [x] Processing queue and worker (DB-backed lease + heartbeat)
- [x] AI metadata (single-image; human review; OpenAI provider abstraction)
- [x] ZIP / CSV export

## Milestone 5: Filename workflow
- [ ] Cleanup rules
- [ ] Prefix / suffix / sequence
- [ ] Editable preview before apply

## Milestone 6: AI metadata
- [x] Provider abstraction
- [x] Alt text generation
- [x] Metadata output language
- [x] Review and regeneration
- [x] Usage tracking for AI calls
- [x] Metadata management / approval workflow (Prompt 18)
- [ ] Bulk AI metadata (deferred)

## Milestone 7: Review and export
- [x] Review table / metadata review dashboard
- [x] ZIP of optimized images / export packages (metadata + optional images)
- [ ] Selected downloads (library multi-download polish)
- [x] CSV metadata export (inside ZIP / package)
- [x] Export foundation (normalized package)
- [ ] Temporary file cleanup scheduler

## Milestone 8: Usage and billing
- [x] Subscription plan architecture (Prompt 21)
- [x] Stripe Checkout (server Price resolution; disabled until Price IDs set)
- [x] Stripe Customer Portal
- [x] Stripe webhook synchronization
- [x] Subscription lifecycle + entitlements
- [x] Plan-based quota / processing / AI / export enforcement
- [x] Billing UI (EN/UR)
- [x] Downgrade / payment-failure / cancellation policies
- [x] Billing reconciliation (dry-run CLI)
- [x] Super-admin operations panel (Prompt 22 — support inspection; no revenue analytics)
- [x] Public pricing page (Prompt 23 — catalog limits; Checkout only when Price IDs configured)
- [ ] Credits top-ups / metered overage (deferred)

## Milestone 9: Production readiness
- [ ] Security hardening and rate limiting
- [ ] Privacy controls and retention enforcement
- [x] User analytics dashboard (Prompt 20 — owner-scoped reporting)
- [x] Project analytics / processing insights / usage reporting
- [x] Super-admin operations panel (Prompt 22 — users/projects/jobs/queue/workers/storage/AI/exports/billing support/audit/alerts)
- [ ] Super-admin / global platform analytics (product analytics beyond ops panel)
- [ ] Billing / revenue analytics
- [ ] External analytics SDK / scheduled email reports
- [ ] Transactional email
- [ ] Performance and backup
- [ ] Deployment and multilingual QA

## Phase Two features
- [ ] Geotagging and EXIF workflows
- [ ] AI filenames, captions, descriptions
- [ ] AVIF, watermark, crop, duplicate detection
- [x] Teams / organizations / roles / invites / shared projects (Prompt 24 — no SSO/white-label/seat billing)
- [ ] Agency folders, white-label export, SSO

## Phase Three integrations
- [x] Public API keys, scopes, `/api/v1`, rate limits, idempotency (Prompt 25)
- [x] Outbound webhooks, signing, retries, delivery history (Prompt 25)
- [x] Direct WordPress site connections, Application Password auth, media publishing, approved metadata, publish history, duplicate prevention, partial recovery, bulk publish, reconciliation (Prompt 26 — self-hosted HTTPS; live site verify Blocked without safe test WP)
- [ ] WordPress posts/pages, featured image, WooCommerce, remote media delete, bidirectional sync (deferred)
- [x] Shopify store connections, Custom App Admin API token, product media attach, approved metadata, publish history, duplicate prevention, bulk publish, reconciliation (Prompt 27 — live development store verify Blocked without safe store)
- [ ] Shopify OAuth app install, product/variant CRUD, orders/inventory, remote asset deletion (deferred)
- [x] Webflow site token connections, collection field mapping, asset upload, CMS item image updates, duplicate prevention, bulk publish, reconciliation (Prompt 28 — live site verify Blocked without safe test token)
- [ ] Webflow OAuth, CMS item/collection creation, Designer automation, whole-site publish, remote asset deletion (deferred)
- [ ] Cloudinary
- [ ] Website crawler and replacement
- [ ] Scheduled audits and media sync
- [ ] OAuth apps / Zapier / marketplace
