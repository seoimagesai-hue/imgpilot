import {setRequestLocale} from "next-intl/server";
import type {Metadata} from "next";
import {ToolLandingShell} from "@/components/marketing/tool-landing-shell";
import type {AppLocale} from "@/i18n/routing";
import {getToolLandingCopyForLocale} from "@/lib/marketing/tool-landing-copy";
import {buildPublicMetadata} from "@/server/marketing/seo";

type PageProps = {params: Promise<{locale: string}>};
const PATH = "/compress-image";

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const copy = getToolLandingCopyForLocale(PATH, locale);
  return buildPublicMetadata({
    locale: locale as AppLocale,
    path: PATH,
    title: copy.metaTitle,
    description: copy.metaDescription,
    index: true,
  });
}

export default async function CompressImagePage({params}: PageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  return (
    <ToolLandingShell
      locale={locale}
      copy={getToolLandingCopyForLocale(PATH, locale)}
      toolId="compress"
    />
  );
}
