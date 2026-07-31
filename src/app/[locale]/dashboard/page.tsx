import {FolderKanban, HardDriveDownload, Images} from "lucide-react";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";
import {UserMenu} from "@/components/dashboard/user-menu";
import {auth} from "@/auth";
import {countProjectsForUser} from "@/server/projects/queries";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const authT = await getTranslations("authentication");
  const projectsT = await getTranslations("projects");
  const session = await auth();
  const activeCount = session?.user?.id ? await countProjectsForUser(session.user.id, "active") : 0;

  const stats = [
    {label: t("imagesProcessed"), value: "0", icon: Images},
    {label: t("storageSaved"), value: "0 MB", icon: HardDriveDownload},
    {label: t("activeProjects"), value: String(activeCount), icon: FolderKanban},
  ] as const;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("welcome")}</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
            signedInLabel={authT("signedInAs")}
            signOutLabel={authT("signOut")}
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label={t("welcome")}>
        {stats.map(({label, value, icon: Icon}) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">{label}</span>
              <Icon className="size-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <strong className="text-2xl">{value}</strong>
          </article>
        ))}
      </section>

      <section
        id="projects"
        className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{projectsT("title")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{projectsT("subtitle")}</p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {t("newProject")}
          </Link>
        </div>
        <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-gray-50 p-8 text-center">
          <div>
            <h3 className="font-medium">{activeCount ? projectsT("title") : t("emptyTitle")}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {activeCount ? projectsT("subtitle") : t("emptyText")}
            </p>
            <Link href="/dashboard/projects" className="mt-4 inline-flex text-sm font-medium text-[var(--accent)]">
              {t("goToProjects")}
            </Link>
          </div>
        </div>
      </section>

      <section id="usage" className="sr-only" aria-hidden="true" />
      <section id="billing" className="sr-only" aria-hidden="true" />
      <section id="settings" className="sr-only" aria-hidden="true" />
    </main>
  );
}
