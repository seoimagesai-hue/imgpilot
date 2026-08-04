-- Prompt 13: resize presets — additive enum values + preset/checksum/duration columns.
-- Does not require R2. Does not mutate existing jobs/derivatives.

ALTER TYPE "processing_operation" ADD VALUE IF NOT EXISTS 'resize';--> statement-breakpoint

ALTER TYPE "image_derivative_kind" ADD VALUE IF NOT EXISTS 'resized';--> statement-breakpoint

ALTER TABLE "processing_jobs"
  ADD COLUMN IF NOT EXISTS "preset" text;--> statement-breakpoint
ALTER TABLE "processing_jobs"
  ADD COLUMN IF NOT EXISTS "output_checksum" text;--> statement-breakpoint
ALTER TABLE "processing_jobs"
  ADD COLUMN IF NOT EXISTS "processing_duration_ms" integer;--> statement-breakpoint

ALTER TABLE "image_derivatives"
  ADD COLUMN IF NOT EXISTS "preset" text;--> statement-breakpoint
ALTER TABLE "image_derivatives"
  ADD COLUMN IF NOT EXISTS "checksum" text;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "processing_jobs_image_op_preset_status_idx"
  ON "processing_jobs" ("image_id", "operation", "preset", "status");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "image_derivatives_image_kind_preset_status_idx"
  ON "image_derivatives" ("image_id", "kind", "preset", "status");
