import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {ProjectForm} from "@/components/projects/project-form";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {resolveActiveMembership} from "@/server/organizations/access";
import {hasOrgPermission} from "@/server/organizations/permissions";
import {resolveActiveWorkspace} from "@/server/organizations/workspace";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{organizationId?: string}>;
};

export default async function NewProjectPage({params, searchParams}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/dashboard/projects/new");
  const userId = session.user.id;
  const sp = await searchParams;

  const workspace = await resolveActiveWorkspace(userId);
  let organizationId: string | undefined;

  if (sp.organizationId?.trim()) {
    organizationId = sp.organizationId.trim();
  } else if (workspace.type === "organization") {
    organizationId = workspace.id;
  }

  if (organizationId) {
    const membership = await resolveActiveMembership(userId, organizationId);
    if (!membership || !hasOrgPermission(membership.role, "projects.create")) {
      notFound();
    }
  }

  const t = await getTranslations("projects");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("newProject")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("newProjectSubtitle")}</p>
      </header>
      <ProjectForm mode="create" organizationId={organizationId} />
    </main>
  );
}
