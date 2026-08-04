import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {LegalDocumentView} from "@/components/marketing/legal-document-view";
import {getTermsDoc} from "@/lib/marketing/legal-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const doc = getTermsDoc(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/terms",
    title: doc.metaTitle,
    description: doc.metaDescription,
    index: true,
  });
}

export default async function TermsPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <LegalDocumentView locale={locale} doc={getTermsDoc(locale)} />;
}
