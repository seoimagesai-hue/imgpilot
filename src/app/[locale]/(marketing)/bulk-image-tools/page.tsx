import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {BulkImageToolsLandingView} from "@/components/marketing/bulk-image-tools-landing-view";
import {getBulkImageToolsCopy} from "@/lib/marketing/bulk-image-tools-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{tool?: string}>;
};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getBulkImageToolsCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/bulk-image-tools",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function BulkImageToolsPage({params, searchParams}: PageProps) {
  const {locale} = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  return <BulkImageToolsLandingView locale={locale} initialTool={query.tool} />;
}
