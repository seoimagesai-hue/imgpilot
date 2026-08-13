-- Prompt 27: Shopify (Custom App Admin API access token) publish integration.
-- Additive only.

CREATE TYPE "public"."shopify_connection_status" AS ENUM('pending', 'verifying', 'active', 'degraded', 'authentication_failed', 'permission_failed', 'unreachable', 'disabled', 'disconnected');
--> statement-breakpoint
CREATE TYPE "public"."shopify_publish_source_type" AS ENUM('derivative', 'original');
--> statement-breakpoint
CREATE TYPE "public"."shopify_filename_mode" AS ENUM('keep', 'suggestion');
--> statement-breakpoint
CREATE TYPE "public"."shopify_publish_job_status" AS ENUM('queued', 'leased', 'validating', 'uploading_media', 'updating_metadata', 'verifying_remote', 'completed', 'partially_completed', 'failed', 'cancelled', 'stale');
--> statement-breakpoint
CREATE TYPE "public"."shopify_media_publish_status" AS ENUM('active', 'stale', 'disconnected');
--> statement-breakpoint
CREATE TYPE "public"."shopify_bulk_job_status" AS ENUM('queued', 'running', 'completed', 'partially_completed', 'failed', 'cancelled');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shopify_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"name" text NOT NULL,
	"shop_domain" text NOT NULL,
	"status" "shopify_connection_status" DEFAULT 'pending' NOT NULL,
	"access_token_ciphertext" text NOT NULL,
	"access_token_nonce" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"shop_id" text,
	"shop_name_safe" text,
	"shopify_plan_name_safe" text,
	"api_version" text DEFAULT '2024-10' NOT NULL,
	"scopes_safe" text,
	"last_verified_at" timestamp,
	"last_success_at" timestamp,
	"last_failure_at" timestamp,
	"last_failure_code" text,
	"consecutive_failure_count" integer DEFAULT 0 NOT NULL,
	"disabled_at" timestamp,
	"disconnected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_connections" ADD CONSTRAINT "shopify_connections_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_connections_workspace_status_idx" ON "shopify_connections" USING btree ("workspace_type","workspace_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_connections_shop_domain_idx" ON "shopify_connections" USING btree ("shop_domain");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shopify_bulk_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"shopify_product_id" text NOT NULL,
	"status" "shopify_bulk_job_status" DEFAULT 'queued' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"pending_count" integer DEFAULT 0 NOT NULL,
	"running_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"cancelled_count" integer DEFAULT 0 NOT NULL,
	"cancel_requested" boolean DEFAULT false NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_bulk_jobs" ADD CONSTRAINT "shopify_bulk_jobs_connection_id_shopify_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."shopify_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_bulk_jobs" ADD CONSTRAINT "shopify_bulk_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_bulk_jobs" ADD CONSTRAINT "shopify_bulk_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_bulk_jobs_connection_idx" ON "shopify_bulk_jobs" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_bulk_jobs_project_idx" ON "shopify_bulk_jobs" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_bulk_jobs_status_idx" ON "shopify_bulk_jobs" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shopify_publish_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"image_id" text NOT NULL,
	"shopify_product_id" text NOT NULL,
	"shopify_product_title_safe" text,
	"source_type" "shopify_publish_source_type" DEFAULT 'derivative' NOT NULL,
	"derivative_id" text,
	"source_storage_key" text NOT NULL,
	"source_revision_key" text NOT NULL,
	"metadata_approval_id" text NOT NULL,
	"metadata_language" "metadata_language" NOT NULL,
	"filename_mode" "shopify_filename_mode" DEFAULT 'keep' NOT NULL,
	"requested_filename" text NOT NULL,
	"status" "shopify_publish_job_status" DEFAULT 'queued' NOT NULL,
	"remote_image_id" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"idempotency_key" text,
	"bulk_parent_id" text,
	"last_error_code" text,
	"lease_owner" text,
	"lease_expires_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_publish_jobs" ADD CONSTRAINT "shopify_publish_jobs_connection_id_shopify_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."shopify_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_publish_jobs" ADD CONSTRAINT "shopify_publish_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_publish_jobs" ADD CONSTRAINT "shopify_publish_jobs_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_publish_jobs" ADD CONSTRAINT "shopify_publish_jobs_bulk_parent_id_shopify_bulk_jobs_id_fk" FOREIGN KEY ("bulk_parent_id") REFERENCES "public"."shopify_bulk_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_claim_idx" ON "shopify_publish_jobs" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_connection_idx" ON "shopify_publish_jobs" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_project_idx" ON "shopify_publish_jobs" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_image_idx" ON "shopify_publish_jobs" USING btree ("image_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_product_idx" ON "shopify_publish_jobs" USING btree ("shopify_product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_bulk_parent_idx" ON "shopify_publish_jobs" USING btree ("bulk_parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_publish_jobs_lease_expires_at_idx" ON "shopify_publish_jobs" USING btree ("lease_expires_at") WHERE "shopify_publish_jobs"."lease_expires_at" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shopify_publish_jobs_idempotency_key_idx" ON "shopify_publish_jobs" USING btree ("idempotency_key") WHERE "shopify_publish_jobs"."idempotency_key" is not null;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shopify_media_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"image_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"publish_job_id" text,
	"shopify_product_id" text NOT NULL,
	"source_storage_key" text NOT NULL,
	"derivative_id" text,
	"metadata_approval_id" text NOT NULL,
	"remote_image_id" text NOT NULL,
	"remote_media_url_safe" text NOT NULL,
	"remote_filename" text NOT NULL,
	"remote_mime_type" text NOT NULL,
	"remote_width" integer,
	"remote_height" integer,
	"remote_alt_safe" text,
	"publish_status" "shopify_media_publish_status" DEFAULT 'active' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"last_verified_at" timestamp,
	"stale_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_media_mappings" ADD CONSTRAINT "shopify_media_mappings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_media_mappings" ADD CONSTRAINT "shopify_media_mappings_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_media_mappings" ADD CONSTRAINT "shopify_media_mappings_connection_id_shopify_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."shopify_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shopify_media_mappings" ADD CONSTRAINT "shopify_media_mappings_publish_job_id_shopify_publish_jobs_id_fk" FOREIGN KEY ("publish_job_id") REFERENCES "public"."shopify_publish_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_media_mappings_project_idx" ON "shopify_media_mappings" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_media_mappings_image_idx" ON "shopify_media_mappings" USING btree ("image_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_media_mappings_connection_idx" ON "shopify_media_mappings" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopify_media_mappings_product_idx" ON "shopify_media_mappings" USING btree ("shopify_product_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shopify_media_mappings_identity_uidx" ON "shopify_media_mappings" USING btree ("connection_id","shopify_product_id","image_id","source_storage_key",(coalesce("derivative_id", 'original')),"metadata_approval_id");
