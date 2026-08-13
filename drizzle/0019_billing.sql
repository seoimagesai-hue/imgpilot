-- Prompt 21: Stripe billing. Additive only.

CREATE TABLE IF NOT EXISTS "billing_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "billing_accounts_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "billing_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"billing_account_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"plan_code" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'inactive' NOT NULL,
	"billing_interval" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancel_at" timestamp,
	"cancelled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"ended_at" timestamp,
	"latest_invoice_status" text,
	"last_stripe_event_created_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billing_account_id_billing_accounts_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_subscriptions_user_id_idx" ON "billing_subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_subscriptions_status_idx" ON "billing_subscriptions" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "billing_entitlement_snapshots" (
	"user_id" text PRIMARY KEY NOT NULL,
	"plan_code" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'inactive' NOT NULL,
	"entitlement_state" text DEFAULT 'enabled' NOT NULL,
	"billing_interval" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"grace_period_ends_at" timestamp,
	"max_projects" integer NOT NULL,
	"max_images_per_project" integer NOT NULL,
	"max_original_storage_bytes" bigint NOT NULL,
	"max_generated_storage_bytes" bigint NOT NULL,
	"monthly_processing_limit" integer NOT NULL,
	"monthly_ai_limit" integer NOT NULL,
	"monthly_export_limit" integer NOT NULL,
	"bulk_processing_enabled" boolean DEFAULT true NOT NULL,
	"ai_metadata_enabled" boolean DEFAULT true NOT NULL,
	"export_enabled" boolean DEFAULT true NOT NULL,
	"cms_export_enabled" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_entitlement_snapshots" ADD CONSTRAINT "billing_entitlement_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_created_at" timestamp NOT NULL,
	"livemode" boolean DEFAULT false NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp,
	"failure_code" text,
	"failure_message_safe" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stripe_events_status_idx" ON "stripe_events" USING btree ("processing_status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "billing_usage_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"category" text NOT NULL,
	"entity_id" text,
	"idempotency_key" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'recorded' NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"reversed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_usage_ledger" ADD CONSTRAINT "billing_usage_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "billing_usage_ledger_idempotency_key_idx" ON "billing_usage_ledger" USING btree ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_usage_ledger_user_period_category_idx" ON "billing_usage_ledger" USING btree ("user_id","period_start","category");
