import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {ProjectForm} from "@/components/projects/project-form";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {getOwnedProject} from "@/server/projects/queries";
import {projectIdSchema} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; projectId: string}>;
};

export default async function EditProjectPage({params}: Props) {
  const {locale: raw, projectId} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, `/dashboard/projects/${projectId}/edit`);
  const userId = session.user.id;

  const idParsed = projectIdSchema.safeParse(projectId);
  if (!idParsed.success) notFound();

  const project = await getOwnedProject(userId, idParsed.data);
  if (!project) notFound();

  const t = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("editProject")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{project.name}</p>
      </header>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        defaults={{
          name: project.name,
          websiteUrl: project.websiteUrl ?? "",
          description: project.description ?? "",
          metadataLanguage: project.metadataLanguage,
        }}
      />
    </main>
  );
}
