-- Guest public bulk parent/child jobs (Prompt 10). Additive; do not apply on live without cutover approval.

CREATE TYPE "public"."guest_bulk_job_status" AS ENUM(
  'draft',
  'uploading',
  'ready',
  'processing',
  'completed',
  'partial',
  'failed',
  'expired',
  'cancelled'
);--> statement-breakpoint

CREATE TYPE "public"."guest_bulk_item_status" AS ENUM(
  'pending',
  'uploading',
  'validated',
  'processing',
  'completed',
  'failed',
  'skipped',
  'cancelled'
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "guest_bulk_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "tool_code" text NOT NULL,
  "operation" text NOT NULL,
  "status" "guest_bulk_job_status" DEFAULT 'draft' NOT NULL,
  "options" jsonb,
  "total_items" integer DEFAULT 0 NOT NULL,
  "completed_items" integer DEFAULT 0 NOT NULL,
  "failed_items" integer DEFAULT 0 NOT NULL,
  "skipped_items" integer DEFAULT 0 NOT NULL,
  "reserved_ops" integer DEFAULT 0 NOT NULL,
  "archive_storage_key" text,
  "archive_bytes" bigint,
  "archive_status" text,
  "error_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "expires_at" timestamp NOT NULL,
  CONSTRAINT "guest_bulk_jobs_session_id_guest_sessions_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "guest_bulk_job_items" (
  "id" text PRIMARY KEY NOT NULL,
  "bulk_job_id" text NOT NULL,
  "session_id" text NOT NULL,
  "upload_id" text,
  "child_job_id" text,
  "original_filename" text,
  "declared_mime_type" text,
  "declared_size_bytes" bigint,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "status" "guest_bulk_item_status" DEFAULT 'pending' NOT NULL,
  "error_code" text,
  "result_summary" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "guest_bulk_job_items_bulk_job_id_fk"
    FOREIGN KEY ("bulk_job_id") REFERENCES "public"."guest_bulk_jobs"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "guest_bulk_job_items_session_id_fk"
    FOREIGN KEY ("session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "guest_bulk_job_items_upload_id_fk"
    FOREIGN KEY ("upload_id") REFERENCES "public"."guest_uploads"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "guest_bulk_job_items_child_job_id_fk"
    FOREIGN KEY ("child_job_id") REFERENCES "public"."guest_jobs"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "guest_bulk_jobs_session_status_idx"
  ON "guest_bulk_jobs" ("session_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guest_bulk_jobs_expires_at_idx"
  ON "guest_bulk_jobs" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guest_bulk_job_items_bulk_idx"
  ON "guest_bulk_job_items" ("bulk_job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guest_bulk_job_items_session_idx"
  ON "guest_bulk_job_items" ("session_id");
