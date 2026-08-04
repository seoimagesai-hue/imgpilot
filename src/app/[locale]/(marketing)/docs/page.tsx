import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {DocsPager} from "@/components/marketing/docs-nav";
import {isAppLocale} from "@/server/auth/validation";
import {buildPublicMetadata} from "@/server/marketing/seo";
import type {AppLocale} from "@/i18n/routing";

export const dynamic = "force-dynamic";
type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale: raw} = await params;
  const locale = (isAppLocale(raw) ? raw : "en") as AppLocale;
  const t = await getTranslations({locale, namespace: "marketing.docs"});
  return buildPublicMetadata({
    locale,
    path: "/docs",
    title: t("hubSeoTitle"),
    description: t("hubSeoDescription"),
  });
}

export default async function DocsHubPage({params}: Props) {
  const {locale: raw} = await params;
  setRequestLocale(isAppLocale(raw) ? raw : "en");
  const t = await getTranslations("marketing.docs");

  const links = [
    ["/docs/getting-started", t("gettingStarted")],
    ["/docs/uploads", t("uploads")],
    ["/docs/validation", t("validation")],
    ["/docs/processing", t("processing")],
    ["/docs/ai-metadata", t("aiMetadata")],
    ["/docs/exports", t("exports")],
    ["/docs/billing", t("billing")],
    ["/docs/api", t("api")],
    ["/docs/webhooks", t("webhooks")],
    ["/docs/wordpress", t("wordpress")],
    ["/docs/shopify", t("shopify")],
    ["/docs/webflow", t("webflow")],
    ["/docs/cloudinary", t("cloudinary")],
  ] as const;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("hubTitle")}</h1>
      <p className="mt-3 text-[var(--muted)]">{t("hubIntro")}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="block rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-medium hover:border-[var(--accent)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <DocsPager current="/docs" />
    </>
  );
}
