import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  organizationMembers,
  organizations,
  type Organization,
  type OrganizationMemberRole,
} from "@/db/schema";

export type WorkspaceSummary =
  | {
      type: "personal";
      id: string;
      displayName: string;
      slug: "personal";
      role: "owner";
    }
  | {
      type: "organization";
      id: string;
      displayName: string;
      slug: string;
      role: OrganizationMemberRole;
    };

export async function resolveActiveWorkspace(userId: string): Promise<WorkspaceSummary> {
  return {
    type: "personal",
    id: userId,
    displayName: "Personal",
    slug: "personal",
    role: "owner",
  };
}

export async function listWorkspacesForUser(
  userId: string,
  personalDisplayName: string,
): Promise<WorkspaceSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, "active"),
        eq(organizations.status, "active"),
      ),
    );

  return [
    {
      type: "personal",
      id: userId,
      displayName: personalDisplayName || "Personal",
      slug: "personal",
      role: "owner",
    },
    ...rows.map((row) => ({
      type: "organization" as const,
      id: row.id,
      displayName: row.name,
      slug: row.slug,
      role: row.role,
    })),
  ];
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return row ?? null;
}
