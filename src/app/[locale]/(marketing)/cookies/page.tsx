import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {LegalDocumentView} from "@/components/marketing/legal-document-view";
import {getCookiesDoc} from "@/lib/marketing/legal-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const doc = getCookiesDoc(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/cookies",
    title: doc.metaTitle,
    description: doc.metaDescription,
    index: true,
  });
}

export default async function CookiesPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <LegalDocumentView locale={locale} doc={getCookiesDoc(locale)} />;
}
