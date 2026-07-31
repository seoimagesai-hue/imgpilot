CREATE TYPE "public"."image_status" AS ENUM('uploaded', 'processing', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"original_filename" text NOT NULL,
	"stored_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"storage_key" text NOT NULL,
	"status" "image_status" DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "images_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_project_id_idx" ON "images" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "images_project_created_idx" ON "images" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "images_project_status_idx" ON "images" USING btree ("project_id","status");