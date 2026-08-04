import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {BatchList} from "@/components/ai-batches/batch-list";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {listMetadataBatchesAction} from "@/server/images/ai-metadata-batch-actions";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function AiBatchesListPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const session = await requireUser(locale, `/dashboard/projects/${projectId}/ai-batches`);
  const project = await getOwnedProject(session.user.id, idParsed.data);
  if (!project) notFound();

  const result = await listMetadataBatchesAction(project.id);
  const batches = result.ok ? (result.batches ?? []) : [];

  const t = await getTranslations("aiBatches");
  const tp = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("list.pageTitle")}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("list.pageHint")}</p>
        </div>
        <Link
          href={`/dashboard/projects/${project.id}/ai-batches/new`}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          {t("list.newBatch")}
        </Link>
      </header>

      <BatchList projectId={project.id} batches={batches} />

      <p className="mt-4 text-xs text-[var(--muted)]">
        {tp("metadataLanguage")}:{" "}
        {project.metadataLanguage === "ur" ? tp("langUrdu") : tp("langEnglish")} ·{" "}
        <Link href={`/dashboard/projects/${project.id}/metadata`} className="underline">
          {t("list.linkMetadataReview")}
        </Link>
      </p>
    </main>
  );
}
