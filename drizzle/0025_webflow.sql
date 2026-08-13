-- Prompt 28: Webflow (Site access token) CMS integration.
-- Additive only.

CREATE TYPE "public"."webflow_connection_status" AS ENUM('pending', 'verifying', 'active', 'degraded', 'authentication_failed', 'permission_failed', 'rate_limited', 'unreachable', 'disabled', 'disconnected');
--> statement-breakpoint
CREATE TYPE "public"."webflow_publish_source_type" AS ENUM('derivative', 'original');
--> statement-breakpoint
CREATE TYPE "public"."webflow_filename_mode" AS ENUM('keep', 'suggestion');
--> statement-breakpoint
CREATE TYPE "public"."webflow_publish_job_status" AS ENUM('queued', 'leased', 'validating', 'creating_asset', 'uploading_asset', 'verifying_asset', 'updating_cms_item', 'verifying_cms_item', 'completed', 'partially_completed', 'failed', 'cancelled', 'stale');
--> statement-breakpoint
CREATE TYPE "public"."webflow_media_publish_status" AS ENUM('active', 'stale', 'disconnected');
--> statement-breakpoint
CREATE TYPE "public"."webflow_bulk_job_status" AS ENUM('queued', 'running', 'completed', 'partially_completed', 'failed', 'cancelled');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webflow_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"name" text NOT NULL,
	"auth_type" text DEFAULT 'site_token' NOT NULL,
	"status" "webflow_connection_status" DEFAULT 'pending' NOT NULL,
	"access_token_ciphertext" text NOT NULL,
	"access_token_nonce" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"remote_site_id" text,
	"remote_site_name_safe" text,
	"remote_site_hostname_safe" text,
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
ALTER TABLE "webflow_connections" ADD CONSTRAINT "webflow_connections_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_connections_workspace_status_idx" ON "webflow_connections" USING btree ("workspace_type","workspace_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_connections_site_idx" ON "webflow_connections" USING btree ("remote_site_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webflow_field_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"collection_name_safe" text,
	"mapping_version" integer DEFAULT 1 NOT NULL,
	"image_field_id" text NOT NULL,
	"image_field_slug" text,
	"alt_field_id" text,
	"alt_field_slug" text,
	"title_field_id" text,
	"title_field_slug" text,
	"caption_field_id" text,
	"caption_field_slug" text,
	"description_field_id" text,
	"description_field_slug" text,
	"stale_at" timestamp,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webflow_field_mappings" ADD CONSTRAINT "webflow_field_mappings_connection_id_webflow_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."webflow_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_field_mappings" ADD CONSTRAINT "webflow_field_mappings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webflow_field_mappings_connection_collection_uidx" ON "webflow_field_mappings" USING btree ("connection_id","collection_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webflow_bulk_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"field_mapping_id" text NOT NULL,
	"status" "webflow_bulk_job_status" DEFAULT 'queued' NOT NULL,
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
ALTER TABLE "webflow_bulk_jobs" ADD CONSTRAINT "webflow_bulk_jobs_connection_id_webflow_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."webflow_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_bulk_jobs" ADD CONSTRAINT "webflow_bulk_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_bulk_jobs" ADD CONSTRAINT "webflow_bulk_jobs_field_mapping_id_webflow_field_mappings_id_fk" FOREIGN KEY ("field_mapping_id") REFERENCES "public"."webflow_field_mappings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_bulk_jobs" ADD CONSTRAINT "webflow_bulk_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_bulk_jobs_connection_idx" ON "webflow_bulk_jobs" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_bulk_jobs_project_idx" ON "webflow_bulk_jobs" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_bulk_jobs_status_idx" ON "webflow_bulk_jobs" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webflow_publish_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"image_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"cms_item_id" text NOT NULL,
	"cms_item_name_safe" text,
	"field_mapping_id" text NOT NULL,
	"mapping_version" integer NOT NULL,
	"source_type" "webflow_publish_source_type" DEFAULT 'derivative' NOT NULL,
	"derivative_id" text,
	"source_storage_key" text NOT NULL,
	"source_revision_key" text NOT NULL,
	"metadata_approval_id" text NOT NULL,
	"metadata_language" "metadata_language" NOT NULL,
	"filename_mode" "webflow_filename_mode" DEFAULT 'keep' NOT NULL,
	"requested_filename" text NOT NULL,
	"status" "webflow_publish_job_status" DEFAULT 'queued' NOT NULL,
	"remote_asset_id" text,
	"remote_asset_url_safe" text,
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
ALTER TABLE "webflow_publish_jobs" ADD CONSTRAINT "webflow_publish_jobs_connection_id_webflow_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."webflow_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_publish_jobs" ADD CONSTRAINT "webflow_publish_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_publish_jobs" ADD CONSTRAINT "webflow_publish_jobs_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_publish_jobs" ADD CONSTRAINT "webflow_publish_jobs_field_mapping_id_webflow_field_mappings_id_fk" FOREIGN KEY ("field_mapping_id") REFERENCES "public"."webflow_field_mappings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_publish_jobs" ADD CONSTRAINT "webflow_publish_jobs_bulk_parent_id_webflow_bulk_jobs_id_fk" FOREIGN KEY ("bulk_parent_id") REFERENCES "public"."webflow_bulk_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_publish_jobs_claim_idx" ON "webflow_publish_jobs" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_publish_jobs_connection_idx" ON "webflow_publish_jobs" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_publish_jobs_project_idx" ON "webflow_publish_jobs" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_publish_jobs_cms_item_idx" ON "webflow_publish_jobs" USING btree ("cms_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_publish_jobs_lease_expires_at_idx" ON "webflow_publish_jobs" USING btree ("lease_expires_at") WHERE "webflow_publish_jobs"."lease_expires_at" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webflow_publish_jobs_idempotency_key_idx" ON "webflow_publish_jobs" USING btree ("idempotency_key") WHERE "webflow_publish_jobs"."idempotency_key" is not null;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webflow_media_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"image_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"publish_job_id" text,
	"collection_id" text NOT NULL,
	"cms_item_id" text NOT NULL,
	"field_mapping_id" text NOT NULL,
	"mapping_version" integer NOT NULL,
	"source_storage_key" text NOT NULL,
	"derivative_id" text,
	"metadata_approval_id" text NOT NULL,
	"remote_asset_id" text NOT NULL,
	"remote_asset_url_safe" text NOT NULL,
	"remote_filename" text NOT NULL,
	"remote_mime_type" text NOT NULL,
	"remote_width" integer,
	"remote_height" integer,
	"publish_status" "webflow_media_publish_status" DEFAULT 'active' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"last_verified_at" timestamp,
	"stale_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webflow_media_mappings" ADD CONSTRAINT "webflow_media_mappings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_media_mappings" ADD CONSTRAINT "webflow_media_mappings_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_media_mappings" ADD CONSTRAINT "webflow_media_mappings_connection_id_webflow_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."webflow_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_media_mappings" ADD CONSTRAINT "webflow_media_mappings_publish_job_id_webflow_publish_jobs_id_fk" FOREIGN KEY ("publish_job_id") REFERENCES "public"."webflow_publish_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webflow_media_mappings" ADD CONSTRAINT "webflow_media_mappings_field_mapping_id_webflow_field_mappings_id_fk" FOREIGN KEY ("field_mapping_id") REFERENCES "public"."webflow_field_mappings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_media_mappings_project_idx" ON "webflow_media_mappings" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_media_mappings_image_idx" ON "webflow_media_mappings" USING btree ("image_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_media_mappings_connection_idx" ON "webflow_media_mappings" USING btree ("connection_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webflow_media_mappings_cms_item_idx" ON "webflow_media_mappings" USING btree ("cms_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webflow_media_mappings_identity_uidx" ON "webflow_media_mappings" USING btree ("connection_id","collection_id","cms_item_id","image_id","source_storage_key",(coalesce("derivative_id", 'original')),"metadata_approval_id","mapping_version");
