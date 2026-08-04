import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CropWebpLandingView} from "@/components/marketing/crop-webp-landing-view";
import {getCropWebpCopy} from "@/lib/marketing/crop-webp-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCropWebpCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/crop-webp",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CropWebpLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("crop-webp");
  if (!landing || landing.redirectTo) notFound();
  return <CropWebpLandingView landing={landing} locale={locale} />;
}
