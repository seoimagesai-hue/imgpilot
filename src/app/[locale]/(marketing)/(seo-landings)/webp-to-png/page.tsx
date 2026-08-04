import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {WebpToPngLandingView} from "@/components/marketing/webp-to-png-landing-view";
import {getWebpToPngCopy} from "@/lib/marketing/webp-to-png-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getWebpToPngCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/webp-to-png",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function WebpToPngLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("webp-to-png");
  if (!landing || landing.redirectTo) notFound();
  return <WebpToPngLandingView landing={landing} locale={locale} />;
}
