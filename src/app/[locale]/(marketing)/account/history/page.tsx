import {getTranslations, setRequestLocale} from "next-intl/server";
import {requireUser} from "@/server/auth/session";
import {listAccountUsageHistory} from "@/server/account/history";
import {isAppLocale} from "@/server/auth/validation";

type Props = {params: Promise<{locale: string}>};

export default async function AccountHistoryPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/account/history");
  const t = await getTranslations("account.history");
  const items = await listAccountUsageHistory(session.user!.id, 100);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
          {items.map((item) => (
            <li key={item.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-4">
              <span className="font-medium capitalize">{item.category}</span>
              <span>×{item.quantity}</span>
              <span className="text-[var(--muted-foreground)]">{item.status}</span>
              <span className="text-[var(--muted-foreground)]">
                {item.recordedAt.replace("T", " ").slice(0, 19)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
