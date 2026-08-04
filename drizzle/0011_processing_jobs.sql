-- Prompt 12: processing jobs + derivatives + generated-output quota counters.
-- Additive / non-destructive. Does not require R2.

CREATE TYPE "processing_job_status" AS ENUM(
  'queued',
  'processing',
  'uploading_output',
  'verifying_output',
  'completed',
  'failed',
  'cancelled',
  'cleanup_pending',
  'cleanup_failed',
  'stale'
);--> statement-breakpoint

CREATE TYPE "processing_operation" AS ENUM('optimize_same_format');--> statement-breakpoint

CREATE TYPE "image_derivative_status" AS ENUM(
  'pending',
  'active',
  'stale',
  'cleanup_pending',
  'cleanup_failed',
  'deleted'
);--> statement-breakpoint

CREATE TYPE "image_derivative_kind" AS ENUM('optimized_same_format');--> statement-breakpoint

ALTER TABLE "project_quota_state"
  ADD COLUMN IF NOT EXISTS "generated_output_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_quota_state"
  ADD COLUMN IF NOT EXISTS "reserved_generated_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "processing_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text NOT NULL,
  "created_by" text NOT NULL,
  "operation" "processing_operation" DEFAULT 'optimize_same_format' NOT NULL,
  "status" "processing_job_status" DEFAULT 'queued' NOT NULL,
  "source_storage_key" text NOT NULL,
  "source_byte_size" integer NOT NULL,
  "source_detected_format" text,
  "source_mime_type" text,
  "source_width" integer,
  "source_height" integer,
  "source_etag" text,
  "output_storage_key" text,
  "output_byte_size" integer,
  "output_detected_format" text,
  "output_mime_type" text,
  "output_width" integer,
  "output_height" integer,
  "output_etag" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "idempotency_key" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "failed_at" timestamp,
  "cancelled_at" timestamp,
  "cleanup_started_at" timestamp,
  "cleanup_completed_at" timestamp,
  "last_error_code" text,
  "last_error_message_safe" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "processing_jobs_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "processing_jobs_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "image_derivatives" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text NOT NULL,
  "processing_job_id" text NOT NULL,
  "storage_key" text NOT NULL,
  "kind" "image_derivative_kind" DEFAULT 'optimized_same_format' NOT NULL,
  "format" text,
  "mime_type" text,
  "byte_size" integer,
  "width" integer,
  "height" integer,
  "etag" text,
  "status" "image_derivative_status" DEFAULT 'pending' NOT NULL,
  "source_storage_key" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "image_derivatives_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "image_derivatives_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "image_derivatives_processing_job_id_processing_jobs_id_fk"
    FOREIGN KEY ("processing_job_id") REFERENCES "public"."processing_jobs"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "image_derivatives_storage_key_unique" UNIQUE("storage_key")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "processing_jobs_project_id_idx" ON "processing_jobs" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "processing_jobs_image_id_idx" ON "processing_jobs" ("image_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "processing_jobs_status_idx" ON "processing_jobs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "processing_jobs_image_status_idx" ON "processing_jobs" ("image_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "processing_jobs_idempotency_key_idx"
  ON "processing_jobs" ("idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_derivatives_project_id_idx" ON "image_derivatives" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_derivatives_image_id_idx" ON "image_derivatives" ("image_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_derivatives_job_id_idx" ON "image_derivatives" ("processing_job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "image_derivatives_status_idx" ON "image_derivatives" ("status");
