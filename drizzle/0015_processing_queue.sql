-- Prompt 16: background queue leasing on processing_jobs. Additive only.

ALTER TABLE "processing_jobs"
  ADD COLUMN IF NOT EXISTS "lease_owner" text,
  ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "heartbeat_at" timestamp;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "processing_jobs_queue_claim_idx"
  ON "processing_jobs" ("status", "created_at");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "processing_jobs_lease_expires_at_idx"
  ON "processing_jobs" ("lease_expires_at")
  WHERE "lease_expires_at" is not null;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "worker_heartbeats" (
  "worker_id" text PRIMARY KEY NOT NULL,
  "hostname" text,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "last_heartbeat_at" timestamp DEFAULT now() NOT NULL,
  "status" text DEFAULT 'running' NOT NULL,
  "jobs_claimed" integer DEFAULT 0 NOT NULL,
  "jobs_completed" integer DEFAULT 0 NOT NULL,
  "jobs_failed" integer DEFAULT 0 NOT NULL,
  "in_flight" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
