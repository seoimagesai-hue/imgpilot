# Consumer Redesign v2 — Prompt 8 inspection

## Baseline failing test (pre-coding)
| Test | Observation |
| --- | --- |
| `tests/ai-metadata.test.ts` › `never auto-approves or auto-renames` | Expects `bulkAi === false`; policy returns `true` |
| Relation to public AI Alt Text | **Unrelated** (authenticated bulk-AI policy) |
| Action | Do not change authenticated AI policy/tests |

Verified `npx vitest run tests/ai-metadata.test.ts` (2026-08-03).

## Shared services reused
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolActionBar (`hideDownload`), ExpiryCountdown, banners, ToolHeader, guest API client, session/upload/cleanup, Metadata Viewer CustomResultPanel + Blob export patterns, EN/UR layout.

## Existing AI provider architecture
| Piece | Truth in repo |
| --- | --- |
| Provider | OpenAI via `openai` SDK |
| API used | **Chat Completions** (`chat.completions.create` + `response_format: json_object`) |
| Responses API | **Not present** |
| Chat Completions fallback | **N/A** (single path only) |
| Image input | `prepareAnalysisImage` → JPEG ≤1280 edge, quality 82, data URL |
| Status | `getAiConfigStatus()` / `isAiConfigured()` |
| Env | `AI_PROVIDER`, `OPENAI_API_KEY`, `AI_MODEL`, `AI_REQUEST_TIMEOUT_SECONDS` (parsed; timeout constant `AI_REQUEST_TIMEOUT_MS=60000` used) |

## Provider configuration variables
`AI_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY` (unimplemented), `AI_MODEL`, `AI_REQUEST_TIMEOUT_SECONDS`, `AI_METADATA_PROMPT_VERSION`.

## Structured result schema (guest)
`image-seo-ai-v2`: altText, title, caption, shortDescription, longDescription, filename, keywords[].  
Dashboard schema differs (`description` + `filenameSuggestion` + `language`); guest will use a dedicated Zod schema + prompt while reusing sanitize/filename helpers and OpenAI call pattern.

## Provider request architecture (user decision)
**Reuse core:** `prepareAnalysisImage` + OpenAI Chat Completions + timeout/error mapping from `ai-provider.ts`, adapted via guest adapter (no browser calls).

## Image-input policy
Private R2 bytes → bounded JPEG analysis image → data URL in Completions only. No permanent URL. No EXIF/GPS/filename in prompt.

## Timeout / retry / fallback
Timeout: `AI_REQUEST_TIMEOUT_MS` (60s). Guest: **no unbounded retries**; at most 0 automatic regenerations on invalid JSON (fail safely). Fallback: none (Chat Completions only — document honestly).

## Output validation / sanitization
Guest Zod schema + strip HTML/markdown fences/control chars + length clamps + Latin filename slug + keyword dedupe + serialized size limit.

## Rate limits / cost (user decision)
**Shared guest ops** (same rolling 24h counter + 1 active job). AI counts as one operation. No separate AI quota in Prompt 8.

## Cleanup
Scrub `ai.generate_alt_text` job options/resultSummary on reprocess + session expiry (extend geotag/metadata scrub list). Exact-key R2 delete for source via shared cleanup.

## Files to create
- `docs/consumer-redesign-v2-prompt-8-inspection.md` (this)
- `docs/consumer-redesign-v2-prompt-8-completion.md`
- `src/lib/guest/ai-alt-policy.ts` (+ server re-export)
- `src/server/guest/ai-alt-prompt.ts`
- `src/server/guest/ai-alt-provider.ts` (adapter wrapping OpenAI + guest schema)
- `src/server/guest/ai-alt-service.ts`
- `src/app/api/guest/alt-text/status/route.ts`
- `src/components/guest/tools/ai-alt-tool.tsx`
- `src/app/[locale]/(marketing)/image-alt-text/page.tsx` (redirect)
- Tests: `guest-ai-alt-policy`, `guest-ai-alt-provider` (mocked)

## Files to modify
processing-policy/service, errors (+ i18n), tool-config, progress-card, workspace phases, session scrub, guest status policy aiConfigured, homepage ready, analytics, project docs.

## Packages
None new (`openai` already present).

## Live verification requirements
Without a real `OPENAI_API_KEY`: Live provider generation **Blocked**. Mocked tests + build may Pass. Do not claim live Playwright generation Passed.

## Verification plan
Focused AI tests → typecheck → lint → full suite (AI baseline only) → alt build. No live cutover.
