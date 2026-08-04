/**
 * Prompt 28 — who may view/publish Webflow connections for a workspace.
 * Personal workspace: only the owning user (workspaceId === userId).
 * Organization workspace: `webflow.view` (owner/admin/editor/viewer) or
 * `webflow.publish` (owner/admin/editor) membership permissions.
 * Connection *management* (create/rotate/disable credentials, field
 * mappings) intentionally stays gated on `integrations.manage` — see
 * `src/server/api/permissions.ts`.
 */
import type {ApiWorkspaceType} from "@/db/schema";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {WebflowError} from "@/server/webflow/errors";

export async function canViewWebflow(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "webflow.view");
}

export async function canPublishWebflow(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "webflow.publish");
}

export async function requireViewWebflow(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canViewWebflow(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new WebflowError("FORBIDDEN", "You do not have permission to view Webflow connections for this workspace.");
  }
}

export async function requirePublishWebflow(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canPublishWebflow(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new WebflowError("FORBIDDEN", "You do not have permission to publish to Webflow for this workspace.");
  }
}
