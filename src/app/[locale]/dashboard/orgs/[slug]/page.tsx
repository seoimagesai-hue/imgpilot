import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {countOrganizationProjects} from "@/server/projects/queries";
import {requireOrgPageAccess} from "@/server/organizations/page-access";
import {hasOrgPermission} from "@/server/organizations/permissions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export default async function OrganizationOverviewPage({params}: Props) {
  const {locale: raw, slug} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const {org, access} = await requireOrgPageAccess(
    locale,
    slug,
    "organization.view",
    `/dashboard/orgs/${slug}`,
  );

  const projectCount = await countOrganizationProjects(org.id, "all");
  const t = await getTranslations("organizations");
  const canViewMembers = hasOrgPermission(access.role, "members.view");
  const canViewAudit = hasOrgPermission(access.role, "audit.view");
  const canManageBilling = hasOrgPermission(access.role, "billing.reassign");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{org.name}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("slug")}: {org.slug}
        </p>
      </header>

      {org.status === "restricted" ? (
        <p
          role="status"
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t("restrictedNotice")}
        </p>
      ) : null}

      <section className="mb-6 space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[var(--muted)]">{t("status")}</dt>
            <dd className="mt-1 font-medium">{t(`statusValues.${org.status}` as "statusValues.active")}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">{t("role")}</dt>
            <dd className="mt-1 font-medium">{t(access.role)}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">{t("billingOwner")}</dt>
            <dd className="mt-1 break-all font-mono text-sm">{org.billingOwnerUserId}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">{t("projectCount")}</dt>
            <dd className="mt-1 font-medium">{projectCount}</dd>
          </div>
        </dl>
      </section>

      <nav className="flex flex-wrap gap-2">
        {canViewMembers ? (
          <Link
            href={`/dashboard/orgs/${org.slug}/members`}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm"
          >
            {t("members")}
          </Link>
        ) : null}
        {canManageBilling ? (
          <Link
            href={`/dashboard/orgs/${org.slug}/settings`}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm"
          >
            {t("settings")}
          </Link>
        ) : null}
        {canViewAudit ? (
          <Link
            href={`/dashboard/orgs/${org.slug}/audit`}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm"
          >
            {t("audit")}
          </Link>
        ) : null}
        <Link
          href="/dashboard/projects"
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          {t("viewProjects")}
        </Link>
      </nav>
    </main>
  );
}
