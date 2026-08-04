# Consumer Redesign v2 — Prompt 6 inspection

## Baseline failing test (pre-coding)
| Test | Observation |
| --- | --- |
| `tests/ai-metadata.test.ts` › `never auto-approves or auto-renames` | Expects `bulkAi === false`; policy returns `true` |
| Relation to Geotag | **Unrelated** |
| Action | Do not change AI policy/tests |

Verified `npx vitest run tests/ai-metadata.test.ts` (2026-08-03).

## Shared reuse
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolResultPanel, ToolActionBar, ExpiryCountdown, banners, ToolHeader, guest API client, session/upload/download/cleanup, EN/UR layout.

## Metadata library
**piexifjs** (already installed + `@types/piexifjs`). No new packages.

## Format policy
JPEG only for verified GPS write. PNG/WebP/etc. rejected with Convert guidance. No silent conversion.

## GPS write approach
1. Read trusted JPEG from R2.
2. Load EXIF via piexifjs when present.
3. Strip non-GPS EXIF (**privacy-first**); keep `Orientation` only if present.
4. Remove old GPS IFD; write only confirmed GPS tags.
5. Insert EXIF into JPEG bytes (pixels unchanged when binary rewrite succeeds).
6. Full decode + GPS read-back + tolerance check.
7. Store new private output; original immutable.

## Round-trip
Tolerance: `abs(diff) <= 0.00001` degrees. Altitude when supplied within 0.5 m (or reject if ref unsupported).

## Browser geolocation
Explicit click only; no page-load prompt; no IP geolocation; no map/geocoder; no localStorage of coords; no analytics coords.

## DB storage
Job `options` / `resultSummary` may hold coordinates briefly for the guest session; scrubbed on cleanup / session expiry with assets. No analytics of coordinates.

## Files to create
- `docs/consumer-redesign-v2-prompt-6-inspection.md` (this)
- `docs/consumer-redesign-v2-prompt-6-completion.md`
- `src/lib/guest/geotag-policy.ts` (+ server re-export)
- `src/server/guest/gps-exif.ts`
- `src/server/guest/geotag-service.ts`
- `src/app/api/guest/geotag/inspect/route.ts`
- `src/components/guest/tools/geotag-tool.tsx`
- `tests/guest-geotag-policy.test.ts`
- `tests/guest-geotag-processing.test.ts`

## Files to modify
processing-policy/service, errors (+ i18n), tool-config, progress-card, guest-api-client, geotag page, homepage, analytics event names (no coords), ARCHITECTURE/ROADMAP/… docs.

## Packages
None new.

## Verification plan
Focused geotag tests → typecheck → lint → full suite (baseline AI only) → alt build. No live cutover.
