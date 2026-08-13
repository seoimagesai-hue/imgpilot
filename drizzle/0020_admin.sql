-- Prompt 22: admin role + audit/support notes. Additive only.

CREATE TYPE "public"."user_role" AS ENUM('user', 'super_admin');
--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended');
--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" "account_status" DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_at" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_by" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspension_reason" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_account_status_idx" ON "users" USING btree ("account_status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text,
	"reason" text,
	"before_summary" text,
	"after_summary" text,
	"correlation_id" text,
	"request_meta_safe" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_admin_created_idx" ON "admin_audit_logs" USING btree ("admin_user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_target_created_idx" ON "admin_audit_logs" USING btree ("target_entity_type","target_entity_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_idx" ON "admin_audit_logs" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admin_support_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_support_notes" ADD CONSTRAINT "admin_support_notes_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_support_notes_target_created_idx" ON "admin_support_notes" USING btree ("target_entity_type","target_entity_id","created_at");
