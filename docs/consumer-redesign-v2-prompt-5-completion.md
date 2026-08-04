# Consumer Redesign v2 — Prompt 5 completion

## Status
**Prompt 5 complete (Convert on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Baseline AI test
`tests/ai-metadata.test.ts` `bulkAi` expectation still fails (policy `true`, test expects `false`). **Unrelated to Convert.** No new failing tests introduced.

## Route
`/[locale]/convert-image` → `<GuestToolWorkspace config={convertToolConfig} />`

## Shared UI reuse
**~92%** (shell, upload, progress, preview, results, download, banners, expiry). Only Convert controls + matrix/service differ.

## New modules
- `src/lib/guest/convert-policy.ts` (+ server re-export)
- `src/server/guest/convert-service.ts`
- `src/server/guest/avif-capability.ts`
- `src/components/guest/tools/convert-tool.tsx`

## Conversion matrix (guest)
JPEG→PNG/WebP/(AVIF) · PNG→JPEG/WebP/(AVIF) · WebP→JPEG/PNG/(AVIF). Same-format rejected (Compress).

## AVIF
Runtime probe; UI hides when unsupported.

## Transparency
Trusted alpha; preserve for PNG/WebP/AVIF; JPEG requires white/black flatten.

## Orientation / metadata
Convert-only `rotate()` then encode; EXIF stripped; Compress/Resize orientation unchanged.

## Reprocessing
Identical options → reuse job; else prior convert outputs enqueued for cleanup.

## Verify
| Check | Result |
|-------|--------|
| Convert policy + processing tests | Pass (15) |
| Focused guest suites | Pass |
| typecheck | Pass |
| lint | Pass (0 errors) |
| Full suite | Fail — same single AI baseline (255/256) |
| New failures | **None** |
| Alt build `.next-phase1-verify` | Pass |
| Live R2 / browser | Not run |

## Next
**Prompt 6 — Public Geotag Image Tool** after approval.
