import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CropJpgLandingView} from "@/components/marketing/crop-jpg-landing-view";
import {getCropJpgCopy} from "@/lib/marketing/crop-jpg-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCropJpgCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/crop-jpg",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CropJpgLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("crop-jpg");
  if (!landing || landing.redirectTo) notFound();
  return <CropJpgLandingView landing={landing} locale={locale} />;
}
