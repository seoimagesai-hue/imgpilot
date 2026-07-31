import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {ImageLibraryShell} from "@/components/images/image-library-shell";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {parseLibraryQuery} from "@/server/images/library-query";
import {
  getLibraryStatusCounts,
  listLibraryImagesForOwnedProject,
} from "@/server/images/library-queries";
import {ProjectQuotaSummary} from "@/components/images/project-quota-summary";
import {ProjectReadySummary} from "@/components/images/project-ready-summary";
import {attachCurrentPagePreviews} from "@/server/images/library-previews";
import {getQuotaPolicy} from "@/server/images/quota-policy";
import {getOwnedProjectQuotaUsage} from "@/server/images/quota-service";
import {getOwnedProjectReadySummary} from "@/server/images/ready-service";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectImagesPage({params, searchParams}: Props) {
  const {locale: raw, projectId} = await params;
  const rawParams = await searchParams;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const session = await requireUser(locale, `/dashboard/projects/${projectId}/images`);
  const userId = session.user.id;

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const project = await getOwnedProject(userId, idParsed.data);
  if (!project) notFound();

  const query = parseLibraryQuery({
    q: first(rawParams.q),
    status: first(rawParams.status),
    sort: first(rawParams.sort),
    view: first(rawParams.view),
    page: first(rawParams.page),
    pageSize: first(rawParams.pageSize),
  });

  const quotaPolicy = getQuotaPolicy();

  const [pageResult, statusCounts, quotaUsage, readySummary] = await Promise.all([
    listLibraryImagesForOwnedProject(userId, project.id, query),
    getLibraryStatusCounts(userId, project.id),
    getOwnedProjectQuotaUsage(userId, project.id),
    getOwnedProjectReadySummary(userId, project.id),
  ]);

  const withPreviews = await attachCurrentPagePreviews({
    userId,
    projectId: project.id,
    items: pageResult.items,
  });

  const clientItems = withPreviews.map((item) => ({
    ...item,
    uploadedAt: item.uploadedAt?.toISOString() ?? null,
    validatedAt: item.validatedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }));

  let emptyKind: "no_images" | "no_validated" | "no_filter" | "no_search" = "no_images";
  if (statusCounts.total === 0) emptyKind = "no_images";
  else if (pageResult.totalCount === 0 && query.q) emptyKind = "no_search";
  else if (pageResult.totalCount === 0 && query.status === "ready_for_processing") emptyKind = "no_validated";
  else if (pageResult.totalCount === 0 && query.status === "validated") emptyKind = "no_validated";
  else if (pageResult.totalCount === 0) emptyKind = "no_filter";

  const t = await getTranslations("images");
  const tp = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            <Link href="/dashboard/projects" className="hover:underline">
              {tp("title")}
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("libraryTitle")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("imageCount", {count: statusCounts.total})}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          >
            {t("backToProject")}
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}/images/upload`}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            {t("uploadImages")}
          </Link>
        </div>
      </header>

      {readySummary ? (
        <div className="mb-4">
          <ProjectReadySummary summary={readySummary} locale={locale} />
        </div>
      ) : null}

      {quotaUsage ? (
        <div className="mb-6">
          <ProjectQuotaSummary usage={quotaUsage} policy={quotaPolicy} locale={locale} />
        </div>
      ) : null}

      <ImageLibraryShell
        projectId={project.id}
        query={{...query, page: pageResult.page}}
        items={clientItems}
        totalCount={pageResult.totalCount}
        totalPages={pageResult.totalPages}
        page={pageResult.page}
        pageSize={pageResult.pageSize}
        statusCounts={statusCounts}
        emptyKind={emptyKind}
      />

      <p className="mt-4 text-xs text-[var(--muted)]">{t("processingDeferred")}</p>
    </main>
  );
}
