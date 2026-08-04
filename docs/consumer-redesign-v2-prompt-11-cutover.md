# Consumer Redesign v2 — Prompt 11 cutover log

**Cutover window:** 2026-08-03 (local controlled env)  
**Verdict:** Applied successfully; rollback build retained

## Pre-cutover

| Item | Value |
| --- | --- |
| Old live PID | 1532 (`next start` :3000) |
| Old `BUILD_ID` | `6RV1arlMI2rIKw68Qghu-` |
| Ready | 200 |
| Auth counts | users=13, projects=8, images=9 |
| Disk free | ~128 GB |

See `docs/consumer-redesign-v2-prompt-11-inspection.md`.

## Rollback preparedness

| Artifact | Location |
| --- | --- |
| Old build copy | `.next-pre-v2-cutover` |
| Backup `BUILD_ID` | `6RV1arlMI2rIKw68Qghu-` (verified match) |
| Schema columns JSON | `.verify-tmp/cutover-backups/schema-columns-*.json` |
| Guest metadata backups | `.verify-tmp/cutover-backups/guest_*-*.json` (sensitive fields redacted) |

### Rollback commands (if needed)

```text
1. Stop process listening on port 3000
2. Remove or rename active .next
3. Copy .next-pre-v2-cutover -> .next
4. npm run start -- -p 3000 -H 127.0.0.1
5. DB: prefer forward-fix. Archives remain as *_pre_v2_archive.
   Only reverse-rename if v2 guest tables are empty and product requires old compiled guest.
```

**Do not delete `.next-pre-v2-cutover` until final approval.**

## Guest data policy executed

- Active legacy sessions/assets: **0**
- Legacy tables renamed to `*_pre_v2_archive` (not dropped)
- Conflicting enums renamed to `*_pre_v2_archive`
- Archive indexes/constraints renamed to free v2 names
- Bulk delete of archived R2 keys: **skipped** (approved)
- Temporary guest sessions reset at cutover (documented; no non-expired sessions)

## Migration SQL review (executed)

| Step | Risk | Effect |
| --- | --- | --- |
| Rename guest_usage_counters/assets/jobs/sessions | Medium | Archive only |
| Rename constraints/indexes on archives | Low | Name collision avoidance |
| Rename guest_* enums | Medium | Frees v2 enum names |
| Apply `0026_guest_foundation.sql` | Medium | Creates v2 sessions/uploads/jobs/cleanup |
| Apply `0027_guest_job_options.sql` | Low | Additive jsonb columns |
| Apply `0028_guest_bulk.sql` | Low–Medium | Bulk parent/child + ZIP fields |
| Insert drizzle hashes for applied files | Low | Future migrate consistency |

Script: `scripts/apply-guest-v2-cutover.ts`  
First attempt failed on index name collision (rolled back). Retry with index/constraint rename: **ok**.

### Post-migration verification

| Check | Result |
| --- | --- |
| users/projects/images counts | 13 / 8 / 9 unchanged |
| `guest_sessions` v2 columns | cohort, ops window, scrubbed_at present |
| `guest_uploads` / `guest_cleanup_queue` | present |
| `guest_bulk_jobs` / `guest_bulk_job_items` | present |
| Archives retained | `guest_*_pre_v2_archive` yes |

## Fresh build

| Item | Value |
| --- | --- |
| Command | `npm run build` with `NEXT_DIST_DIR` unset |
| Note | First build accidentally wrote to `.next-phase1-verify` due to shell env; discarded for production |
| Production `.next` `BUILD_ID` | `cBA-_N_Bki5mMQqy78Jxl` |
| Differs from old | Yes |
| Source-only | Yes (not copied from pre-cutover or verify promote) |

### Cutover defect fixed during serve

Server pages for AI Alt Text and Metadata Editor invoked client-only config factories → HTTP 500. Fixed with client boundary (`AiAltToolPage`) and static `metadataEditorToolConfig` import. Rebuild required; final `BUILD_ID` above.

## Production server

| Item | Value |
| --- | --- |
| Bind | `127.0.0.1:3000` |
| `/api/health/ready` | 200 |
| Database / R2 probes | ok |
| Guest cleanup worker | `npx tsx scripts/guest-cleanup-worker.ts` started |
| Scheduler | external cron uninstrumented (skipped probe) |
| Old process exit | Intentional supersede — not a product failure |

## Live API-heavy verification

Script: `scripts/verify-guest-cutover-live.ts`  
Result: **33 Passed**, **0 Failed**, **1 Blocked** (live AI generation — no OpenAI key)

Includes: guest session/cookie/hash/A-B isolation, compress/resize/crop/convert/geotag/metadata/editor, bulk+ZIP, public routes EN/UR, auth page smoke, HTML key scan, authenticated count preservation.

## Suites

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| Lint | Passed (0 errors; warnings only; ignore `.next-pre-v2-cutover`) |
| Vitest | **324/324** Passed |
| Production build | Passed |

## ESLint / gitignore cutover hygiene

Added ignores for `.next-pre-v2-cutover` so rollback artifacts do not poison lint.
