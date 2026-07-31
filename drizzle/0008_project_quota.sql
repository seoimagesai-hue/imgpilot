-- Prompt 10: project quota core — additive counters and reservations.
-- Does not call R2. Backfill sets inconsistency_flag = true for reconciliation.

DO $$ BEGIN
  CREATE TYPE "quota_reservation_kind" AS ENUM ('new_upload', 'replacement_upload');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "quota_reservation_status" AS ENUM (
    'reserved',
    'consumed',
    'released',
    'expired',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_quota_state" (
  "project_id" text PRIMARY KEY NOT NULL,
  "active_image_count" integer DEFAULT 0 NOT NULL,
  "reserved_image_slots" integer DEFAULT 0 NOT NULL,
  "active_original_bytes" bigint DEFAULT 0 NOT NULL,
  "reserved_upload_bytes" bigint DEFAULT 0 NOT NULL,
  "replacement_candidate_bytes" bigint DEFAULT 0 NOT NULL,
  "cleanup_pending_bytes" bigint DEFAULT 0 NOT NULL,
  "quota_version" integer DEFAULT 0 NOT NULL,
  "last_reconciled_at" timestamp,
  "inconsistency_flag" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "project_quota_state_active_image_count_nonneg" CHECK ("active_image_count" >= 0),
  CONSTRAINT "project_quota_state_reserved_image_slots_nonneg" CHECK ("reserved_image_slots" >= 0),
  CONSTRAINT "project_quota_state_active_original_bytes_nonneg" CHECK ("active_original_bytes" >= 0),
  CONSTRAINT "project_quota_state_reserved_upload_bytes_nonneg" CHECK ("reserved_upload_bytes" >= 0),
  CONSTRAINT "project_quota_state_replacement_candidate_bytes_nonneg" CHECK ("replacement_candidate_bytes" >= 0),
  CONSTRAINT "project_quota_state_cleanup_pending_bytes_nonneg" CHECK ("cleanup_pending_bytes" >= 0)
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_quota_state"
    ADD CONSTRAINT "project_quota_state_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quota_reservations" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "image_id" text,
  "replacement_id" text,
  "kind" "quota_reservation_kind" NOT NULL,
  "status" "quota_reservation_status" DEFAULT 'reserved' NOT NULL,
  "declared_bytes" bigint NOT NULL,
  "trusted_confirmed_bytes" bigint,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "released_at" timestamp,
  "idempotency_key" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "quota_reservations_declared_bytes_nonneg" CHECK ("declared_bytes" >= 0)
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quota_reservations"
    ADD CONSTRAINT "quota_reservations_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quota_reservations"
    ADD CONSTRAINT "quota_reservations_image_id_images_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quota_reservations"
    ADD CONSTRAINT "quota_reservations_replacement_id_image_replacements_id_fk"
    FOREIGN KEY ("replacement_id") REFERENCES "public"."image_replacements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_reservations_project_id_idx" ON "quota_reservations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_reservations_status_idx" ON "quota_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_reservations_expires_at_idx" ON "quota_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quota_reservations_idempotency_key_idx" ON "quota_reservations" USING btree ("idempotency_key") WHERE "idempotency_key" is not null;--> statement-breakpoint
ALTER TABLE "image_replacements" ADD COLUMN IF NOT EXISTS "old_byte_size" integer;--> statement-breakpoint
INSERT INTO "project_quota_state" ("project_id", "inconsistency_flag")
SELECT "id", true FROM "projects"
ON CONFLICT ("project_id") DO NOTHING;--> statement-breakpoint
UPDATE "project_quota_state" AS pqs
SET
  "active_image_count" = COALESCE((
    SELECT count(*)::int
    FROM "images" i
    WHERE i.project_id = pqs.project_id
      AND i.deleted_at IS NULL
      AND i.status NOT IN (
        'deletion_pending', 'storage_deleting', 'deletion_failed',
        'deleted', 'pending_upload', 'upload_failed'
      )
  ), 0),
  "reserved_image_slots" = COALESCE((
    SELECT count(*)::int
    FROM "images" i
    WHERE i.project_id = pqs.project_id
      AND i.status = 'pending_upload'
      AND (i.upload_expires_at IS NULL OR i.upload_expires_at > now())
  ), 0),
  "active_original_bytes" = COALESCE((
    SELECT sum(coalesce(i.storage_size_bytes, i.size_bytes))::bigint
    FROM "images" i
    WHERE i.project_id = pqs.project_id
      AND i.deleted_at IS NULL
      AND i.status NOT IN (
        'deletion_pending', 'storage_deleting', 'deletion_failed',
        'deleted', 'pending_upload', 'upload_failed'
      )
  ), 0),
  "reserved_upload_bytes" = COALESCE((
    SELECT sum(i.size_bytes)::bigint
    FROM "images" i
    WHERE i.project_id = pqs.project_id
      AND i.status = 'pending_upload'
      AND (i.upload_expires_at IS NULL OR i.upload_expires_at > now())
  ), 0) + COALESCE((
    SELECT sum(r.new_declared_size_bytes)::bigint
    FROM "image_replacements" r
    WHERE r.project_id = pqs.project_id
      AND r.status IN ('pending', 'uploading')
      AND (r.upload_expires_at IS NULL OR r.upload_expires_at > now())
  ), 0),
  "replacement_candidate_bytes" = GREATEST(0, COALESCE((
    SELECT sum(
      CASE
        WHEN r.status IN ('uploaded', 'validating', 'validated', 'promotion_pending', 'failed')
        THEN coalesce(r.new_byte_size, r.new_declared_size_bytes)
        ELSE 0
      END
    )::bigint
    FROM "image_replacements" r
    WHERE r.project_id = pqs.project_id
  ), 0)),
  "cleanup_pending_bytes" = COALESCE((
    SELECT sum(coalesce(i.storage_size_bytes, i.size_bytes))::bigint
    FROM "images" i
    WHERE i.project_id = pqs.project_id
      AND i.status IN ('deletion_pending', 'storage_deleting', 'deletion_failed')
  ), 0) + COALESCE((
    SELECT sum(coalesce(r.new_byte_size, r.new_declared_size_bytes))::bigint
    FROM "image_replacements" r
    WHERE r.project_id = pqs.project_id
      AND r.status IN ('promoted', 'old_storage_deleting', 'old_storage_cleanup_failed')
  ), 0),
  "inconsistency_flag" = true,
  "updated_at" = now();
