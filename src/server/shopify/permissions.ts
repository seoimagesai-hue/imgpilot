/**
 * Prompt 27 — who may view/publish Shopify connections for a workspace.
 * Personal workspace: only the owning user (workspaceId === userId).
 * Organization workspace: `shopify.view` (owner/admin/editor/viewer) or
 * `shopify.publish` (owner/admin/editor) membership permissions.
 * Connection *management* (create/rotate/disable credentials) intentionally
 * stays gated on `integrations.manage` — see `src/server/api/permissions.ts`.
 */
import type {ApiWorkspaceType} from "@/db/schema";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {ShopifyError} from "@/server/shopify/errors";

export async function canViewShopify(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "shopify.view");
}

export async function canPublishShopify(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "shopify.publish");
}

export async function requireViewShopify(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canViewShopify(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new ShopifyError("FORBIDDEN", "You do not have permission to view Shopify connections for this workspace.");
  }
}

export async function requirePublishShopify(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canPublishShopify(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new ShopifyError("FORBIDDEN", "You do not have permission to publish to Shopify for this workspace.");
  }
}
