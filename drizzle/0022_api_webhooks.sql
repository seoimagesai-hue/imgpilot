-- Prompt 25: public API keys & outbound webhooks. Additive only.

CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked', 'expired', 'rotated');
--> statement-breakpoint
CREATE TYPE "public"."api_workspace_type" AS ENUM('personal', 'organization');
--> statement-breakpoint
CREATE TYPE "public"."webhook_endpoint_status" AS ENUM('pending_verification', 'active', 'failing', 'disabled', 'deleted');
--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_status" AS ENUM('queued', 'delivering', 'succeeded', 'failed', 'retry_scheduled', 'exhausted', 'cancelled');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"name" text NOT NULL,
	"environment" text NOT NULL,
	"public_prefix" text NOT NULL,
	"secret_hash" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"last_used_ip_hash" text,
	"last_used_user_agent_summary" text,
	"request_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_user_id" text,
	"rotated_from_key_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_public_prefix_uidx" ON "api_keys" USING btree ("public_prefix");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_workspace_status_idx" ON "api_keys" USING btree ("workspace_type","workspace_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_created_by_idx" ON "api_keys" USING btree ("created_by_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "api_idempotency_records" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"route_key" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_idempotency_records" ADD CONSTRAINT "api_idempotency_records_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_idempotency_uidx" ON "api_idempotency_records" USING btree ("api_key_id","route_key","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_idempotency_expires_idx" ON "api_idempotency_records" USING btree ("expires_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "api_rate_limit_buckets" (
	"id" text PRIMARY KEY NOT NULL,
	"bucket_key" text NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_rate_limit_buckets_key_uidx" ON "api_rate_limit_buckets" USING btree ("bucket_key");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "api_usage_counters" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"api_key_id" text,
	"period_yyyy_mm" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_usage_counters_uidx" ON "api_usage_counters" USING btree ("workspace_type","workspace_id","api_key_id","period_yyyy_mm","category");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"status" "webhook_endpoint_status" DEFAULT 'pending_verification' NOT NULL,
	"secret_ciphertext" text NOT NULL,
	"secret_nonce" text NOT NULL,
	"subscribed_events" jsonb NOT NULL,
	"verification_token_hash" text,
	"verified_at" timestamp,
	"disabled_at" timestamp,
	"deleted_at" timestamp,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_delivery_at" timestamp,
	"last_delivery_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_endpoints_workspace_status_idx" ON "webhook_endpoints" USING btree ("workspace_type","workspace_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"event_version" text DEFAULT '1' NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"deduplication_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_dedupe_uidx" ON "webhook_events" USING btree ("workspace_type","workspace_id","deduplication_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_workspace_created_idx" ON "webhook_events" USING btree ("workspace_type","workspace_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_event_id" text NOT NULL,
	"endpoint_id" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "webhook_delivery_status" DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"response_status" integer,
	"response_duration_ms" integer,
	"safe_failure_code" text,
	"next_attempt_at" timestamp,
	"lease_owner" text,
	"lease_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_claim_idx" ON "webhook_deliveries" USING btree ("status","scheduled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_endpoint_created_idx" ON "webhook_deliveries" USING btree ("endpoint_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_event_idx" ON "webhook_deliveries" USING btree ("webhook_event_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "integration_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_type" "api_workspace_type" NOT NULL,
	"workspace_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text,
	"before_summary" text,
	"after_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_audit_workspace_created_idx" ON "integration_audit_logs" USING btree ("workspace_type","workspace_id","created_at");
