import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {isAppLocale} from "@/server/auth/validation";
import {requireUser} from "@/server/auth/session";

export const dynamic = "force-dynamic";

type Props = {params: Promise<{locale: string}>};

export default async function IntegrationsHubPage({params}: Props) {
  const {locale: raw} = await params;
  const locale = isAppLocale(raw) ? raw : "en";
  setRequestLocale(locale);
  await requireUser(locale, "/dashboard/settings/integrations");

  const t = await getTranslations("wordpress.hub");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("wordpressCard")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("wordpressCardDescription")}</p>
          <Link
            href="/dashboard/settings/integrations/wordpress"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {t("manage")}
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("shopifyCard")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("shopifyCardDescription")}</p>
          <Link
            href="/dashboard/settings/integrations/shopify"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {t("manageShopify")}
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("webflowCard")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("webflowCardDescription")}</p>
          <Link
            href="/dashboard/settings/integrations/webflow"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {t("manageWebflow")}
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("cloudinaryCard")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("cloudinaryCardDescription")}</p>
          <Link
            href="/dashboard/settings/integrations/cloudinary"
            className="mt-4 inline-block rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {t("manageCloudinary")}
          </Link>
        </div>
      </section>

      <p className="mt-6 text-sm text-[var(--muted)]">{t("webflowScopeNote")}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("cloudinaryScopeNote")}</p>
    </main>
  );
}
