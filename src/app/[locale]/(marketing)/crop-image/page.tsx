import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {CropImageLandingView} from "@/components/marketing/crop-image-landing-view";
import {getCropImageCopy} from "@/lib/marketing/crop-image-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCropImageCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/crop-image",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CropImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <CropImageLandingView locale={locale} />;
}
