import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  organizationMembers,
  organizations,
  projects,
  type Organization,
  type OrganizationMemberRole,
  type Project,
} from "@/db/schema";
import {hasOrgPermission, type OrgPermission} from "@/server/organizations/permissions";

export type ActiveMembership = {
  role: OrganizationMemberRole;
  organization: Organization;
};

export async function resolveActiveMembership(
  userId: string,
  organizationId: string,
): Promise<ActiveMembership | null> {
  const db = getDb();
  const [row] = await db
    .select({
      role: organizationMembers.role,
      organization: organizations,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {role: row.role, organization: row.organization};
}

export async function resolveEntitlementUserIdForProject(project: Project): Promise<string> {
  if (project.workspaceType === "personal" || !project.organizationId) {
    return project.userId;
  }
  const db = getDb();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, project.organizationId))
    .limit(1);
  return org?.billingOwnerUserId ?? project.userId;
}

export async function getAccessibleProject(
  userId: string,
  projectId: string,
  permission: OrgPermission = "projects.view",
): Promise<Project | null> {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return null;

  if (project.workspaceType === "personal" || !project.organizationId) {
    return project.userId === userId ? project : null;
  }

  const membership = await resolveActiveMembership(userId, project.organizationId);
  if (!membership) return null;
  if (!hasOrgPermission(membership.role, permission)) return null;
  return project;
}

export async function requireOrgPermission(
  userId: string,
  organizationId: string,
  permission: OrgPermission,
): Promise<ActiveMembership> {
  const membership = await resolveActiveMembership(userId, organizationId);
  if (!membership || !hasOrgPermission(membership.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return membership;
}
