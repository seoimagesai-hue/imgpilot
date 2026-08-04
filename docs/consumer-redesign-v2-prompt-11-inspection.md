# Consumer Redesign v2 — Prompt 11 inspection

**Date:** 2026-08-03  
**Status:** Complete — migrations not applied at inspection time  
**Consent:** Archive/rename incompatible old guest tables+enums; skip bulk old-guest R2 cleanup; restore minimal `/api/health/*`; full cutover approved.

---

## 1. Live server process

| Field | Value |
| --- | --- |
| Port | `3000` (Listen) |
| PID | `1532` |
| Command | `node … next start` (production) |
| `/api/health/ready` | **200** (`status=ok`; probes: live, database, cache) |

Superseding this process during cutover is **intentional**, not a product failure.

## 2. Live `BUILD_ID`

`6RV1arlMI2rIKw68Qghu-`

## 3. Ready status

`GET /api/health/ready` → **200**. Full `/api/health` also **200** with DB/R2/queue/worker probes.

## 4. `.next` timestamp / size

| Path | Notes |
| --- | --- |
| `.next` | Active live build; ~1.48 GB; `BUILD_ID` as above |
| `.next-phase1-verify` | Alternate verify build `r8pQ6tnyAKNr7jD_YWLXm` — **must not** become production |
| Disk free | ~128 GB — backup feasible |

## 5. New source status

Prompts 1–10 present in source: guest foundation, all public tools, bulk, ZIP, gates, tests historically **324/324**. Marketing pages present for compress/resize/crop/convert/geotag/metadata/ai-alt-text/image-metadata-editor/bulk-image-tools. Legacy redirect page `image-alt-text` present.

**Gap found at inspection:** source lacked `/api/health/*` handlers that the live build serves. **Restoration of minimal health routes** approved for cutover (not a product feature).

## 6. Git working tree

Dirty working tree with extensive Consumer Redesign v2 + authenticated product files. Do not commit secrets/env. Cutover does not require a commit.

## 7. Production env (names only)

| Variable | Present |
| --- | --- |
| `DATABASE_URL` | yes |
| `AUTH_SECRET` | yes |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_ENDPOINT` | yes |
| `OPENAI_API_KEY` | **missing** (length 0) → live AI generation stays **Blocked** |
| `GUEST_*` limit overrides | missing (code defaults apply) |

## 8. Database connection

Connected via existing scripts. Authenticated counts observed: **users=13**, **projects=8**. Preserve.

## 9. Applied migration history

`drizzle.__drizzle_migrations` has **32** rows. Source journal ends at **`0028_guest_bulk`** (idx 28).

Rows with `created_at` matching journal `when` for 0026–0028 exist, but live guest schema is **not** v2 — journal tags were rewritten earlier while hashes refer to previously applied SQL. **Do not run naive `drizzle-kit migrate` until after archive rename.**

## 10–11. Guest / authenticated tables

**Authenticated (present — preserve):** `users`, `accounts`, `sessions`, `projects`, `images`, `bulk_jobs`, `bulk_job_items`, `processing_jobs`, billing/org/integration tables as already migrated.

**Live guest (legacy incompatible):**

| Table | Present | Notes |
| --- | --- | --- |
| `guest_sessions` | yes | Old columns (`status`, cleanup fields, ops_*); no `cohort` |
| `guest_jobs` | yes | Uses `guest_session_id`, asset FKs — not `session_id`/`upload_id` |
| `guest_assets` | yes | Legacy |
| `guest_usage_counters` | yes | Legacy |
| `guest_uploads` | **no** | Required by v2 |
| `guest_cleanup_queue` | **no** | Required by v2 |
| `guest_bulk_jobs` / `guest_bulk_job_items` | **no** | Prompt 10 |

**Counts (legacy):** sessions 65 / active **0**; assets 66 / active **0**; jobs 34; usage counters 15.

## 12. Schema conflicts

| Conflict | Detail |
| --- | --- |
| Table names | `guest_sessions`, `guest_jobs` collide with v2 `CREATE TABLE` |
| Columns | Completely different shapes |
| Enums | `guest_job_status` exists (compatible labels); `guest_cleanup_status` includes legacy `not_required` (v2 does not); also `guest_session_status`, `guest_asset_role` |
| Missing | `guest_cohort`, `guest_upload_status`, bulk enums/tables, cleanup queue |

Raw apply of `0026`/`0028` would **fail**.

## 13. Pending migrations (effective)

| File | Live applied as v2? |
| --- | --- |
| `0026_guest_foundation.sql` | **No** (conflicts) |
| `0027_guest_job_options.sql` | **No** (depends on v2 `guest_jobs`) |
| `0028_guest_bulk.sql` | **No** |

## 14–17. R2 / cleanup / workers

| Item | Status |
| --- | --- |
| R2 config | Present (env names above) |
| R2 CORS | Documented in `docs/r2-cors.example.json`; not re-fetched (secrets) |
| Cleanup worker | `npm run worker:guest-cleanup` |
| Processing worker | `npm run worker:processing` (package script) |
| Cleanup scheduler | External cron / uninstrumented (`/api/health/scheduler` → skipped) |

## 18. OpenAI

Unconfigured → Prompt 8 live generation **Blocked** after cutover (honest).

## 19. Live public route inventory (spot)

| Route | Pre-cutover |
| --- | --- |
| `/en` + tool pages (compress…ai-alt-text, metadata editor) | 200 |
| `/en/bulk-image-tools` | **404** (not in old build) |
| `/en/image-alt-text` | 307 → ai-alt-text |
| `/en/login` | 200 |
| `/en/dashboard` | 307 (auth redirect) |

## 20. Source route inventory

Expected consumer tools present under `src/app/[locale]/(marketing)/`. Guest APIs under `src/app/api/guest/**`. Health routes restored under `src/app/api/health/**` for cutover.

---

## Guest data policy (cutover)

- Temporary by design; **0** non-expired sessions/assets at inspection.
- **Archive/rename** legacy guest tables+enums; no authenticated deletes.
- **Skip** bulk R2 delete of archived guest asset keys (user choice); new v2 cleanup covers post-cutover objects.
- Active guest sessions reset at cutover (already zero active). Document in cutover notes.

## Migration path (approved)

1. Schema + guest table data backup (no secrets; no image bytes).
2. Preserve `.next` → `.next-pre-v2-cutover`.
3. Rename legacy `guest_*` tables → `*_pre_v2_archive`.
4. Rename conflicting enums → `*_pre_v2_archive`.
5. Apply `0026` → `0027` → `0028` SQL.
6. Record drizzle hashes for applied SQL files (so future migrate is consistent).
7. Verify authenticated counts + v2 guest/bulk tables.
8. Fresh `npm run build` into `.next` (not copy verify dir).
9. Start `next start` on :3000; start cleanup worker as needed.
10. Live E2E; keep rollback build until approval.

## Destructive statements (planned)

```sql
-- Table renames (data retained under archive names; not dropped)
ALTER TABLE guest_usage_counters RENAME TO guest_usage_counters_pre_v2_archive;
ALTER TABLE guest_assets RENAME TO guest_assets_pre_v2_archive;
ALTER TABLE guest_jobs RENAME TO guest_jobs_pre_v2_archive;
ALTER TABLE guest_sessions RENAME TO guest_sessions_pre_v2_archive;

-- Enum renames (retained for archive tables)
ALTER TYPE guest_cleanup_status RENAME TO guest_cleanup_status_pre_v2_archive;
ALTER TYPE guest_job_status RENAME TO guest_job_status_pre_v2_archive;
ALTER TYPE guest_session_status RENAME TO guest_session_status_pre_v2_archive;
ALTER TYPE guest_asset_role RENAME TO guest_asset_role_pre_v2_archive;
```

No `DROP TABLE` on users/projects/images/billing. No broad R2 purge.

## Rollback (high level)

1. Stop new `next start`.
2. Restore `.next` from `.next-pre-v2-cutover`.
3. Restart previous production command on :3000.
4. DB: optional rename archives back only if new v2 tables empty/unused — documented in cutover.md after apply. Prefer forward-fix with archives retained.

## SQL safety review summary

| Migration | Risk | Rollback |
| --- | --- | --- |
| Archive rename | Medium (name collision) | Rename back if v2 not yet created |
| `0026` | Medium (new enums/tables) | Drop v2 guest tables/enums only if empty; restore archive names |
| `0027` | Low (additive columns) | Drop columns |
| `0028` | Low–Medium (bulk tables) | Drop bulk tables/enums |

**Inspection gate:** PASSED for proceeding to backup + controlled apply.
