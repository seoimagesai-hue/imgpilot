# Architecture

Status legend: **Implemented** | **Planned (not implemented)**

## Frontend — Implemented
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
- Image authorization always goes through the parent project owner (`images ⋈ projects` with `projects.user_id = session.user.id`).
- Missing and unauthorized share not-found behaviour.
- Soft-deleted images (`deleted_at` set / `status=deleted`) are excluded by default.
- Project soft-archive does not cascade to image rows.

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
- Ready ≠ processing started; Milestone 4 owns queues/workers

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
