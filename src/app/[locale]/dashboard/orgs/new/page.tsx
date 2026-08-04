import {getTranslations, setRequestLocale} from "next-intl/server";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";
import {CreateOrgForm} from "@/components/organizations/create-org-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string}>;
};

export default async function NewOrganizationPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  await requireUser(locale, "/dashboard/orgs/new");
  const t = await getTranslations("organizations");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("createOrg")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("createOrgSubtitle")}</p>
      </header>
      <CreateOrgForm />
    </main>
  );
}
