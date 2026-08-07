import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {SeoFormatToolLanding} from "@/components/marketing/seo-tool-landing";
import {getSeoToolLandingCopy} from "@/lib/marketing/seo-tool-landing-copy";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};
const PATH = "/crop-png";
const SLUG = "crop-png";

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getSeoToolLandingCopy(PATH, locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: PATH,
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function Page({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SeoFormatToolLanding slug={SLUG} locale={locale} />;
}
