import {setRequestLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {ProjectList} from "@/components/projects/project-list";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";
import {
  listOrganizationProjects,
  listPersonalProjectsForUser,
} from "@/server/projects/queries";
import {projectFilterSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
};

export default async function ProjectsPage({params, searchParams}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/projects");
  const userId = session.user.id;

  const sp = await searchParams;
  const filter = projectFilterSchema.parse(sp.status ?? "active");
  const workspace = await resolveActiveWorkspace(userId);

  let projects;
  let canCreate = true;

  if (workspace.type === "organization") {
    const membership = await resolveActiveMembership(userId, workspace.id);
    if (!membership) {
      projects = await listPersonalProjectsForUser(userId, filter);
    } else {
      projects = await listOrganizationProjects(workspace.id, filter);
      canCreate = hasOrgPermission(membership.role, "projects.create");
    }
  } else {
    projects = await listPersonalProjectsForUser(userId, filter);
  }

  const t = await getTranslations("projects");
  const to = await getTranslations("organizations");

  const filters = [
    {key: "active", label: t("filterActive")},
    {key: "archived", label: t("filterArchived")},
    {key: "all", label: t("filterAll")},
  ] as const;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {workspace.type === "organization"
              ? to("orgProjectsSubtitle", {name: workspace.displayName})
              : t("subtitle")}
          </p>
        </div>
        {canCreate ? (
          <Link
            href={
              workspace.type === "organization"
                ? `/dashboard/projects/new?organizationId=${encodeURIComponent(workspace.id)}`
                : "/dashboard/projects/new"
            }
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            {t("createProject")}
          </Link>
        ) : null}
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t("filters")}>
        {filters.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/projects?status=${item.key}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === item.key
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <ProjectList projects={projects} />
    </main>
  );
}
