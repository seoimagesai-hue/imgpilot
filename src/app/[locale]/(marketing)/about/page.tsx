import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {AboutLandingView} from "@/components/marketing/about-landing-view";
import {getAboutCopy} from "@/lib/marketing/about-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getAboutCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/about",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function AboutPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <AboutLandingView locale={locale} />;
}
