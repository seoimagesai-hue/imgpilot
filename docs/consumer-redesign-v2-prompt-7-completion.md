# Consumer Redesign v2 — Prompt 7 completion

## Status
**Prompt 7 complete in source (Metadata Viewer on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Baseline AI test
`tests/ai-metadata.test.ts` `bulkAi` expectation still fails (policy `true`, test expects `false`). **Unrelated.** No new failing tests.

## Route
`/[locale]/image-metadata` → `<GuestToolWorkspace config={metadataToolConfig} />`

## Shared UI reuse
**~92%** (shell, upload, progress, preview, expiry, banners). Viewer-specific: sectioned result panel, copy/export Blob actions, `hideImageDownload`.

## New modules
- `src/lib/guest/metadata-policy.ts` (+ server re-export)
- `src/server/guest/metadata-extract.ts` (Sharp + piexifjs allow-list + GPS reuse)
- `src/server/guest/metadata-service.ts` (viewer-only; no `outputStorageKey`)
- `src/components/guest/tools/metadata-tool.tsx`
- Tests: `guest-metadata-policy`, `guest-metadata-extract`

## Policy highlights
| Topic | Decision |
| --- | --- |
| Formats | JPEG / PNG / WebP only |
| Viewer-only | No derivative image; hide image download |
| EXIF | Allow-listed camera fields via piexifjs (JPEG); Artist/Copyright excluded |
| GPS | Safe reader; sensitive label; scrubbed on cleanup |
| Exports | Client Blob TXT/JSON from result summary |
| Packages | None new |

## Verify
| Check | Result |
|-------|--------|
| Metadata focused tests | Pass (10) |
| typecheck | Pass |
| lint | Pass (0 errors) |
| Full suite | Fail — same single AI baseline (283/284) |
| New failures | **None** |
| Alt build `.next-phase1-verify` | Pass |
| Live R2 / browser / cutover | Not run |

## Next
**Consumer Redesign v2 Prompt 8 — Public AI Alt Text Generator using the same shared workspace**
