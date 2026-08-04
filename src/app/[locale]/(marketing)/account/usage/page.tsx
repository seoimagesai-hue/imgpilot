import {getTranslations, setRequestLocale} from "next-intl/server";
import {requireUser} from "@/server/auth/session";
import {resolveUserAccessContext} from "@/server/account/access-context";
import {isAppLocale} from "@/server/auth/validation";

type Props = {params: Promise<{locale: string}>};

export default async function AccountUsagePage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/account/usage");
  const t = await getTranslations("account.usage");
  const access = await resolveUserAccessContext({
    userId: session.user!.id,
    name: session.user!.name,
    email: session.user!.email,
  });
  const L = access.limits;

  const rows = [
    {label: t("standardOps"), used: L.standardOperationsUsed, limit: L.standardOperationsLimit},
    {label: t("aiOps"), used: L.aiOperationsUsed, limit: L.aiOperationsLimit},
    {label: t("bulkFiles"), used: "—", limit: L.maxBulkFiles},
    {label: t("maxFile"), used: "—", limit: `${Math.round(L.maxFileBytes / (1024 * 1024))} MB`},
    {label: t("retention"), used: "—", limit: `${L.retentionHours}h`},
  ] as const;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-[var(--muted-foreground)]">
          {t("subtitle", {plan: access.planName})}
        </p>
        {L.periodEnd ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("periodEnd", {date: L.periodEnd.slice(0, 10)})}
          </p>
        ) : null}
      </header>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t("metric")}</th>
              <th className="px-4 py-3 font-medium">{t("used")}</th>
              <th className="px-4 py-3 font-medium">{t("limit")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">{row.label}</td>
                <td className="px-4 py-3">{row.used}</td>
                <td className="px-4 py-3">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
