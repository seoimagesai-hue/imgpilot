-- Non-destructive: support owner-scoped filename listing/search.
CREATE INDEX IF NOT EXISTS "images_project_filename_idx" ON "images" USING btree ("project_id", "original_filename");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "images_project_size_idx" ON "images" USING btree ("project_id", "size_bytes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "images_project_validated_at_idx" ON "images" USING btree ("project_id", "validated_at");
