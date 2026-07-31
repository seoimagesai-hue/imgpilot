import {getFormatter, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import type {Project} from "@/db/schema";
import {ProjectStatusActions} from "./project-status-actions";

type Props = {
  projects: Project[];
};

export async function ProjectList({projects}: Props) {
  const t = await getTranslations("projects");
  const format = await getFormatter();

  if (projects.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
        <div>
          <h2 className="font-medium">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("emptyText")}</p>
          <Link
            href="/dashboard/projects/new"
            className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {t("createProject")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li
          key={project.id}
          className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold">{project.name}</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-[var(--muted)]">
                  {project.status === "active" ? t("statusActive") : t("statusArchived")}
                </span>
              </div>
              {project.websiteUrl ? (
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{project.websiteUrl}</p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--muted)]">
                {t("metadataLanguage")}:{" "}
                {project.metadataLanguage === "en" ? t("langEnglish") : t("langUrdu")}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t("updated")}:{" "}
                {format.dateTime(project.updatedAt, {dateStyle: "medium", timeStyle: "short"})}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                {t("view")}
              </Link>
              <Link
                href={`/dashboard/projects/${project.id}/edit`}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                {t("edit")}
              </Link>
              <ProjectStatusActions projectId={project.id} status={project.status} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
