import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ResizePngLandingView} from "@/components/marketing/resize-png-landing-view";
import {getResizePngCopy} from "@/lib/marketing/resize-png-landing-content";
import {getToolLanding} from "@/lib/marketing/tool-landing-registry";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getResizePngCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/resize-png",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ResizePngLandingPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const landing = getToolLanding("resize-png");
  if (!landing || landing.redirectTo) notFound();
  return <ResizePngLandingView landing={landing} locale={locale} />;
}
