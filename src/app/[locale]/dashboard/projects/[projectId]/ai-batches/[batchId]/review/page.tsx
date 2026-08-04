import {notFound} from "next/navigation";
import {getFormatter, getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {BatchReviewPanel} from "@/components/ai-batches/batch-review-panel";
import {CommentThread} from "@/components/collaboration/comment-thread";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {getMetadataBatchAction} from "@/server/images/ai-metadata-batch-actions";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string; batchId: string}>;
};

export default async function AiBatchReviewPage({params}: Props) {
  const {locale: raw, projectId, batchId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const session = await requireUser(
    locale,
    `/dashboard/projects/${projectId}/ai-batches/${batchId}/review`,
  );
  const project = await getOwnedProject(session.user.id, idParsed.data, "metadata.approve");
  if (!project) notFound();

  const result = await getMetadataBatchAction(project.id, batchId);
  if (!result.ok || !result.batch) notFound();

  const t = await getTranslations("aiBatches");
  const format = await getFormatter();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/projects/${project.id}/ai-batches/${batchId}`} className="hover:underline">
            {t("detail.pageTitle")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("review.pageTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t(`templates.${result.batch.templateCode}`)} ·{" "}
          {result.batch.language === "ur" ? t("languageUrdu") : t("languageEnglish")} ·{" "}
          {format.dateTime(new Date(result.batch.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <BatchReviewPanel
        projectId={project.id}
        batchId={batchId}
        outputLanguage={result.batch.language}
      />

      <div className="mt-6">
        <CommentThread
          projectId={project.id}
          subjectType="ai_metadata_batch"
          subjectId={batchId}
        />
      </div>
    </main>
  );
}
