import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {requireUser} from "@/server/auth/session";
import {resolveUserAccessContext} from "@/server/account/access-context";
import {listAccountUsageHistory} from "@/server/account/history";
import {isAppLocale} from "@/server/auth/validation";

type Props = {params: Promise<{locale: string}>};

export default async function AccountOverviewPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/account");
  const t = await getTranslations("account.overview");
  const access = await resolveUserAccessContext({
    userId: session.user!.id,
    name: session.user!.name,
    email: session.user!.email,
  });
  const recent = await listAccountUsageHistory(session.user!.id, 5);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-[var(--border)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {t("profile")}
          </h2>
          <p className="font-medium">{access.displayName || "—"}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{access.email}</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-[var(--border)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {t("plan")}
          </h2>
          <p className="font-medium">{access.planName}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {access.entitlementState ?? "—"}
          </p>
          <Link href="/account/billing" className="text-sm font-medium text-[var(--accent)]">
            {t("manageBilling")}
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] p-5">
        <h2 className="font-semibold">{t("usageTitle")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("opsLine", {
            used: access.limits.standardOperationsUsed,
            limit: access.limits.standardOperationsLimit,
          })}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("aiLine", {
            used: access.limits.aiOperationsUsed,
            limit: access.limits.aiOperationsLimit,
          })}
        </p>
        <Link href="/account/usage" className="text-sm font-medium text-[var(--accent)]">
          {t("viewUsage")}
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{t("recentTitle")}</h2>
          <Link href="/account/history" className="text-sm text-[var(--accent)]">
            {t("allHistory")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-foreground)]">
            {t("emptyHistory")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
            {recent.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span className="capitalize">{item.category}</span>
                <span className="text-[var(--muted-foreground)]">
                  ×{item.quantity} · {item.recordedAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
