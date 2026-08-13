-- Prompt 24: organization workspaces. Additive only.

CREATE TYPE "public"."workspace_type" AS ENUM('personal', 'organization');
--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'archived', 'restricted');
--> statement-breakpoint
CREATE TYPE "public"."organization_member_role" AS ENUM('owner', 'admin', 'editor', 'viewer');
--> statement-breakpoint
CREATE TYPE "public"."organization_member_status" AS ENUM('active', 'removed');
--> statement-breakpoint
CREATE TYPE "public"."organization_invitation_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');
--> statement-breakpoint
CREATE TYPE "public"."organization_invite_role" AS ENUM('admin', 'editor', 'viewer');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"primary_owner_user_id" text NOT NULL,
	"billing_owner_user_id" text NOT NULL,
	"billing_owner_assigned_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_primary_owner_user_id_users_id_fk" FOREIGN KEY ("primary_owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_billing_owner_user_id_users_id_fk" FOREIGN KEY ("billing_owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_uidx" ON "organizations" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_billing_owner_idx" ON "organizations" USING btree ("billing_owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "organization_member_role" NOT NULL,
	"status" "organization_member_status" DEFAULT 'active' NOT NULL,
	"invited_by_user_id" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_members_user_status_idx" ON "organization_members" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_members_org_status_idx" ON "organization_members" USING btree ("organization_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organization_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email_normalized" text NOT NULL,
	"role" "organization_invite_role" NOT NULL,
	"token_hash" text NOT NULL,
	"status" "organization_invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by_user_id" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitations_token_hash_uidx" ON "organization_invitations" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_invitations_org_email_status_idx" ON "organization_invitations" USING btree ("organization_id","email_normalized","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_invitations_expires_idx" ON "organization_invitations" USING btree ("expires_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organization_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text,
	"before_summary" text,
	"after_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_audit_logs" ADD CONSTRAINT "organization_audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_audit_logs" ADD CONSTRAINT "organization_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_audit_logs_org_created_idx" ON "organization_audit_logs" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_audit_logs_actor_created_idx" ON "organization_audit_logs" USING btree ("actor_user_id","created_at");
--> statement-breakpoint

ALTER TABLE "projects" ADD COLUMN "workspace_type" "workspace_type" DEFAULT 'personal' NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "organization_id" text;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by_user_id" text;
--> statement-breakpoint
UPDATE "projects" SET "created_by_user_id" = "user_id" WHERE "created_by_user_id" is null;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_by_user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_organization_status_idx" ON "projects" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_workspace_user_idx" ON "projects" USING btree ("workspace_type","user_id");
