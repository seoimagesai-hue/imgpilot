# Decisions

## 2026-07-31: Next.js App Router + TypeScript foundation
**Decision:** Use Next.js 15 App Router with strict TypeScript for the SaaS foundation.  
**Date:** 2026-07-31  
**Reason:** Matches the approved technology direction and supports RSC, locale segments, and middleware for i18n.  
**Alternatives considered:** Pages Router; Remix; separate Vite SPA + API.  
**Consequences:** Routes live under `src/app`; server/client component boundaries must be respected.

## 2026-07-31: next-intl with locale-prefixed routing
**Decision:** Use `next-intl` with always-on `/en` and `/ur` prefixes.  
**Date:** 2026-07-31  
**Reason:** Explicit URLs are predictable, shareable, and easier to QA for LTR/RTL.  
**Alternatives considered:** Cookie-only locale; `next-i18next`; custom dictionary loader.  
**Consequences:** Every user-facing route is locale-prefixed; middleware negotiates locale.

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
