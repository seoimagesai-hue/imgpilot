import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {SearchLandingView, getSearchMeta} from "@/components/marketing/search-landing-view";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const meta = getSearchMeta(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/search",
    title: meta.title,
    description: meta.description,
    index: true,
  });
}

export default async function SearchPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <SearchLandingView locale={locale} />;
}
