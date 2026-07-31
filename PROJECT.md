# SEO Images — Product

## Product vision
SEO Images is a multilingual, bulk-first SaaS that helps website owners and agencies prepare large sets of website images for performance and SEO. Users create projects, upload many images at once, optimize them safely, review AI-assisted metadata, and download optimized copies plus CSV metadata—without ever destroying originals.

## Core product promise
Upload website images and make them smaller, faster, and SEO-ready in minutes—at bulk scale, with projects you can return to.

## Target users
- Website owners and local service businesses
- Developers and SEO professionals
- Agencies managing many client sites
- Ecommerce stores and bloggers
- Photographers and real-estate teams with large image libraries

## Main user workflow
1. Sign in and create a website project.
2. Upload many images (and later ZIPs) in bulk.
3. Configure compression, resize, WebP conversion, and filename rules.
4. Process images into separate optimized copies.
5. Generate AI alt text (and related metadata) in a chosen *output* language.
6. Review and edit metadata.
7. Download optimized images as ZIP and metadata as CSV.
8. Keep projects, settings, history, and usage for later sessions.

## Bulk-first product rule
Every primary workflow must assume dozens to thousands of images. Single-image convenience is secondary. Lists, batch progress, filters, and bulk actions are the default UX.

## Original image safety rule
Original uploaded images must **never** be overwritten. All processing creates separate optimized copies under distinct storage keys/paths. Users must always be able to retrieve or discard originals independently of optimized outputs.

## Saved-project requirement
Signed-in users must be able to save projects, settings, processing history, metadata edits, and usage. Work is not throwaway session state.

## Multilingual requirement
The product interface must be translation-ready from day one. English and Urdu ship in the foundation. Additional languages must be addable via message files without rewriting components.

## Separate interface and metadata output languages
- **Interface language:** controls UI chrome (labels, navigation, errors). Persisted via locale routing / next-intl.
- **Metadata output language:** (future) controls the language of generated alt text and related SEO fields.
These must remain independent settings. Changing the UI language must not silently change metadata output language.

## RTL requirement
Locales such as Urdu must render with `dir="rtl"`. English uses `dir="ltr"`. Layouts prefer logical CSS (`start`/`end`, `ms`/`me`, `ps`/`pe`, `border-e`) so the dashboard remains usable in both directions.

## Privacy and file-retention direction
- Explain retention clearly in product and legal copy (later milestone).
- Prefer short-lived temporary processing artifacts.
- Automatically remove expired temporary files.
- Do not treat the product as a permanent personal cloud drive.
- Never expose storage credentials or private object URLs without signed, expiring access.

## MVP scope
- Accounts and authentication
- Website projects
- Bulk JPG/PNG/WebP upload
- Compression, resizing, WebP conversion
- Filename cleanup
- AI alt text with review/edit
- ZIP download of optimized images
- CSV metadata export
- Usage limits and subscriptions
- English UI + translation-ready architecture (Urdu foundation included)

## Features excluded from the first MVP
- WordPress / Shopify / WooCommerce plugins
- Website crawling and automatic live replacement
- Teams / white-labeling
- Public API
- AVIF as a primary path
- Advanced EXIF/geotag tooling as a core feature
- Background removal, enhancement, and upscaling

## Product boundaries
SEO Images is **not**:
- A complete SEO suite
- A CRM or project manager
- A website builder
- A social media manager
- A general cloud drive / DAM for enterprises
- A full photo editor

## Initial pricing direction
Credit-based Free, Starter, Pro, and Agency plans. Exact prices and credit costs require market validation before launch and must not be hardcoded as final in early milestones.

## Approved technology direction
- Next.js (App Router), React, TypeScript
- Tailwind CSS with shadcn/ui-compatible component structure
- PostgreSQL + Drizzle ORM
- Auth.js-ready authentication architecture
- next-intl for internationalization
- Zod for environment validation
- Cloudflare R2 private object storage (direct browser upload live-verified in dev)
- Sharp/libvips in workers (future) for image processing
- Durable job/queue system (future)
- Provider-abstracted vision AI (future)
- Stripe (future) for billing
- ESLint + Vitest testing foundation
