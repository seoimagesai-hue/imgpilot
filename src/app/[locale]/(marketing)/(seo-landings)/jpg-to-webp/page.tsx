import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {JpgToWebpLandingView} from "@/components/marketing/jpg-to-webp-landing-view";
import {getJpgToWebpCopy} from "@/lib/marketing/jpg-to-webp-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getJpgToWebpCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/jpg-to-webp",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function JpgToWebpLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("jpg-to-webp");
  if (!landing || landing.redirectTo) notFound();
  return <JpgToWebpLandingView landing={landing} locale={locale} />;
}
