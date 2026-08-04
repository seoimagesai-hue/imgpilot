import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PngToJpgLandingView} from "@/components/marketing/png-to-jpg-landing-view";
import {getPngToJpgCopy} from "@/lib/marketing/png-to-jpg-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getPngToJpgCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/png-to-jpg",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function PngToJpgLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("png-to-jpg");
  if (!landing || landing.redirectTo) notFound();
  return <PngToJpgLandingView landing={landing} locale={locale} />;
}
