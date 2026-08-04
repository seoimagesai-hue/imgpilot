import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {ContactLandingView} from "@/components/marketing/contact-landing-view";
import {getContactCopy} from "@/lib/marketing/contact-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getContactCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/contact",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ContactPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || null;
  return <ContactLandingView locale={locale} supportEmail={supportEmail} />;
}
