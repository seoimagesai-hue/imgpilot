# Consumer Redesign v2 — Prompt 8 completion

## Status
**Prompt 8 complete in source (AI Alt Text on shared GuestToolWorkspace).** Live `:3000` / `.next` not cut over.

## Baseline AI test
`tests/ai-metadata.test.ts` `bulkAi` expectation still fails (policy `true`, test expects `false`). **Unrelated.** No new failing tests.

## Route
`/[locale]/ai-alt-text` → `<GuestToolWorkspace config={createAiAltToolConfig(locale)} />`  
Legacy: `/[locale]/image-alt-text` → redirect to `/ai-alt-text`

## Shared UI reuse
**~91%** (shell, upload, progress, preview, expiry, banners). AI-specific: purpose/language controls, result field cards, copy/export Blobs, `hideImageDownload`, unconfigured banner.

## Architecture honesty
| Item | Truth |
| --- | --- |
| Provider API | OpenAI **Chat Completions** (repo has no Responses API) |
| Fallback | **None** (single path) |
| Live generation | **Blocked** without real `OPENAI_API_KEY` request |
| Ops | Shared guest rolling counter |

## New modules
- `src/lib/guest/ai-alt-policy.ts` (+ server re-export)
- `src/server/guest/ai-alt-prompt.ts`
- `src/server/guest/ai-alt-provider.ts`
- `src/server/guest/ai-alt-service.ts`
- `src/app/api/guest/alt-text/status/route.ts`
- `src/components/guest/tools/ai-alt-tool.tsx`
- Tests: `guest-ai-alt-policy`, `guest-ai-alt-provider` (mocked)

## Verify
| Check | Result |
|-------|--------|
| Focused AI tests | Pass (14) |
| Mocked success / timeout / malformed | Pass |
| Mocked Responses fallback | N/A — not implemented (documented) |
| typecheck | Pass |
| lint | Pass (0 errors) |
| Full suite | Fail — same single AI baseline (297/298) |
| New failures | **None** |
| Alt build `.next-phase1-verify` | Pass |
| Live provider / Playwright generation | Blocked / Not run |
| Live cutover | Not run |

## Next
**Consumer Redesign v2 Prompt 9 — Public Image SEO Metadata Editor using the same shared workspace and AI result contract**
