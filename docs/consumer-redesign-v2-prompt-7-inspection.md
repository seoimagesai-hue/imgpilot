# Consumer Redesign v2 — Prompt 7 inspection

## Baseline failing test (pre-coding)
| Test | Observation |
| --- | --- |
| `tests/ai-metadata.test.ts` › `never auto-approves or auto-renames` | Expects `bulkAi === false`; policy returns `true` |
| Relation to Metadata Viewer | **Unrelated** |
| Action | Do not change AI policy/tests |

Verified `npx vitest run tests/ai-metadata.test.ts` (2026-08-03).

## Shared services reused
GuestToolWorkspace, GuestToolConfig, UploadDropzone, ProgressCard, BeforeAfterPreview, ToolResultPanel (plus viewer sections), ToolActionBar, ExpiryCountdown, banners, ToolHeader, guest API client, session/upload/cleanup, EN/UR layout.

## Validation metadata already available
On validated `guestUploads`: `detectedMimeType`, `sizeBytes`, `width`, `height`, `isAnimated`, `hasAlpha`. Confirm API also returns those (minus `isAnimated` today).

`inspectAndFullyDecodeImage` / Sharp also yield (not all persisted): orientation, colourSpace, channels, depth, density, hasProfile, pages/frames, progressive.

## Additional server extraction required
Allow-listed EXIF (JPEG via piexifjs), safe GPS via `readSafeGpsFromJpeg`, aspect ratio / pixel count, ICC present flag, density + optional print-size calculation, animation fields, normalized camera fields. Bounded safe JSON result schema `guest-image-metadata-v2`.

## Metadata parser decision
| Source | Use |
| --- | --- |
| Sharp | General image / color / density / animation / progressive |
| piexifjs | JPEG allow-listed EXIF + Orientation; **already installed** |
| `readSafeGpsFromJpeg` | GPS section (JPEG) |
| exifr | **Not wired** — orphan lockfile entry; do **not** add unless needed |

No new packages.

## Safe field allow-list
File: safe filename, format, mime, byteSize (no keys/URLs).  
Image: width/height, aspect, pixels, orientation, animated, frames, alpha, colorSpace, channels, bitDepth, density, ICC present, progressive when known.  
Camera: make, model, lens, iso, exposureTime, aperture, focalLength, flash, whiteBalance, exposureProgram, meteringMode, dateTaken, software, orientation.  
GPS: present/readable, lat/lon/altitude (sensitive section).

## Sensitive deny-list
Owner/artist/copyright/comments/userComment, serial numbers, maker notes, thumbnails, raw XMP/IPTC/binary, arbitrary tags, storage keys, signed URLs, internal IDs.

## Supported formats (user decision)
**JPEG / PNG / WebP only.** AVIF/GIF/TIFF rejected for this prompt. SVG/PDF/HEIC rejected.

## GPS handling
Reuse geotag safe reader; labeled sensitive; no map/geocoder; no analytics/logs of coordinates; scrub on cleanup/session expiry like geotag.

## Export architecture (user decision)
**Client-side Blob** from job `resultSummary` already returned. No persistent export objects. No signed image download required. Hide misleading “Download processed image”.

## Job / result-summary policy
`operation: metadata.inspect`. Options: `{schemaVersion}` only (or empty allow-list). Store bounded safe summary only. Idempotent re-inspect of same upload. No derivative image / no `outputStorageKey` for image. Viewer-only — source unchanged.

## Cleanup policy
Shared exact-key cleanup for original. Scrub metadata/GPS from job `options`/`resultSummary` on session expiry and re-inspect (same pattern as geotag).

## Files to create
- `docs/consumer-redesign-v2-prompt-7-inspection.md` (this)
- `docs/consumer-redesign-v2-prompt-7-completion.md`
- `src/lib/guest/metadata-policy.ts` (+ server re-export)
- `src/server/guest/metadata-extract.ts`
- `src/server/guest/metadata-service.ts`
- `src/components/guest/tools/metadata-tool.tsx`
- `tests/guest-metadata-policy.test.ts`
- `tests/guest-metadata-extract.test.ts`

## Files to modify
processing-policy/service, tool-config, progress-card, workspace/action-bar (hide download), geotag-style scrub for metadata.inspect, homepage ready, guest EN/UR, session scrub, analytics event names, project docs.

## Packages
None new.

## Verification plan
Focused metadata tests → typecheck → lint → full suite (AI baseline only) → alt build `.next-phase1-verify`. No live cutover.
