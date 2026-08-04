-- Prompt 15: bulk processing orchestration (synchronous). Additive only.

CREATE TYPE "bulk_job_status" AS ENUM(
  'queued',
  'validating',
  'running',
  'completed',
  'partially_completed',
  'failed',
  'cancelled'
);--> statement-breakpoint

CREATE TYPE "bulk_item_status" AS ENUM(
  'pending',
  'skipped',
  'running',
  'completed',
  'failed',
  'cancelled',
  'stale'
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "bulk_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "created_by" text NOT NULL,
  "operation" "processing_operation" NOT NULL,
  "preset" text,
  "status" "bulk_job_status" DEFAULT 'queued' NOT NULL,
  "total_count" integer DEFAULT 0 NOT NULL,
  "pending_count" integer DEFAULT 0 NOT NULL,
  "running_count" integer DEFAULT 0 NOT NULL,
  "completed_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "skipped_count" integer DEFAULT 0 NOT NULL,
  "cancelled_count" integer DEFAULT 0 NOT NULL,
  "cancel_requested" boolean DEFAULT false NOT NULL,
  "idempotency_key" text,
  "last_error_code" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bulk_jobs_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "bulk_job_items" (
  "id" text PRIMARY KEY NOT NULL,
  "bulk_job_id" text NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text NOT NULL,
  "processing_job_id" text,
  "status" "bulk_item_status" DEFAULT 'pending' NOT NULL,
  "skip_reason" text,
  "last_error_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bulk_job_items_bulk_job_id_bulk_jobs_id_fk"
    FOREIGN KEY ("bulk_job_id") REFERENCES "public"."bulk_jobs"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "bulk_job_items_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "bulk_job_items_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "bulk_jobs_project_id_idx" ON "bulk_jobs" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_jobs_status_idx" ON "bulk_jobs" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bulk_jobs_idempotency_key_idx"
  ON "bulk_jobs" ("idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_job_items_bulk_job_id_idx" ON "bulk_job_items" ("bulk_job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_job_items_status_idx" ON "bulk_job_items" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bulk_job_items_image_id_idx" ON "bulk_job_items" ("image_id");
