import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {BatchCreateForm} from "@/components/ai-batches/batch-create-form";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {listLibraryImagesForOwnedProject} from "@/server/images/library-queries";
import {parseLibraryQuery} from "@/server/images/library-query";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function AiBatchesNewPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const session = await requireUser(locale, `/dashboard/projects/${projectId}/ai-batches/new`);
  const project = await getOwnedProject(session.user.id, idParsed.data, "metadata.generate");
  if (!project) notFound();

  const page = await listLibraryImagesForOwnedProject(
    session.user.id,
    project.id,
    parseLibraryQuery({status: "ready_for_processing", pageSize: "50", sort: "uploaded_desc"}),
  );

  const availableImages = page.items.map((item) => ({
    id: item.id,
    originalFilename: item.originalFilename,
  }));

  const t = await getTranslations("aiBatches");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/projects/${project.id}/ai-batches`} className="hover:underline">
            {t("list.pageTitle")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("create.pageTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("create.pageHint")}</p>
      </header>

      <BatchCreateForm
        projectId={project.id}
        defaultLanguage={project.metadataLanguage}
        availableImages={availableImages}
      />
    </main>
  );
}
