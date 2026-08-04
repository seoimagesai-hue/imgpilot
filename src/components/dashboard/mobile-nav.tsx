import {auth} from "@/auth";
import {listWorkspacesForUser, resolveActiveWorkspace} from "@/server/organizations/workspace";
import {MobileNavClient} from "./mobile-nav-client";

export async function MobileNav() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const workspaces = await listWorkspacesForUser(userId, session.user?.name ?? "");
  const activeWorkspace = await resolveActiveWorkspace(userId);

  return <MobileNavClient workspaces={workspaces} activeWorkspace={activeWorkspace} />;
}
