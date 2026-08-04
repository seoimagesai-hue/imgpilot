/**
 * Prompt 29 — who may view/publish Cloudinary connections for a workspace.
 * Personal workspace: only the owning user (workspaceId === userId).
 * Organization workspace: `cloudinary.view` (owner/admin/editor/viewer) or
 * `cloudinary.publish` (owner/admin/editor) membership permissions.
 * Connection *management* (create/rotate/disable credentials) intentionally
 * stays gated on `integrations.manage` — see `src/server/api/permissions.ts`.
 */
import type {ApiWorkspaceType} from "@/db/schema";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {CloudinaryError} from "@/server/cloudinary/errors";

export async function canViewCloudinary(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "cloudinary.view");
}

export async function canPublishCloudinary(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "cloudinary.publish");
}

export async function requireViewCloudinary(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canViewCloudinary(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new CloudinaryError(
      "FORBIDDEN",
      "You do not have permission to view Cloudinary connections for this workspace.",
    );
  }
}

export async function requirePublishCloudinary(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canPublishCloudinary(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new CloudinaryError("FORBIDDEN", "You do not have permission to publish to Cloudinary for this workspace.");
  }
}
