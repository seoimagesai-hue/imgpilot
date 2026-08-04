import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {GeotagImageLandingView} from "@/components/marketing/geotag-image-landing-view";
import {getGeotagImageCopy} from "@/lib/marketing/geotag-image-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getGeotagImageCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/geotag-image",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function GeotagImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <GeotagImageLandingView locale={locale} />;
}
