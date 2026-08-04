# Consumer Redesign v2 — Prompt 3 inspection

## Goal
Prove Resize reuses the Compress guest workspace: one upload → options → process → compare → download funnel; only tool controls and Sharp engine differ.

## Shared workspace (unchanged shell)
| Component | Role |
| --- | --- |
| `GuestToolWorkspace` | Pluggable shell via `GuestToolConfig` |
| `UploadDropzone` | Drop / browse / paste |
| `ProgressCard` | Shared phases (+ `resizing`) |
| `BeforeAfterPreview` | Original → Result (`guest.compare`) |
| `ToolResultPanel` | Generic results grid (replaces Compress-only panel) |
| `ToolActionBar` | Process / download / again |
| `ExpiryCountdown` | Session TTL |
| `GuestLimitBanner` / `UpgradeBanner` | Limits + soft upgrade |
| `ToolHeader` | Title + tool subtitle |

## Tool-specific plugs
| Piece | Compress | Resize |
| --- | --- | --- |
| Config | `tools/compress-tool.tsx` | `tools/resize-tool.tsx` |
| Options UI | presets + strength | method + presets + w/h + aspect + no-upscale |
| Operation | `compress.same_format` | `resize.same_format` |
| Engine | `compress-service.ts` | `resize-service.ts` |
| Policy | `lib/guest/compress-policy.ts` | `lib/guest/resize-policy.ts` |

## Route
`/[locale]/resize-image` → same `GuestToolWorkspace` as compress.

## Duplicate UI removed
- Deleted `compress-options.tsx` / `compress-result-panel.tsx` (logic moved under `tools/` + shared `ToolResultPanel`).

## Locked
- Exact Size method visible but disabled; server rejects `exact_size` with `OPERATION_NOT_SUPPORTED`.

## Reuse estimate
~92% shared UI (shell + upload + progress + compare + results + download + banners). Only options panel + action labels + processing phase string differ.
