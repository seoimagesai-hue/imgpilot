import {and, desc, eq, inArray, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {organizationMembers, projects, type Project} from "@/db/schema";
import {
  PROJECT_LIST_LIMIT,
  type CreateProjectInput,
  type ProjectFilter,
  type UpdateProjectInput,
} from "./validation";
import {getAccessibleProject} from "@/server/organizations/access";
import type {OrgPermission} from "@/server/organizations/permissions";
import {writeOrganizationAudit} from "@/server/organizations/audit";
import {requireOrgPermission} from "@/server/organizations/access";
import {getProjectQuotaLimitsForUser} from "@/server/billing/entitlements";

/** Personal projects only (workspace_type=personal). */
export async function listPersonalProjectsForUser(
  userId: string,
  filter: ProjectFilter,
): Promise<Project[]> {
  const db = getDb();
  const conditions = [
    eq(projects.userId, userId),
    eq(projects.workspaceType, "personal"),
  ];
  if (filter === "active") conditions.push(eq(projects.status, "active"));
  if (filter === "archived") conditions.push(eq(projects.status, "archived"));

  return db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.updatedAt))
    .limit(PROJECT_LIST_LIMIT);
}

/** @deprecated Prefer listPersonalProjectsForUser or listOrganizationProjects */
export async function listProjectsForUser(userId: string, filter: ProjectFilter): Promise<Project[]> {
  return listPersonalProjectsForUser(userId, filter);
}

export async function listOrganizationProjects(
  organizationId: string,
  filter: ProjectFilter,
): Promise<Project[]> {
  const db = getDb();
  const conditions = [
    eq(projects.organizationId, organizationId),
    eq(projects.workspaceType, "organization"),
  ];
  if (filter === "active") conditions.push(eq(projects.status, "active"));
  if (filter === "archived") conditions.push(eq(projects.status, "archived"));

  return db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.updatedAt))
    .limit(PROJECT_LIST_LIMIT);
}

export async function countProjectsForUser(userId: string, filter: ProjectFilter = "active") {
  const db = getDb();
  const conditions = [
    eq(projects.userId, userId),
    eq(projects.workspaceType, "personal"),
  ];
  if (filter === "active") conditions.push(eq(projects.status, "active"));
  if (filter === "archived") conditions.push(eq(projects.status, "archived"));
  if (filter === "all") {
    // count all personal
  }

  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(projects)
    .where(and(...conditions));
  return row?.count ?? 0;
}

export async function countOrganizationProjects(
  organizationId: string,
  filter: ProjectFilter = "all",
) {
  const db = getDb();
  const conditions = [
    eq(projects.organizationId, organizationId),
    eq(projects.workspaceType, "organization"),
  ];
  if (filter === "active") conditions.push(eq(projects.status, "active"));
  if (filter === "archived") conditions.push(eq(projects.status, "archived"));

  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(projects)
    .where(and(...conditions));
  return row?.count ?? 0;
}

/**
 * Accessible project lookup (personal owner OR org membership + permission).
 * Default permission is projects.view. Write paths must pass a write permission.
 */
export async function getOwnedProject(
  userId: string,
  projectId: string,
  permission: OrgPermission = "projects.view",
): Promise<Project | null> {
  return getAccessibleProject(userId, projectId, permission);
}

export async function createOwnedProject(
  userId: string,
  input: CreateProjectInput,
  options?: {organizationId?: string},
): Promise<Project> {
  const organizationId = options?.organizationId;

  if (organizationId) {
    await requireOrgPermission(userId, organizationId, "projects.create");
    const {resolveActiveMembership} = await import("@/server/organizations/access");
    const access = await resolveActiveMembership(userId, organizationId);
    if (!access || access.organization.status !== "active") {
      throw new Error("projectLimitReached");
    }
    const limits = await getProjectQuotaLimitsForUser(access.organization.billingOwnerUserId);
    if (!limits.writesAllowed) throw new Error("projectLimitReached");
    const total = await countOrganizationProjects(organizationId, "all");
    if (total >= limits.maxProjects) throw new Error("projectLimitReached");

    const db = getDb();
    const [created] = await db
      .insert(projects)
      .values({
        userId,
        createdByUserId: userId,
        workspaceType: "organization",
        organizationId,
        name: input.name,
        websiteUrl: input.websiteUrl,
        description: input.description,
        metadataLanguage: input.metadataLanguage,
        status: "active",
      })
      .returning();
    if (!created) throw new Error("createFailed");

    await writeOrganizationAudit({
      organizationId,
      actorUserId: userId,
      action: "project.created",
      targetEntityType: "project",
      targetEntityId: created.id,
      afterSummary: created.name.slice(0, 120),
    });

    const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
    recordAnalyticsEventSafe({
      userId,
      projectId: created.id,
      eventType: "project_created",
      entityType: "project",
      entityId: created.id,
      idempotencyKey: `project_created:${created.id}`,
      safeMetadata: {name: created.name.slice(0, 120), workspace: "organization"},
    });
    return created;
  }

  const limits = await getProjectQuotaLimitsForUser(userId);
  if (!limits.writesAllowed) {
    throw new Error("projectLimitReached");
  }
  const total = await countProjectsForUser(userId, "all");
  if (total >= limits.maxProjects) {
    throw new Error("projectLimitReached");
  }

  const db = getDb();
  const [created] = await db
    .insert(projects)
    .values({
      userId,
      createdByUserId: userId,
      workspaceType: "personal",
      organizationId: null,
      name: input.name,
      websiteUrl: input.websiteUrl,
      description: input.description,
      metadataLanguage: input.metadataLanguage,
      status: "active",
    })
    .returning();
  if (!created) {
    throw new Error("createFailed");
  }
  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId,
    projectId: created.id,
    eventType: "project_created",
    entityType: "project",
    entityId: created.id,
    idempotencyKey: `project_created:${created.id}`,
    safeMetadata: {name: created.name.slice(0, 120)},
  });
  return created;
}

export async function updateOwnedProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const project = await getAccessibleProject(userId, projectId, "projects.edit");
  if (!project) return null;
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      name: input.name,
      websiteUrl: input.websiteUrl,
      description: input.description,
      metadataLanguage: input.metadataLanguage,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();
  return updated ?? null;
}

export async function archiveOwnedProject(userId: string, projectId: string): Promise<Project | null> {
  const project = await getAccessibleProject(userId, projectId, "projects.edit");
  if (!project || project.status !== "active") return null;
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.status, "active")))
    .returning();
  return updated ?? null;
}

export async function restoreOwnedProject(userId: string, projectId: string): Promise<Project | null> {
  const project = await getAccessibleProject(userId, projectId, "projects.edit");
  if (!project || project.status !== "archived") return null;
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      status: "active",
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.status, "archived")))
    .returning();
  return updated ?? null;
}

/** Projects visible across personal + org memberships (dashboard home optional). */
export async function listAccessibleProjectsForUser(
  userId: string,
  filter: ProjectFilter,
): Promise<Project[]> {
  const db = getDb();
  const orgIds = await db
    .select({id: organizationMembers.organizationId})
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active")),
    );
  const ids = orgIds.map((r) => r.id);

  const statusCond =
    filter === "active"
      ? eq(projects.status, "active")
      : filter === "archived"
        ? eq(projects.status, "archived")
        : undefined;

  const personalCond = and(
    eq(projects.userId, userId),
    eq(projects.workspaceType, "personal"),
    statusCond,
  );

  if (ids.length === 0) {
    return db
      .select()
      .from(projects)
      .where(personalCond)
      .orderBy(desc(projects.updatedAt))
      .limit(PROJECT_LIST_LIMIT);
  }

  return db
    .select()
    .from(projects)
    .where(
      and(
        or(
          and(eq(projects.userId, userId), eq(projects.workspaceType, "personal")),
          and(eq(projects.workspaceType, "organization"), inArray(projects.organizationId, ids)),
        ),
        statusCond,
      ),
    )
    .orderBy(desc(projects.updatedAt))
    .limit(PROJECT_LIST_LIMIT);
}
