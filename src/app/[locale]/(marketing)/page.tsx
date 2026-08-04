import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {HomepageView} from "@/components/marketing/homepage-view";
import {getHomepageCopy} from "@/lib/marketing/homepage-content";
import {getGuestMaxFileBytes} from "@/lib/env";
import {buildPublicMetadata} from "@/server/marketing/seo";
import type {AppLocale} from "@/i18n/routing";

type PageProps = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getHomepageCopy(locale as AppLocale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: "/",
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

export default async function ConsumerHomePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const copy = getHomepageCopy(locale as AppLocale);
  let maxMb = 10;
  try {
    const maxBytes = getGuestMaxFileBytes();
    maxMb = Math.round(maxBytes / (1024 * 1024)) || 10;
  } catch {
    maxMb = 10;
  }
  const maxFileSizeLabel = `${maxMb} MB`;

  return (
    <HomepageView
      copy={copy}
      locale={locale}
      maxFileSizeLabel={maxFileSizeLabel}
      maxMb={maxMb}
    />
  );
}
