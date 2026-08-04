import {notFound} from "next/navigation";
import {requireUser} from "@/server/auth/session";
import {
  requireOrgPermission,
  type ActiveMembership,
} from "@/server/organizations/access";
import type {OrgPermission} from "@/server/organizations/permissions";
import {getOrganizationBySlug} from "@/server/organizations/workspace";
import type {Organization} from "@/db/schema";

export async function requireOrgPageAccess(
  locale: string,
  slug: string,
  permission: OrgPermission,
  callbackPath: string,
): Promise<{
  session: Awaited<ReturnType<typeof requireUser>>;
  org: Organization;
  access: ActiveMembership;
}> {
  const session = await requireUser(locale, callbackPath);
  const org = await getOrganizationBySlug(slug);
  if (!org || org.status === "archived") notFound();

  try {
    const access = await requireOrgPermission(session.user.id, org.id, permission);
    return {session, org, access};
  } catch {
    notFound();
  }
}
