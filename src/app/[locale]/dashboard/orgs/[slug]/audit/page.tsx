import {getFormatter, getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {listOrganizationAuditLogs} from "@/server/organizations/audit";
import {requireOrgPageAccess} from "@/server/organizations/page-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export default async function OrganizationAuditPage({params}: Props) {
  const {locale: raw, slug} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);

  const {session, org} = await requireOrgPageAccess(
    locale,
    slug,
    "audit.view",
    `/dashboard/orgs/${slug}/audit`,
  );

  const logs = await listOrganizationAuditLogs({
    actorUserId: session.user!.id!,
    organizationId: org.id,
    limit: 100,
  });
  const t = await getTranslations("organizations");
  const format = await getFormatter();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm text-[var(--muted)]">
          <Link href={`/dashboard/orgs/${org.slug}`} className="hover:underline">
            {org.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("audit")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("auditSubtitle")}</p>
      </header>

      <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">{t("auditEmpty")}</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--border)] text-start text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">{t("auditWhen")}</th>
                <th className="px-4 py-3 font-medium">{t("auditAction")}</th>
                <th className="px-4 py-3 font-medium">{t("auditActor")}</th>
                <th className="px-4 py-3 font-medium">{t("auditTarget")}</th>
                <th className="px-4 py-3 font-medium">{t("auditSummary")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                    {format.dateTime(log.createdAt, {dateStyle: "medium", timeStyle: "short"})}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.actorUserId || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--muted)]">{log.targetEntityType}</span>
                    {log.targetEntityId ? (
                      <div className="font-mono text-xs">{log.targetEntityId}</div>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-[var(--muted)]">
                    {[log.beforeSummary, log.afterSummary].filter(Boolean).join(" → ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
