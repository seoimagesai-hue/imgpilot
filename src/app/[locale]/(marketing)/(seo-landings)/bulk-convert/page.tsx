import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {BulkConvertLandingView} from "@/components/marketing/bulk-convert-landing-view";
import {getBulkConvertCopy} from "@/lib/marketing/bulk-convert-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getBulkConvertCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/bulk-convert",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function BulkConvertLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <BulkConvertLandingView locale={locale} />;
}
