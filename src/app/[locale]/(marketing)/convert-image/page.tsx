import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {ConvertImageLandingView} from "@/components/marketing/convert-image-landing-view";
import {getConvertImageCopy} from "@/lib/marketing/convert-image-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getConvertImageCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/convert-image",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ConvertImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ConvertImageLandingView locale={locale} />;
}
