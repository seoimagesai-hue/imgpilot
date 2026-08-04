import {auth} from "@/auth";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {listWorkspacesForUser, resolveActiveWorkspace} from "@/server/organizations/workspace";
import {DashboardNav} from "./dashboard-nav";
import {WorkspaceSwitcher} from "./workspace-switcher";

export async function Sidebar() {
  const common = await getTranslations("common");
  const session = await auth();
  const userId = session?.user?.id;

  const workspaces = userId
    ? await listWorkspacesForUser(userId, session?.user?.name ?? "")
    : [];
  const activeWorkspace = userId
    ? await resolveActiveWorkspace(userId)
    : {
        type: "personal" as const,
        id: "",
        displayName: "Personal",
        slug: "personal" as const,
        role: "owner" as const,
      };

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-e border-[var(--border)] bg-white p-5 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 font-semibold">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white">
          SI
        </span>
        <span>{common("brand")}</span>
      </Link>
      {userId ? (
        <WorkspaceSwitcher workspaces={workspaces} active={activeWorkspace} />
      ) : null}
      <DashboardNav />
    </aside>
  );
}
