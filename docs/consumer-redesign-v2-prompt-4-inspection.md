# Consumer Redesign v2 — Prompt 4 inspection

## Goal
Prove Crop plugs into `GuestToolWorkspace` / `GuestToolConfig` with an interactive editor, without duplicating upload/progress/result/download/expiry UI.

## Shared shell (unchanged pages)
Compress / Resize / Crop pages only differ by `config={…ToolConfig}`.

## Crop-specific
| Piece | Location |
| --- | --- |
| Policy | `src/lib/guest/crop-policy.ts` |
| Service | `src/server/guest/crop-service.ts` |
| Editor | `src/components/guest/tools/crop-editor.tsx` |
| Config | `src/components/guest/tools/crop-tool.tsx` |
| Route | `/[locale]/crop-image` |

## Coordinate trust boundary
Browser selection → normalized `{x,y,width,height}` in `[0,1]`.  
Server validates, converts with **trusted oriented dimensions** after `sharp.rotate()`, extracts, fully decodes output, verifies pixel size.

## Orientation
Normalize with `sharp.rotate()` before extract so EXIF phone JPEGs match browser preview coordinates. Crop stage uses `dir="ltr"` so RTL does not flip crop math.

## Library decision
No new npm dependency — lightweight custom crop editor (drag/resize/zoom + keyboard fallbacks).

## Reuse estimate
~91% shared workspace UI; editor + crop options + crop Sharp path are tool-specific.
