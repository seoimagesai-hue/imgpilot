import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {BulkResizeLandingView} from "@/components/marketing/bulk-resize-landing-view";
import {getBulkResizeCopy} from "@/lib/marketing/bulk-resize-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getBulkResizeCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/bulk-resize",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function BulkResizeLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <BulkResizeLandingView locale={locale} />;
}
