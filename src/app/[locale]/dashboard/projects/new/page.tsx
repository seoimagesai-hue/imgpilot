import {getTranslations, setRequestLocale} from "next-intl/server";
import {ProjectForm} from "@/components/projects/project-form";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string}>;
};

export default async function NewProjectPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  await requireUser(locale, "/dashboard/projects/new");
  const t = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("newProject")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("newProjectSubtitle")}</p>
      </header>
      <ProjectForm mode="create" />
    </main>
  );
}
