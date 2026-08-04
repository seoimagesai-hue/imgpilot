# Consumer Redesign v2 — Prompt 4 completion

## Status
**Prompt 4 complete (Crop on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Route
`/[locale]/crop-image` → `<GuestToolWorkspace config={cropToolConfig} />`

## Components reused
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolResultPanel, ToolActionBar, ExpiryCountdown, GuestLimitBanner, UpgradeBanner, ToolHeader, guest API client, session/upload/download/cleanup

## New Crop-specific
- `src/lib/guest/crop-policy.ts` (+ server re-export)
- `src/server/guest/crop-service.ts`
- `src/components/guest/tools/crop-editor.tsx`
- `src/components/guest/tools/crop-tool.tsx`

## UI reuse
**~91%** shared with Compress/Resize shell (target ≥90%). Only crop editor + options + Sharp crop path are new.

## Library decision
No new dependency — lightweight custom crop editor.

## Coordinate model
Advisory normalized `{x,y,width,height}` in `[0,1]`. Server validates, converts with oriented dims after `rotate()`, min edge **16×16**, verifies output decode dimensions.

## Reprocessing
Identical options → return completed job (no new charge). New crop → enqueue prior crop output keys for cleanup; rate limit still increments.

## Homepage
Crop card `ready: true`. Compress remains hero.

## Tests / verify
| Check | Result |
|-------|--------|
| Crop policy + architecture tests | Pass |
| Crop Sharp processing (JPEG/PNG/WebP/EXIF orient) | Pass |
| Guest foundation + resize + crop focused suite | Pass |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors) |
| Alt production build (`NEXT_DIST_DIR=.next-phase1-verify`) | Pass |
| Full `npm test` | **Fail** (pre-existing `ai-metadata.test.ts` bulkAi expectation; empty convert placeholder removed) |
| Live R2 / browser | Not run (cutover pending) |
| Live `.next` | Untouched |

## Known limitations
- Zoom is UI focus aid; geometry is the normalized crop only
- Full keyboard drag-handles rely on explicit nudge/grow/shrink buttons
- Live guest SQL migrate still deferred
- Manual EN/UR/mobile browser matrix pending cutover

## Final verdict
**Pass for source delivery.** Next: **Prompt 5 — Public Convert Image Tool** after approval. Do not cut over live `:3000` until explicitly approved.
