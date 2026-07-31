# Changelog

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
