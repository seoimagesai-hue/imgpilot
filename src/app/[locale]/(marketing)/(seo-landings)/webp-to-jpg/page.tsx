import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {WebpToJpgLandingView} from "@/components/marketing/webp-to-jpg-landing-view";
import {getWebpToJpgCopy} from "@/lib/marketing/webp-to-jpg-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getWebpToJpgCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/webp-to-jpg",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function WebpToJpgLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("webp-to-jpg");
  if (!landing || landing.redirectTo) notFound();
  return <WebpToJpgLandingView landing={landing} locale={locale} />;
}
