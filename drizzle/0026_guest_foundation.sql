CREATE TYPE "public"."guest_cohort" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."guest_upload_status" AS ENUM('pending_upload', 'uploaded', 'validated', 'failed', 'expired', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."guest_job_status" AS ENUM('queued', 'running', 'completed', 'failed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."guest_cleanup_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"cohort" "guest_cohort" NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"tool_code" text DEFAULT 'home' NOT NULL,
	"operations_window_started_at" timestamp DEFAULT now() NOT NULL,
	"operations_used" integer DEFAULT 0 NOT NULL,
	"ip_hash" text,
	"user_agent_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"scrubbed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "guest_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text,
	"declared_mime_type" text,
	"detected_mime_type" text,
	"size_bytes" bigint,
	"width" integer,
	"height" integer,
	"is_animated" boolean,
	"has_alpha" boolean,
	"status" "guest_upload_status" DEFAULT 'pending_upload' NOT NULL,
	"failure_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"validated_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "guest_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"upload_id" text,
	"operation" text NOT NULL,
	"status" "guest_job_status" DEFAULT 'queued' NOT NULL,
	"output_storage_key" text,
	"error_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_cleanup_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"storage_key" text NOT NULL,
	"session_id" text,
	"status" "guest_cleanup_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "guest_uploads" ADD CONSTRAINT "guest_uploads_session_id_guest_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_jobs" ADD CONSTRAINT "guest_jobs_session_id_guest_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_jobs" ADD CONSTRAINT "guest_jobs_upload_id_guest_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."guest_uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_cleanup_queue" ADD CONSTRAINT "guest_cleanup_queue_session_id_guest_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_sessions_public_id_uidx" ON "guest_sessions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_sessions_token_hash_uidx" ON "guest_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_uploads_storage_key_uidx" ON "guest_uploads" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "guest_uploads_session_idx" ON "guest_uploads" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "guest_uploads_expires_at_idx" ON "guest_uploads" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "guest_jobs_session_status_idx" ON "guest_jobs" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "guest_jobs_expires_at_idx" ON "guest_jobs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "guest_cleanup_queue_status_retry_idx" ON "guest_cleanup_queue" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_cleanup_queue_storage_key_pending_uidx" ON "guest_cleanup_queue" USING btree ("storage_key");
