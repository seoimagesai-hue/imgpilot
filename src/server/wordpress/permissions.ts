/**
 * Prompt 26 — who may view/publish WordPress connections for a workspace.
 * Personal workspace: only the owning user (workspaceId === userId).
 * Organization workspace: `wordpress.view` (owner/admin/editor/viewer) or
 * `wordpress.publish` (owner/admin/editor) membership permissions.
 * Connection *management* (create/rotate/disable credentials) intentionally
 * stays gated on `integrations.manage` — see `src/server/api/permissions.ts`.
 */
import type {ApiWorkspaceType} from "@/db/schema";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {WordPressError} from "@/server/wordpress/errors";

export async function canViewWordpress(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "wordpress.view");
}

export async function canPublishWordpress(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "wordpress.publish");
}

export async function requireViewWordpress(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canViewWordpress(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new WordPressError("FORBIDDEN", "You do not have permission to view WordPress connections for this workspace.");
  }
}

export async function requirePublishWordpress(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canPublishWordpress(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new WordPressError("FORBIDDEN", "You do not have permission to publish to WordPress for this workspace.");
  }
}
