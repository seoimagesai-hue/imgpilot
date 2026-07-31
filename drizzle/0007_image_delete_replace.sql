-- Prompt 9: recoverable delete + replacement candidate lifecycle.
-- Additive / non-destructive. Does not drop tables or rewrite image IDs.
-- Does not mark existing rows deleted and does not create fake replacements.

ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'deletion_pending';--> statement-breakpoint
ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'storage_deleting';--> statement-breakpoint
ALTER TYPE "image_status" ADD VALUE IF NOT EXISTS 'deletion_failed';--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "image_replacement_status" AS ENUM (
    'pending',
    'uploading',
    'uploaded',
    'validating',
    'validated',
    'failed',
    'promotion_pending',
    'promoted',
    'old_storage_deleting',
    'complete',
    'old_storage_cleanup_failed',
    'cancelled',
    'cancel_cleanup_failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "deletion_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "deletion_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "storage_deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "deletion_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "deletion_failure_code" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "deleted_by" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "replaced_at" timestamp;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "image_replacements" (
  "id" text PRIMARY KEY NOT NULL,
  "image_id" text NOT NULL,
  "project_id" text NOT NULL,
  "created_by" text NOT NULL,
  "status" "image_replacement_status" DEFAULT 'pending' NOT NULL,
  "new_storage_key" text NOT NULL,
  "new_original_filename" text NOT NULL,
  "new_declared_mime" text NOT NULL,
  "new_file_extension" text NOT NULL,
  "new_declared_size_bytes" integer NOT NULL,
  "new_detected_mime" text,
  "new_detected_format" text,
  "new_byte_size" integer,
  "new_width" integer,
  "new_height" integer,
  "new_pixel_count" integer,
  "new_frame_count" integer,
  "new_animated" boolean,
  "new_orientation" integer,
  "new_has_alpha" boolean,
  "new_colour_space" text,
  "new_etag" text,
  "new_storage_content_type" text,
  "upload_expires_at" timestamp,
  "upload_confirmed_at" timestamp,
  "validated_at" timestamp,
  "validation_version" text,
  "validation_attempts" integer DEFAULT 0 NOT NULL,
  "last_validation_attempt_at" timestamp,
  "promotion_started_at" timestamp,
  "promoted_at" timestamp,
  "old_storage_key" text,
  "old_storage_cleanup_started_at" timestamp,
  "old_storage_deleted_at" timestamp,
  "failure_code" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "cancelled_at" timestamp,
  "candidate_deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "image_replacements"
    ADD CONSTRAINT "image_replacements_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "image_replacements"
    ADD CONSTRAINT "image_replacements_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "image_replacements"
    ADD CONSTRAINT "image_replacements_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "image_replacements_new_storage_key_uidx" ON "image_replacements" ("new_storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "image_replacements_one_open_per_image_uidx"
  ON "image_replacements" ("image_id")
  WHERE "status" IN (
    'pending',
    'uploading',
    'uploaded',
    'validating',
    'validated',
    'failed',
    'promotion_pending',
    'cancel_cleanup_failed'
  );--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_replacements_image_id_idx" ON "image_replacements" ("image_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_replacements_project_id_idx" ON "image_replacements" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_replacements_status_idx" ON "image_replacements" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_replacements_image_status_idx" ON "image_replacements" ("image_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "images_project_deleted_at_idx" ON "images" ("project_id", "deleted_at");
