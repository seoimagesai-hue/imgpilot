ALTER TABLE "guest_jobs" ADD COLUMN IF NOT EXISTS "options" jsonb;--> statement-breakpoint
ALTER TABLE "guest_jobs" ADD COLUMN IF NOT EXISTS "result_summary" jsonb;
