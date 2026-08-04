import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CompressPngLandingView} from "@/components/marketing/compress-png-landing-view";
import {getCompressPngCopy} from "@/lib/marketing/compress-png-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCompressPngCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/compress-png",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CompressPngLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("compress-png");
  if (!landing || landing.redirectTo) notFound();
  return <CompressPngLandingView landing={landing} locale={locale} />;
}
