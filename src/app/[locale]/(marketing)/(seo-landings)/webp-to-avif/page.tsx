import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {WebpToAvifLandingView} from "@/components/marketing/webp-to-avif-landing-view";
import {getWebpToAvifCopy} from "@/lib/marketing/webp-to-avif-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getWebpToAvifCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/webp-to-avif",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function WebpToAvifLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("webp-to-avif");
  if (!landing || landing.redirectTo) notFound();
  return <WebpToAvifLandingView landing={landing} locale={locale} />;
}
