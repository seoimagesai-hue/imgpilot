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
- [x] Database foundation (Drizzle schema + migration generated; apply blocked without DATABASE_URL)
- [x] Authentication (Auth.js credentials + conditional Google; live DB flows blocked without DATABASE_URL)

## Milestone 1: Public website
- [ ] Homepage
- [ ] Features
- [ ] Pricing
- [ ] Tool landing-page structure
- [ ] Legal pages (privacy, terms, retention)

## Milestone 2: User dashboard and projects
- [ ] Database schema (users, projects, settings)
- [ ] Project CRUD
- [ ] Account settings
- [ ] Separate metadata output language setting

## Milestone 3: Bulk image upload
- [ ] Drag and drop
- [ ] Multiple files
- [ ] ZIP upload
- [ ] Validation and progress
- [ ] R2 storage with original vs optimized key prefixes
- [ ] Upload batches

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
