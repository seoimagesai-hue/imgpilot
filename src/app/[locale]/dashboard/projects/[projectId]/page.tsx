import {notFound} from "next/navigation";
import {getFormatter, getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {ProjectStatusActions} from "@/components/projects/project-status-actions";
import {isR2Configured} from "@/lib/env";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {countImagesForOwnedProject} from "@/server/images/queries";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function ProjectDetailPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/projects/${projectId}`);
  const userId = session.user.id;

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const project = await getOwnedProject(userId, idParsed.data);
  if (!project) notFound();

  const imageCount = await countImagesForOwnedProject(userId, project.id, {status: "uploaded"});
  const storageConfigured = isR2Configured();

  const t = await getTranslations("projects");
  const ti = await getTranslations("images");
  const format = await getFormatter();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            <Link href="/dashboard/projects" className="hover:underline">
              {t("title")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {project.status === "active" ? t("statusActive") : t("statusArchived")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          >
            {t("edit")}
          </Link>
          <ProjectStatusActions projectId={project.id} status={project.status} />
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">{t("websiteUrl")}</h2>
          <p className="mt-1 break-all">{project.websiteUrl || t("none")}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">{t("description")}</h2>
          <p className="mt-1 whitespace-pre-wrap">{project.description || t("none")}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">{t("metadataLanguage")}</h2>
          <p className="mt-1">
            {project.metadataLanguage === "en" ? t("langEnglish") : t("langUrdu")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">{t("created")}</h2>
            <p className="mt-1">
              {format.dateTime(project.createdAt, {dateStyle: "medium", timeStyle: "short"})}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">{t("updated")}</h2>
            <p className="mt-1">
              {format.dateTime(project.updatedAt, {dateStyle: "medium", timeStyle: "short"})}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{ti("title")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {ti("imageCount", {count: imageCount})}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {storageConfigured ? ti("storageReadyNotice") : ti("storageUnavailableNotice")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/projects/${project.id}/images`}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              {ti("viewImages")}
            </Link>
            <Link
              href={`/dashboard/projects/${project.id}/images/upload`}
              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
            >
              {ti("uploadImages")}
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">{ti("processingDeferred")}</p>
      </section>
    </main>
  );
}
