# SEO Images

Multilingual bulk website image optimization SaaS.

## Setup

```bash
cp .env.example .env.local
# Edit .env.local locally (do not paste secrets into chat):
# - DATABASE_URL=postgresql://...   # development DB; include sslmode=require for Neon/Supabase
# - AUTH_SECRET=...                 # openssl rand -base64 32
# - R2_* vars are optional for now (uploads stay disabled until the R2 task)
npm install
npm run db:check
npm run db:migrate
npm run build
npm run start
```

Open:
- http://localhost:3000/en/login
- http://localhost:3000/ur/login
- http://localhost:3000/en/dashboard (requires sign-in)

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
- Ready ≠ processing started. No queues/workers yet.
- Summary API: `GET /api/projects/:projectId/ready` (owner only).
- Reconcile: `npx tsx scripts/reconcile-ready-for-processing.ts [--dry-run] [--projectId=<uuid>]`
- Live: `npx tsx scripts/verify-ready-live.ts http://localhost:<port>`
- Browser: `npx tsx scripts/verify-ready-browser.ts http://localhost:<port>`

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
