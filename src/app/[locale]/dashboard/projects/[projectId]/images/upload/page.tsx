import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {ImageUploadPanel} from "@/components/images/image-upload-panel";
import {ProjectQuotaSummary} from "@/components/images/project-quota-summary";
import {isR2Configured} from "@/lib/env";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {getQuotaPolicy} from "@/server/images/quota-policy";
import {getOwnedProjectQuotaUsage} from "@/server/images/quota-service";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function ProjectImageUploadPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const session = await requireUser(locale, `/dashboard/projects/${projectId}/images/upload`);
  const userId = session.user.id;

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const project = await getOwnedProject(userId, idParsed.data);
  if (!project) notFound();

  const t = await getTranslations("images");
  const tp = await getTranslations("projects");
  const storageConfigured = isR2Configured();
  const quotaPolicy = getQuotaPolicy();
  const quotaUsage = await getOwnedProjectQuotaUsage(userId, project.id);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/dashboard/projects" className="hover:underline">
            {tp("title")}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
            {project.name}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/dashboard/projects/${project.id}/images`} className="hover:underline">
            {t("libraryTitle")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("uploadTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("uploadSubtitleLive")}</p>
      </header>

      {quotaUsage ? (
        <div className="mb-6">
          <ProjectQuotaSummary usage={quotaUsage} policy={quotaPolicy} locale={locale} />
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <ImageUploadPanel
          projectId={project.id}
          storageConfigured={storageConfigured}
          quotaUsage={quotaUsage ?? undefined}
          quotaPolicy={quotaPolicy}
        />
      </section>
    </main>
  );
}
