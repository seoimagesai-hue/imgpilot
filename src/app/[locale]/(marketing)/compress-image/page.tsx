import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {CompressImageLandingView} from "@/components/marketing/compress-image-landing-view";
import {getCompressImageCopy} from "@/lib/marketing/compress-image-landing-content";
import type {AppLocale} from "@/i18n/routing";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getCompressImageCopy(locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/compress-image",
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CompressImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <CompressImageLandingView locale={locale} />;
}
