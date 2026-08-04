import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {CompressJpgLandingView} from "@/components/marketing/compress-jpg-landing-view";
import {getCompressJpgCopy} from "@/lib/marketing/compress-jpg-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCompressJpgCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/compress-jpg",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CompressJpgLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("compress-jpg");
  if (!landing || landing.redirectTo) notFound();
  return <CompressJpgLandingView landing={landing} locale={locale} />;
}
