import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PngToAvifLandingView} from "@/components/marketing/png-to-avif-landing-view";
import {getPngToAvifCopy} from "@/lib/marketing/png-to-avif-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getPngToAvifCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/png-to-avif",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function PngToAvifLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("png-to-avif");
  if (!landing || landing.redirectTo) notFound();
  return <PngToAvifLandingView landing={landing} locale={locale} />;
}
