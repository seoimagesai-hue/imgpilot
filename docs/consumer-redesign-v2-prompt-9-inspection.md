# Consumer Redesign v2 — Prompt 9 inspection

## Baseline failing test (pre-coding)
| Test | Observation |
| --- | --- |
| `tests/ai-metadata.test.ts` › `never auto-approves or auto-renames` | Expects `bulkAi === false`; policy returns `true` |
| Relation to Metadata Editor | **Unrelated** |
| Action | Do not change authenticated AI policy/tests |

Verified `npx vitest run tests/ai-metadata.test.ts` (2026-08-03).

## Prompt 8 live AI status
Source + mocked tests Pass. Live OpenAI generation **Blocked**. Prompt 9 imports existing valid results / fixtures only — no new provider call.

## Shared components reused
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, preview, ToolActionBar (`hideDownload`), ExpiryCountdown, banners, ToolHeader, guest session/upload, cleanup, EN/UR, Blob export pattern from Metadata Viewer / AI Alt Text.

## Prompt 8 contract reuse
Import maps `GuestAiAltResultSummary.result` → editor metadata fields. Schema target: `image-seo-metadata-v2` (same field set + `decorative`).

## AI import ownership (user: auto-detect latest)
`GET` lookup: same `sessionId` + `uploadId` + `operation=ai.generate_alt_text` + `status=completed` + valid `image-seo-ai-v2` summary. Guest B / different upload / expired / scrubbed blocked. No OpenAI call. No ops increment.

## Draft storage / ops (user: save free)
Server-side draft via `guest_jobs` operation `metadata.edit` with **no** `incrementGuestOperations` and **no** image-op assert for save/validate. Session must be active; ownership checked. Client does not use localStorage/IndexedDB for draft persistence beyond in-memory form state synced to server.

## Validation
Deterministic severities: valid / recommendation / warning / blocking. No artificial SEO score %. Decorative mode allows empty alt.

## Filename policy
Reuse `sanitizeGuestAiFilename` + trusted extension from server mime. Never rename R2 key.

## Keyword policy
Trim, dedupe case-insensitive, max count/length, strip HTML.

## Export architecture
Client Blob: TXT, JSON, CSV (formula neutralization), HTML snippet. Server optional only if needed for renamed download.

## HTML escaping
Central `escapeHtml` for snippets; never execute user HTML.

## CSV formula injection
Prefix cells starting with `=`, `+`, `-`, `@` with `'` (Excel-safe neutralization).

## Embedded metadata
**Deferred.** Sidecar exports primary. Renamed download = original bytes + Content-Disposition only.

## Renamed download
Extend signed GET with `ResponseContentDisposition`; stream original `uploadId` object. No new R2 object. No pixel/metadata rewrite.

## Cleanup
Scrub `metadata.edit` options/resultSummary with geotag/metadata/AI on session expiry; exact-key delete original.

## Files to create
- inspection + completion docs
- `src/lib/guest/metadata-editor-policy.ts` (+ server re-export)
- `src/server/guest/metadata-editor-service.ts`
- `src/app/api/guest/metadata-editor/{draft,ai-import,renamed-download}/route.ts`
- `src/components/guest/tools/metadata-editor-tool.tsx`
- Tests

## Files to modify
processing-policy (register op), session scrub, R2 signed URL disposition, download helpers, tool-config/progress, homepage ready, guest EN/UR, analytics, project docs.

## Packages
None.

## Verification plan
Focused editor tests → typecheck → lint → full suite (AI baseline only) → alt build. No live cutover. Live AI remains Blocked.
