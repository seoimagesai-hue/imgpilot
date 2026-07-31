import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {DashboardNav} from "./dashboard-nav";

export async function Sidebar() {
  const common = await getTranslations("common");

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-e border-[var(--border)] bg-white p-5 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 font-semibold">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white">
          SI
        </span>
        <span>{common("brand")}</span>
      </Link>
      <DashboardNav />
    </aside>
  );
}
