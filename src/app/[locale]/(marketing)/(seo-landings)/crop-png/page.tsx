import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CropPngLandingView} from "@/components/marketing/crop-png-landing-view";
import {getCropPngCopy} from "@/lib/marketing/crop-png-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCropPngCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/crop-png",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CropPngLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("crop-png");
  if (!landing || landing.redirectTo) notFound();
  return <CropPngLandingView landing={landing} locale={locale} />;
}
