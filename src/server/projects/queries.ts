import {and, desc, eq, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {projects, type Project} from "@/db/schema";
import {
  PROJECT_LIST_LIMIT,
  type CreateProjectInput,
  type ProjectFilter,
  type UpdateProjectInput,
} from "./validation";

export async function listProjectsForUser(userId: string, filter: ProjectFilter): Promise<Project[]> {
  const db = getDb();
  const conditions = [eq(projects.userId, userId)];
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
  const conditions = [eq(projects.userId, userId)];
  if (filter === "active") conditions.push(eq(projects.status, "active"));
  if (filter === "archived") conditions.push(eq(projects.status, "archived"));

  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(projects)
    .where(and(...conditions));
  return row?.count ?? 0;
}

/**
 * Ownership-enforced lookup. Missing and unauthorized both return null.
 */
export async function getOwnedProject(userId: string, projectId: string): Promise<Project | null> {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function createOwnedProject(userId: string, input: CreateProjectInput): Promise<Project> {
  const db = getDb();
  const [created] = await db
    .insert(projects)
    .values({
      userId,
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
  return created;
}

export async function updateOwnedProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
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
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function archiveOwnedProject(userId: string, projectId: string): Promise<Project | null> {
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      status: "archived",
      archivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, userId), eq(projects.status, "active")),
    )
    .returning();
  return updated ?? null;
}

export async function restoreOwnedProject(userId: string, projectId: string): Promise<Project | null> {
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({
      status: "active",
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, userId), eq(projects.status, "archived")),
    )
    .returning();
  return updated ?? null;
}
