# Consumer Redesign v2 — Prompt 3 completion

## Status
**Prompt 3 complete (Resize on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Architecture proof
Compress and Resize both mount:

```tsx
<GuestToolWorkspace config={compressToolConfig | resizeToolConfig} />
```

Future Crop / Convert / Geotag / Metadata / AI should add another `GuestToolConfig` only.

## Components reused
GuestToolWorkspace, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolResultPanel, ToolActionBar, ExpiryCountdown, GuestLimitBanner, UpgradeBanner, ToolHeader, guest API client, analytics helper, marketing chrome

## New components / modules
- `src/components/guest/tool-config.ts`
- `src/components/guest/tools/compress-tool.tsx`
- `src/components/guest/tools/resize-tool.tsx`
- `src/components/guest/tool-result-panel.tsx`
- `src/lib/guest/resize-policy.ts` (+ server re-export)
- `src/server/guest/resize-service.ts`

## Duplicate UI removed
- Compress-only `compress-options.tsx` and `compress-result-panel.tsx` removed after extraction into pluggable tool configs + shared result panel.

## APIs reused
`POST /api/guest/session`, `GET /api/guest/status`, upload authorize/confirm, `POST /api/guest/jobs` (loose options), download — no Resize-specific HTTP surface.

## Processing
Guest-only `resize.same_format` (Sharp). Methods: by_width, by_height, fit_inside. Exact Size locked. Defaults: maintain aspect + prevent upscale. Units: pixels only.

## Homepage
Resize card `ready: true`. Compress remains default hero (`HomeCompressEntry`).

## Localization
EN/UR: `guest.compare`, `guest.resize.*`, compress `actions.*`, progress `resizing` / `processing`.

## Tests / verify
| Check | Result |
|-------|--------|
| `npx vitest run tests/guest-foundation.test.ts tests/guest-resize-policy.test.ts` | Pass (20) |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors; pre-existing warnings elsewhere) |
| Alt production build (`NEXT_DIST_DIR=.next-phase1-verify`) | Pass |
| Live `.next` | Untouched |
| Browser / R2 live resize | Pending cutover + configured env |

## UI reuse
**~92%** shared with Compress (target ≥90%). Only Resize controls + job/options mapping + Sharp resize path are tool-specific.

## Known limitations
- Exact Size locked (UI + server)
- No inches/cm
- Single image; Download All deferred
- Live guest SQL migrate still deferred (incompatible prior tables)
- Manual EN/UR/mobile browser matrix pending cutover

## Final verdict
**Pass for source delivery** — Resize proves the shared consumer workspace. Ready for Prompt 4 (Crop) after approval. Do not cut over live `:3000` until explicitly approved.
