# SEO Images — Product

## Product vision
SEO Images is a **consumer-first**, multilingual image SEO platform. Public visitors use free guest tools (compress, resize, crop, convert, geotag, metadata, AI alt text, metadata editor) without login. Signed-in accounts unlock projects, long-term libraries, bulk processing, billing, API, and integrations.

The authenticated product remains a bulk-capable SaaS for website owners and agencies: create projects, upload many images, optimize safely, review AI-assisted metadata, and export — without destroying originals.

## Core product promise
Start free on the public tools — or upload website images in projects and make them smaller, faster, and SEO-ready at scale.

## Target users
- Website owners and local service businesses
- Developers and SEO professionals
- Agencies managing many client sites
- Ecommerce stores and bloggers
- Photographers and real-estate teams with large image libraries
- Casual visitors who need a single-image tool without creating an account

## Main user workflows

### Consumer (guest) workflow
1. Open the homepage and pick a tool (no login).
2. Upload a temporary image to private R2 (server-generated keys).
3. Process within free guest limits (size + rolling operations).
4. Download short-lived signed results.
5. Guest files expire one hour after session creation (downloads do not extend expiry).

**Consumer Redesign v2 + SEO Prompt 14 + Premium Homepage:** Guest tools + SEO landings + new premium homepage/header/footer shipped (`BUILD_ID` `42NLUMF48ocHKHqYg_zO0`). Stripe checkout remains Blocked until Price IDs. Target-KB / social programmatic SEO deferred (Prompt 15). Live OpenAI guest generation Blocked until keyed success.

### Authenticated consumer workflow
1. Sign in from a tool (callback returns to the same tool) or from homepage.
2. Higher account limits apply; temporary guest files are **not** claimed — re-select uploads.
3. Manage plan/usage/history under `/account/*` (public chrome).
4. Platform operators use `/{locale}/admin/*` (`super_admin` only). Legacy `/dashboard` index redirects to `/account`.

### Authenticated project workflow (legacy / power users)
1. Sign in and create a website project.
2. Upload many images (and later ZIPs) in bulk.
3. Configure compression, resize, WebP conversion, and filename rules.
4. Process images into separate optimized copies.
5. Generate AI alt text (and related metadata) in a chosen *output* language.
6. Review and edit metadata.
7. Download optimized images as ZIP and metadata as CSV.
8. Keep projects, settings, history, and usage for later sessions.

## Bulk-first rule (authenticated)
Signed-in project workflows still assume dozens to thousands of images. Consumer tools are single-image convenience; accounts unlock history and bulk.

## Original image safety rule
Original uploaded images must **never** be overwritten. All processing creates separate optimized copies under distinct storage keys/paths. Users must always be able to retrieve or discard originals independently of optimized outputs.

## Saved-project requirement
Signed-in users must be able to save projects, settings, processing history, metadata edits, and usage. Guest work is temporary session state only.

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
