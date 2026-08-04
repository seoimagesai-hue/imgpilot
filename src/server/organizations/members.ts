import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {organizationMembers, users, type OrganizationMemberRole} from "@/db/schema";

export type OrganizationMemberListItem = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: OrganizationMemberRole;
  joinedAt: Date;
};

export async function listOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMemberListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
      ),
    );
  return rows;
}
