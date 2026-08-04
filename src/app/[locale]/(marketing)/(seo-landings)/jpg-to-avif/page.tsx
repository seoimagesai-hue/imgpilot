import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {JpgToAvifLandingView} from "@/components/marketing/jpg-to-avif-landing-view";
import {getJpgToAvifCopy} from "@/lib/marketing/jpg-to-avif-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getJpgToAvifCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/jpg-to-avif",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function JpgToAvifLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("jpg-to-avif");
  if (!landing || landing.redirectTo) notFound();
  return <JpgToAvifLandingView landing={landing} locale={locale} />;
}
