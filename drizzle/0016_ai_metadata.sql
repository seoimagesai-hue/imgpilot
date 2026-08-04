-- Prompt 17: AI metadata generation. Additive only.

DO $$ BEGIN
  ALTER TYPE "processing_operation" ADD VALUE 'generate_metadata';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TYPE "metadata_generation_status" AS ENUM(
  'queued',
  'generating',
  'validating_output',
  'draft',
  'reviewed',
  'approved',
  'rejected',
  'failed',
  'cancelled',
  'stale'
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "metadata_generations" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text NOT NULL,
  "processing_job_id" text,
  "source_storage_key" text NOT NULL,
  "language" "metadata_language" NOT NULL,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "prompt_version" text NOT NULL,
  "status" "metadata_generation_status" DEFAULT 'queued' NOT NULL,
  "alt_text" text,
  "title" text,
  "caption" text,
  "description" text,
  "filename_suggestion" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "idempotency_key" text,
  "started_at" timestamp,
  "generated_at" timestamp,
  "reviewed_at" timestamp,
  "approved_at" timestamp,
  "rejected_at" timestamp,
  "failed_at" timestamp,
  "created_by" text NOT NULL,
  "updated_by" text,
  "last_error_code" text,
  "last_error_message_safe" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "metadata_generations_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "metadata_generations_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "image_metadata_approved" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text NOT NULL,
  "language" "metadata_language" NOT NULL,
  "generation_id" text NOT NULL,
  "source_storage_key" text NOT NULL,
  "alt_text" text NOT NULL,
  "title" text NOT NULL,
  "caption" text,
  "description" text NOT NULL,
  "filename_suggestion" text NOT NULL,
  "approved_by" text NOT NULL,
  "approved_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "image_metadata_approved_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "image_metadata_approved_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "image_metadata_approved_generation_id_fk"
    FOREIGN KEY ("generation_id") REFERENCES "public"."metadata_generations"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "metadata_generations_project_id_idx" ON "metadata_generations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "metadata_generations_image_id_idx" ON "metadata_generations" ("image_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "metadata_generations_status_idx" ON "metadata_generations" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "metadata_generations_idempotency_key_idx"
  ON "metadata_generations" ("idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "image_metadata_approved_image_lang_idx"
  ON "image_metadata_approved" ("image_id", "language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_metadata_approved_project_id_idx" ON "image_metadata_approved" ("project_id");
