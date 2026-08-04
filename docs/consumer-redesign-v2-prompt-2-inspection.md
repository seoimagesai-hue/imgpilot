# Consumer Redesign v2 — Prompt 2 inspection

## Scope
Public Compress Image tool at `/[locale]/compress-image`, reference implementation for future consumer tools. Reuses Phase 1 guest architecture only.

## Homepage
- Large dropzone / paste opens Compress via in-memory file handoff + navigation to `/compress-image`.
- No login redirect; no project creation.

## Flow (single page)
Idle upload → Uploading → Validating → Ready (presets) → Compressing → Preparing download → Before/after + results → Download / Compress another.

## Reuse map
| Area | Source |
|------|--------|
| Session / cookie / HMAC | `src/server/guest/*` Phase 1 |
| Upload authorize/confirm | `/api/guest/upload/*` |
| Jobs / download | `/api/guest/jobs`, `/api/guest/download` |
| R2 keys / cleanup | `keys.ts`, `cleanup-service`, `worker:guest-cleanup` |
| Layout | `(marketing)` + `consumer-chrome` |
| Shared UI | UploadDropzone, ProgressCard, banners, ExpiryCountdown, workspace shell |

## Tool-specific
- `compress.same_format` Sharp path (`compress-service.ts`)
- Presets: Smaller file / Balanced / Best quality (+ strength slider without exposing Sharp numbers)
- CompressResultPanel / BeforeAfter metadata

## Privacy analytics
`src/lib/guest/analytics.ts` — tool code, mime family, size bucket, duration, ok/error only. No filenames or image bytes.

## Known gaps vs live cutover
- Guest DB migrations still deferred on live DB with prior guest schemas.
- Live `:3000` `.next` not replaced in this prompt.
- Multi-file Download All not implemented (intentionally deferred).
- Full browser matrix / production server smoke against live R2 requires configured env + cutover.
