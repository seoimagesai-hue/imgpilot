import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {ResizeImageLandingView} from "@/components/marketing/resize-image-landing-view";
import {getResizeImageCopy} from "@/lib/marketing/resize-image-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getResizeImageCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/resize-image",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ResizeImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ResizeImageLandingView locale={locale} />;
}
