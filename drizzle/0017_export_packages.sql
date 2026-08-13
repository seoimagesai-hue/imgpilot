-- Prompt 19: export packages. Additive only.

CREATE TYPE "public"."export_job_status" AS ENUM('queued', 'processing', 'uploading', 'completed', 'failed', 'cancelled', 'expired', 'cleanup_pending');
--> statement-breakpoint
CREATE TYPE "public"."export_package_kind" AS ENUM('csv', 'json', 'zip', 'wordpress', 'shopify', 'webflow', 'generic');
--> statement-breakpoint
CREATE TYPE "public"."export_source_filter" AS ENUM('approved', 'draft', 'reviewed');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"created_by" text NOT NULL,
	"package_kind" "export_package_kind" DEFAULT 'zip' NOT NULL,
	"source_filter" "export_source_filter" DEFAULT 'approved' NOT NULL,
	"language" "metadata_language" NOT NULL,
	"status" "export_job_status" DEFAULT 'queued' NOT NULL,
	"include_images" boolean DEFAULT false NOT NULL,
	"include_csv" boolean DEFAULT true NOT NULL,
	"include_json" boolean DEFAULT true NOT NULL,
	"include_txt" boolean DEFAULT true NOT NULL,
	"include_html_report" boolean DEFAULT true NOT NULL,
	"include_sidecars" boolean DEFAULT true NOT NULL,
	"image_ids_json" text,
	"item_count" integer DEFAULT 0 NOT NULL,
	"output_storage_key" text,
	"output_byte_size" integer,
	"output_content_type" text,
	"output_etag" text,
	"output_checksum" text,
	"download_expires_at" timestamp,
	"lease_owner" text,
	"lease_expires_at" timestamp,
	"heartbeat_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"idempotency_key" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"cancelled_at" timestamp,
	"last_error_code" text,
	"last_error_message_safe" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_project_id_idx" ON "export_jobs" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_status_idx" ON "export_jobs" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_queue_claim_idx" ON "export_jobs" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_project_completed_at_idx" ON "export_jobs" USING btree ("project_id","completed_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "export_jobs_idempotency_key_idx" ON "export_jobs" USING btree ("idempotency_key") WHERE "export_jobs"."idempotency_key" is not null;
