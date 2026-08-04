import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/dashboard/language-switcher";
import {requireUser} from "@/server/auth/session";
import {resolveUserAccessContext} from "@/server/account/access-context";
import {isAppLocale} from "@/server/auth/validation";

type Props = {params: Promise<{locale: string}>};

export default async function AccountSettingsPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  const session = await requireUser(locale, "/account/settings");
  const t = await getTranslations("account.settings");
  const access = await resolveUserAccessContext({
    userId: session.user!.id,
    name: session.user!.name,
    email: session.user!.email,
  });

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] p-5">
        <h2 className="font-semibold">{t("profileTitle")}</h2>
        <p className="text-sm">
          <span className="text-[var(--muted-foreground)]">{t("name")}: </span>
          {access.displayName || "—"}
        </p>
        <p className="text-sm">
          <span className="text-[var(--muted-foreground)]">{t("email")}: </span>
          {access.email || "—"}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] p-5">
        <h2 className="font-semibold">{t("languageTitle")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{t("languageHelp")}</p>
        <LanguageSwitcher />
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] p-5">
        <h2 className="font-semibold">{t("passwordTitle")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{t("passwordUnavailable")}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] p-5">
        <h2 className="font-semibold">{t("deleteTitle")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{t("deleteRequest")}</p>
        <Link href="/contact" className="text-sm font-medium text-[var(--accent)]">
          {t("contactSupport")}
        </Link>
      </section>
    </main>
  );
}
