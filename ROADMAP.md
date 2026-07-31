# Roadmap

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
- [ ] Homepage
- [ ] Features
- [ ] Pricing
- [ ] Tool landing-page structure
- [ ] Legal pages (privacy, terms, retention)

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
- [ ] Processing queue and worker
- [ ] Compression
- [ ] Resize
- [ ] WebP conversion
- [ ] Retry and error reporting
- [ ] Originals never mutated

## Milestone 5: Filename workflow
- [ ] Cleanup rules
- [ ] Prefix / suffix / sequence
- [ ] Editable preview before apply

## Milestone 6: AI metadata
- [ ] Provider abstraction
- [ ] Alt text generation
- [ ] Metadata output language
- [ ] Review and regeneration
- [ ] Usage tracking for AI calls

## Milestone 7: Review and export
- [ ] Review table
- [ ] ZIP of optimized images
- [ ] Selected downloads
- [ ] CSV metadata export
- [ ] Temporary file cleanup

## Milestone 8: Usage and billing
- [ ] Credits and plan limits
- [ ] Stripe checkout and customer portal
- [ ] Webhooks
- [ ] Resets and top-ups

## Milestone 9: Production readiness
- [ ] Security hardening and rate limiting
- [ ] Privacy controls and retention enforcement
- [ ] Monitoring and analytics
- [ ] Transactional email
- [ ] Performance and backup
- [ ] Deployment and multilingual QA

## Phase Two features
- [ ] Geotagging and EXIF workflows
- [ ] AI filenames, captions, descriptions
- [ ] AVIF, watermark, crop, duplicate detection
- [ ] Teams, agency folders, white-label export

## Phase Three integrations
- [ ] WordPress, Shopify, WooCommerce
- [ ] Cloudinary and public API
- [ ] Website crawler and replacement
- [ ] Scheduled audits and media sync
