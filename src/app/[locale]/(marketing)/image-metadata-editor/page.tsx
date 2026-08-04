import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {ImageMetadataEditorLandingView} from "@/components/marketing/image-metadata-editor-landing-view";
import {getImageMetadataEditorCopy} from "@/lib/marketing/image-metadata-editor-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getImageMetadataEditorCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/image-metadata-editor",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function ImageMetadataEditorPage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ImageMetadataEditorLandingView locale={locale} />;
}
