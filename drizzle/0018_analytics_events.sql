-- Prompt 20: analytics events. Additive only.

CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"image_id" text,
	"event_type" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"safe_metadata" text,
	"backfilled" boolean DEFAULT false NOT NULL,
	"idempotency_key" text,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_project_occurred_idx" ON "analytics_events" USING btree ("project_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_user_occurred_idx" ON "analytics_events" USING btree ("user_id","occurred_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_events_idempotency_key_idx" ON "analytics_events" USING btree ("idempotency_key") WHERE "analytics_events"."idempotency_key" is not null;
