# Consumer Redesign v2 — Prompt 5 inspection

## Baseline failing test (pre-coding)
| Test | Observation |
| --- | --- |
| `tests/ai-metadata.test.ts` › `never auto-approves or auto-renames` | Expects `policy.bulkAi === false` but `getAiMetadataPolicy()` returns `bulkAi: true` |
| Relation to Convert | **Unrelated** — AI metadata dashboard policy only |
| Action in Prompt 5 | Do not change AI policy/tests; report baseline remains |

Verified by running `npx vitest run tests/ai-metadata.test.ts` (2026-08-03).

## Shared components to reuse
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolResultPanel, ToolActionBar, ExpiryCountdown, GuestLimitBanner, UpgradeBanner, ToolHeader, guest API client, guest session/upload/download/cleanup.

## Existing conversion code
| Module | Reuse decision |
| --- | --- |
| `server/images/conversion-policy.ts` | **Do not mutate** — dashboard matrix forbids PNG→JPEG silently |
| `server/images/processing-optimizer.convertFormat` | **Do not call** — blocks PNG→JPEG; no rotate; fixed qualities |
| Guest convert | New `lib/guest/convert-policy.ts` + `server/guest/convert-service.ts` |

## Formats
- **Source (guest):** JPEG, PNG, WebP (static) via existing validation
- **Targets:** PNG, JPEG, WebP, AVIF (probe)
- **Same-format:** Hidden/rejected — point users to Compress

## Guest conversion matrix (planned)
| Source | Targets (exclude same) |
| --- | --- |
| jpeg | png, webp, (+avif if probe) |
| png | jpeg, webp, (+avif if probe) |
| webp | jpeg, png, (+avif if probe) |

## AVIF
Runtime encode probe via Sharp (`format.avif` + encode smoke). Hide AVIF in UI when unsupported. Build must pass either way.

## Transparency
Trusted `hasAlpha` from validation DB. Preserve for PNG/WebP/AVIF. JPEG requires white/black background + flatten notice.

## Orientation
Convert-only: `sharp.rotate()` before encode. Do not change Compress/Resize orientation behaviour.

## Quality
Presets `smaller` / `balanced` / `higher` mapped server-side. PNG uses compression description (no lossy quality slider).

## Reprocessing
Mirror Crop: identical options → reuse completed job; else new job + prior convert output cleanup + rate limit.

## Files to create
- `docs/consumer-redesign-v2-prompt-5-inspection.md` (this file)
- `docs/consumer-redesign-v2-prompt-5-completion.md`
- `src/lib/guest/convert-policy.ts`
- `src/server/guest/convert-policy.ts` (re-export)
- `src/server/guest/convert-service.ts`
- `src/server/guest/avif-capability.ts`
- `src/components/guest/tools/convert-tool.tsx`
- `tests/guest-convert-policy.test.ts`
- `tests/guest-convert-processing.test.ts`

## Files to modify
- `processing-policy.ts` (add `convert.format`)
- `processing-service.ts` (dispatch + convert reprocess)
- `tool-config.ts`, `progress-card.tsx`, `guest-tool-workspace.tsx`
- `types.ts` / upload public (`hasAlpha`)
- `guest-policy.ts` / session public (`avifEncodeSupported`)
- `convert-image/page.tsx`, homepage TOOLS
- EN/UR messages, PROJECT/ROADMAP/ARCHITECTURE/DECISIONS/CHANGELOG/TASKS/KNOWN_ISSUES/README

## Packages required
None (Sharp already installed).

## Verification plan
Focused convert tests → typecheck → lint → full suite (baseline AI failure only) → alt build `.next-phase1-verify`. No live cutover.
