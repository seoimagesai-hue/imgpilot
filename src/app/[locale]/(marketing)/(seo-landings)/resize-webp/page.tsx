import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ResizeWebpLandingView} from "@/components/marketing/resize-webp-landing-view";
import {getResizeWebpCopy} from "@/lib/marketing/resize-webp-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getResizeWebpCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/resize-webp",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ResizeWebpLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("resize-webp");
  if (!landing || landing.redirectTo) notFound();
  return <ResizeWebpLandingView landing={landing} locale={locale} />;
}
