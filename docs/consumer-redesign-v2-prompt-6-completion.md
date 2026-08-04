# Consumer Redesign v2 — Prompt 6 completion

## Status
**Prompt 6 complete in source (Geotag on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Baseline AI test
`tests/ai-metadata.test.ts` `bulkAi` expectation still fails (policy `true`, test expects `false`). **Unrelated to Geotag.** No new failing tests introduced.

## Route
`/[locale]/geotag-image` → `<GuestToolWorkspace config={geotagToolConfig} />`

## Shared UI reuse
**~91%** (shell, upload, progress, preview, results, download, banners, expiry). Geotag-specific: coordinate controls, GPS inspect/replace gate, browser geolocation button, JPEG-only guidance.

## New modules
- `src/lib/guest/geotag-policy.ts` (+ server re-export)
- `src/server/guest/gps-exif.ts` (piexifjs read/write; strip non-GPS EXIF; keep Orientation)
- `src/server/guest/geotag-service.ts`
- `src/app/api/guest/geotag/inspect/route.ts`
- `src/components/guest/tools/geotag-tool.tsx`
- Tests: `guest-geotag-policy`, `guest-geotag-processing`, `guest-geotag-browser`

## Policy highlights
| Topic | Decision |
| --- | --- |
| Format | JPEG only; no silent conversion; Convert link for other formats |
| Tags | Lat/Lon refs + DMS; optional altitude + AltitudeRef |
| Label | Display-only; sanitized; scrubbed on cleanup |
| Browser location | Explicit click only; no IP; no map/geocoder |
| Existing GPS | Inspect + confirmation required before replace |
| Non-GPS EXIF | Stripped (privacy-first); Orientation may remain |
| Round-trip | Decode + GPS read-back; `≤ 0.00001°`; altitude ±0.5 m |
| Cleanup | Shared exact-key cleanup; coordinate scrub on reprocess + session expiry |

## Verify
| Check | Result |
|-------|--------|
| Geotag focused tests | Pass (18) |
| typecheck | Pass |
| lint | Pass (0 errors) |
| Full suite | Fail — same single AI baseline (273/274) |
| New failures | **None** |
| Alt build `.next-phase1-verify` | Pass |
| Live R2 / browser | Not run |
| Live cutover | Not run |

## Next
**Consumer Redesign v2 Prompt 7 — Public Image Metadata Viewer using the same shared workspace**
