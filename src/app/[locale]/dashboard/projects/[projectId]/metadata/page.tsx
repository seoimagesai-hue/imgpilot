import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {MetadataReviewShell} from "@/components/images/metadata-review-shell";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function ProjectMetadataReviewPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const session = await requireUser(locale, `/dashboard/projects/${projectId}/metadata`);
  const project = await getOwnedProject(session.user.id, idParsed.data);
  if (!project) notFound();

  const t = await getTranslations("images.metadataReview");
  const tp = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
            {project.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("pageHint")} · {tp("metadataLanguage")}:{" "}
          {project.metadataLanguage === "ur" ? tp("langUrdu") : tp("langEnglish")}
        </p>
        <p className="mt-2 text-sm">
          <Link
            href={`/dashboard/projects/${project.id}/ai-batches`}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {t("bulkAiLink")}
          </Link>
        </p>
      </header>
      <MetadataReviewShell
        projectId={project.id}
        metadataLanguage={project.metadataLanguage}
        currentUserId={session.user.id}
      />
    </main>
  );
}
