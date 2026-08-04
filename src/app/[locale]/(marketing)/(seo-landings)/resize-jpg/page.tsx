import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ResizeJpgLandingView} from "@/components/marketing/resize-jpg-landing-view";
import {RESIZE_JPG_META} from "@/lib/marketing/resize-jpg-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/resize-jpg",
    title: RESIZE_JPG_META.title,
    description: RESIZE_JPG_META.description,
    index: true,
  });
}

export default async function ResizeJpgLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("resize-jpg");
  if (!landing || landing.redirectTo) notFound();
  return <ResizeJpgLandingView landing={landing} locale={locale} />;
}
