import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CompressWebpLandingView} from "@/components/marketing/compress-webp-landing-view";
import {getCompressWebpCopy} from "@/lib/marketing/compress-webp-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCompressWebpCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/compress-webp",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CompressWebpLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("compress-webp");
  if (!landing || landing.redirectTo) notFound();
  return <CompressWebpLandingView landing={landing} locale={locale} />;
}
