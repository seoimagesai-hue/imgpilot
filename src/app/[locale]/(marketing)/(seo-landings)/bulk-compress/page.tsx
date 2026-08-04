import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {BulkCompressLandingView} from "@/components/marketing/bulk-compress-landing-view";
import {getBulkCompressCopy} from "@/lib/marketing/bulk-compress-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getBulkCompressCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/bulk-compress",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function BulkCompressLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <BulkCompressLandingView locale={locale} />;
}
