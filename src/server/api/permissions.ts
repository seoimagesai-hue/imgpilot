/**
 * Prompt 25 — who may manage API keys / webhooks for a workspace.
 * Personal workspace: only the owning user (workspaceId === userId).
 * Organization workspace: active owner|admin membership only.
 */
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {organizations, users, type ApiWorkspaceType} from "@/db/schema";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {ApiError} from "@/server/api/errors";

export async function canManageIntegrations(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "integrations.manage");
}

export async function canViewIntegrations(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  if (workspaceType === "personal") {
    return workspaceId === userId;
  }
  const membership = await resolveActiveMembership(userId, workspaceId);
  if (!membership) return false;
  return hasOrgPermission(membership.role, "integrations.view");
}

export async function requireManageIntegrations(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canManageIntegrations(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new ApiError("FORBIDDEN", "You do not have permission to manage integrations for this workspace.");
  }
}

export async function requireViewIntegrations(
  userId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  const allowed = await canViewIntegrations(userId, workspaceType, workspaceId);
  if (!allowed) {
    throw new ApiError("FORBIDDEN", "You do not have permission to view integrations for this workspace.");
  }
}

/**
 * Entitlement flows through the billing owner: personal workspace → the user
 * themself; organization workspace → the org's billingOwnerUserId.
 */
export async function resolveWorkspaceEntitlementUserId(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<string | null> {
  if (workspaceType === "personal") return workspaceId;
  const db = getDb();
  const [org] = await db
    .select({billingOwnerUserId: organizations.billingOwnerUserId})
    .from(organizations)
    .where(eq(organizations.id, workspaceId))
    .limit(1);
  return org?.billingOwnerUserId ?? null;
}

/** Prompt 25: personal → user accountStatus active; organization → not archived. */
export async function isWorkspaceActive(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<boolean> {
  const db = getDb();
  if (workspaceType === "personal") {
    const [user] = await db
      .select({accountStatus: users.accountStatus})
      .from(users)
      .where(eq(users.id, workspaceId))
      .limit(1);
    return Boolean(user) && user.accountStatus === "active";
  }
  const [org] = await db
    .select({status: organizations.status})
    .from(organizations)
    .where(eq(organizations.id, workspaceId))
    .limit(1);
  return Boolean(org) && org.status !== "archived";
}
