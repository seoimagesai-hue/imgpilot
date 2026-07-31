# Known Issues

## Current blockers
- None. Milestone 3 complete (Prompt 11 Ready-for-processing closed).

## Deferred / not tested
- Owner UI for `deletion_failed` cleanup retry (API + recovery CLI exist; library hides deleting images)
- Owner UI for old-object cleanup failure after promotion (API retry exists)
- Exact signed-preview TTL expiry timing after deletion
- Automatic scheduled recovery (CLI/service ready; no scheduler)
- Automatic scheduled quota / Ready reconciliation (CLIs ready; no scheduler)
- Bulk delete / bulk replace / bulk process
- Permanent restore after storage deletion
- Generated thumbnail derivatives
- Cursor pagination for very large libraries
- Multipart / resumable uploads
- Processing / AI / ZIP / CSV / billing
- Drag-drop / ZIP upload polish (listed on roadmap as deferred polish)

## Temporary product limitations
- Ready means eligible for future processing — processing has **not** started
- Processing/completed/failed counters are placeholders (always 0)
- Replacement temporarily stores old + new originals until old cleanup succeeds
- Cleanup-pending bytes count toward quota until R2 absence is confirmed
- Quota limits are development defaults (10k images / 10 GiB), not paid billing tiers
- Already-issued signed URLs are not instantly revoked unless the object is deleted
- Without R2 credentials, upload/validation/delete/replace show storage-unavailable
- Library default filter shows Ready images
- No AI metadata, ZIP/CSV export, or billing
- `validated` ≠ Ready; `ready_for_processing` ≠ processing started

## Environment notes
- R2 must be configured as a complete group or left fully empty (partial config rejected)
- Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Keep bucket private; never enable public `r2.dev` access for originals
- Apply CORS from `docs/r2-cors.example.json`
- TTL: `R2_SIGNED_URL_TTL_SECONDS` between 60 and 900 (default 300)
- Sharp requires Node.js runtime (not Edge); `serverExternalPackages: ["sharp"]`

## Resolved
- Image domain foundation without local/DB byte persistence
- Private R2 direct-upload code path + operator live upload
- Trusted validation with metadata + full decode (live R2 script)
- Library polish interactive browser verification
- Image delete + replace with private R2 cleanup (live R2 service verification)
- Project quota accounting + enforcement (migrations `0008`/`0009`, reservations, UI, live + browser)
- Ready-for-processing lifecycle + Milestone 3 closure (migration `0010`)

## Technical debt
- Auth.js is on `next-auth@5.0.0-beta.32`
- ESLint FlatCompat for Next 15.5
- Drizzle snapshots for hand-authored migrations may need reconciliation on next generate
