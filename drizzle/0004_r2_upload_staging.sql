-- Non-destructive: add staged-upload confirmation fields for private R2 flow.
-- Does not drop auth, projects, or images tables.

ALTER TABLE "images" ADD COLUMN "upload_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "etag" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "storage_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "storage_content_type" text;--> statement-breakpoint
CREATE INDEX "images_upload_expires_at_idx" ON "images" USING btree ("upload_expires_at");
