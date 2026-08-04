import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PngToWebpLandingView} from "@/components/marketing/png-to-webp-landing-view";
import {getPngToWebpCopy} from "@/lib/marketing/png-to-webp-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getPngToWebpCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/png-to-webp",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function PngToWebpLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("png-to-webp");
  if (!landing || landing.redirectTo) notFound();
  return <PngToWebpLandingView landing={landing} locale={locale} />;
}
