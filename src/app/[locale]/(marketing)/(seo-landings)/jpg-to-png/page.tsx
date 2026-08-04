import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {JpgToPngLandingView} from "@/components/marketing/jpg-to-png-landing-view";
import {getJpgToPngCopy} from "@/lib/marketing/jpg-to-png-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getJpgToPngCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/jpg-to-png",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function JpgToPngLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("jpg-to-png");
  if (!landing || landing.redirectTo) notFound();
  return <JpgToPngLandingView landing={landing} locale={locale} />;
}
