# Consumer Redesign v2 — Prompt 10 inspection

## Cutover status
Live `:3000` / `.next` **untouched**. Verify builds use `NEXT_DIST_DIR=.next-phase1-verify`.

## Prior `bulkAi` mismatch — evidence

| Source | Value |
| --- | --- |
| `src/server/images/ai-metadata-policy.ts` | `bulkAi: true` with Prompt 31 comment |
| Authenticated stack | `ai_metadata_batches`, batch service, dashboard `/ai-batches`, APIs |
| Plan catalog | Separate flags: `bulkProcessingEnabled`, `aiMetadataEnabled`, `monthlyAiLimit` — **not** `bulkAi` |
| `tests/ai-metadata.test.ts` | Expects `bulkAi === false` (Prompt 17 era) |
| `scripts/verify-metadata-live.ts` | Asserts `"No bulk AI"` → stale |
| Guest public tools | No guest bulk AI; single-image AI only |

### Final decision (before coding)
**`bulkAi: true` is intentional** for authenticated Prompt 31 bounded AI metadata batches with human review.

- Update test + live verify script to expect `true`.
- Do **not** change policy to `false`.
- Public guest bulk AI remains **unavailable** unless separately entitled (not guest-approved). Public UI: Account required / unavailable for guest Bulk AI.
- Align KNOWN_ISSUES / DECISIONS / ARCHITECTURE Prompt 17 stale “no bulk AI” notes.

## Guest limits (current single-image)
| Limit | Value |
| --- | --- |
| Per-file | 10 MiB (`GUEST_MAX_FILE_BYTES`) |
| Ops / 24h | 5 |
| Active jobs | 1 |
| TTL | 1 hour immutable |

## Proposed guest bulk defaults (central policy)
| Limit | Value |
| --- | --- |
| Max selected / accepted files | 5 |
| Total upload bytes | 25 MiB |
| Per-file | existing guest max |
| Active bulk jobs | 1 |
| ZIP max | 50 MiB |
| Retention | session 1h |
| Upload concurrency (browser) | 3 |
| Process concurrency | 3 (`mapWithConcurrency`) |
| Op accounting | **1 guest op per processed file** (user decision) |

## Authenticated limits
| Source | Notes |
| --- | --- |
| `plan-catalog.ts` | free→agency; `bulkProcessingEnabled: true` even on free |
| Dashboard bulk | `bulk_jobs` / `bulk_job_items` + `processing_jobs` queue (Prompt 15–16) |
| Public bulk when signed in | Elevated public-bulk caps from plan helper (dev defaults); no invented paid prices |
| Stripe checkout | **Blocked / unwired** (empty billing routes; no fake checkout) |

## ZIP
- `jszip` in `package.json`; **unused** in runtime (export-service stubbed).
- Prompt 10: generate ZIP server-side with JSZip for completed guest outputs; optional private R2 archive key; cleanup via exact-key queue.

## Existing internal bulk
- Authenticated `bulk-service.ts` orchestration over single-image engines — reuse patterns (`mapWithConcurrency`), not guest tables.
- Guest execution today: **inline** in API (`createGuestJob`). No guest worker.

## Execution model (user + inspection)
- **Guest:** bounded in-request processing (≤5 files, concurrency 3) calling existing guest compress/resize/convert services; parent-child in new `guest_bulk_*` tables. Document timeout risk. Do not label async.
- **Auth dashboard bulk:** unchanged; link from upgrade for larger batches/history.
- Worker reuse applies to authenticated domain; guest sync is the practical path.

## Bulk-safe operations
| Tool | Bulk? |
| --- | --- |
| Compress | Yes |
| Resize | Yes (Exact Size remains locked) |
| Convert | Yes (matrix per file) |
| AI Alt Text | Guest: gated unavailable; Auth AI batches already exist separately |
| Metadata export | Deferred / account |
| Crop | Single only |
| Geotag | Single only |
| Metadata Viewer/Editor | Single only |

## Account gates / upgrade
- Reuse `UpgradeBanner` / `GuestLimitBanner`; add `BulkLimitGate`.
- Over limit: explain counts, process-allowed subset, sign-in/register, view pricing (honest checkout status).
- Login callback: preserve locale + tool + safe options; **reselect files**; no File persistence.

## Migration
Additive `drizzle/0028_guest_bulk.sql` (journal after 0027):
- `guest_bulk_jobs`, `guest_bulk_job_items`
- Indexes on session/status/expires
- Archive key fields on parent
- **Do not apply to live DB** without cutover approval

## Packages
Use existing `jszip`. No new packages preferred.

## Files to create (planned)
- Inspection + completion docs
- `src/lib/guest/bulk-policy.ts` (+ server re-export)
- `src/server/guest/bulk-service.ts`, `bulk-zip.ts`
- APIs under `src/app/api/guest/bulk/`
- `BulkToolWorkspace` + configs + page `bulk-image-tools`
- Tests; EN/UR strings

## Files to modify
- `ai-metadata.test.ts`, `verify-metadata-live.ts`
- guest-policy tool codes, cleanup scrub, homepage/nav
- plan helper / entitlements for public-bulk caps if needed
- PROJECT/ROADMAP/ARCHITECTURE/DECISIONS/CHANGELOG/TASKS/KNOWN_ISSUES/README

## Verification plan
Focused bulk/ZIP/gate/entitlement/cleanup tests → typecheck → lint → **full suite 100%** → alt build. Live R2/browser/cutover Not run. Prompt 8 live AI remains Blocked.

## Pricing truthfulness
Pricing UI must not invent prices or claim unlimited. If `/pricing` hollow, gate copy says account unlocks higher limits / dashboard bulk; checkout availability from `isPaidCheckoutAvailable()` when present.
