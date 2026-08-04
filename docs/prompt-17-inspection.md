# Prompt 17 — Inspection findings (pre-implementation)

## Metadata language
- Field: `projects.metadata_language` enum `en` | `ur` (default `en`)
- Separate from next-intl UI locale (`en`/`ur`)

## Eligibility (chosen)
- Allowed: `validated` OR `ready_for_processing`
- Blocked: deleting/deleted, validation_failed, upload states, open replacement, missing trusted metadata
- Animated: **allowed** for AI (bounded still analysis); Sharp processing still rejects animated

## Existing metadata fields
- None on images (no alt/title/caption). Only `original_filename`.

## Queue reuse plan
- Add `generate_metadata` to `processing_operation`
- Worker reuses claim/lease/heartbeat
- `metadata_generations` + `image_metadata_approved` for drafts/history/approval
- Browser never calls provider

## Provider
- **OpenAI** vision (`gpt-4o-mini`) — env already has `AI_PROVIDER` / `OPENAI_API_KEY`
- Abstraction: `ImageMetadataProvider`; single SDK `@openai/openai` or fetch-based to avoid heavy deps — use official `openai` package

## Analysis image
- Longest side ≤ 1280px, no upscale, JPEG analysis bytes in memory, EXIF stripped, not persisted

## Urdu filename policy
- Alt/title/caption/description in Urdu when language=ur
- Filename suggestion: **Latin ASCII SEO slug only** (never Nastaliq in filenames)

## Unchanged
- Sharp optimize/resize/convert, R2 originals, Ready semantics for processing, billing, ZIP/CSV, bulk AI
