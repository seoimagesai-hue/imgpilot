-- Non-destructive: trusted validation statuses + metadata columns.
-- Does not drop auth, projects, or images. Does not rewrite existing rows.

ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'validating';--> statement-breakpoint
ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'validated';--> statement-breakpoint
ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'validation_failed';--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "detected_format" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "detected_mime_type" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "pixel_count" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "is_animated" boolean;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "frame_count" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "orientation" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "has_alpha" boolean;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "colour_space" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "validated_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "validation_version" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "validation_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "last_validation_attempt_at" timestamp;
