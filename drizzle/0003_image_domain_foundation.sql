-- Image upload domain foundation.
-- Intentionally recreates only the empty/early `images` table to align statuses and fields.
-- Does NOT drop or alter auth tables or `projects`.
-- No durable uploaded objects exist yet in this milestone phase.

DROP TABLE IF EXISTS "images";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."image_status";--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('pending_upload', 'uploaded', 'upload_failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('r2');--> statement-breakpoint
CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"original_filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"storage_provider" "storage_provider" DEFAULT 'r2' NOT NULL,
	"mime_type" text NOT NULL,
	"file_extension" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"status" "image_status" DEFAULT 'pending_upload' NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"uploaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "images_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_project_id_idx" ON "images" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "images_project_status_idx" ON "images" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "images_project_created_idx" ON "images" USING btree ("project_id","created_at");
