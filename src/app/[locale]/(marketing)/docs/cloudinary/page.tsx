import type {Metadata} from "next";
import {DocsArticle, docsMetadata, type DocSlug} from "@/server/marketing/docs-content";
import {isAppLocale} from "@/server/auth/validation";
import type {AppLocale} from "@/i18n/routing";

export const dynamic = "force-dynamic";

const SLUG = "cloudinary" as DocSlug;
type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale: raw} = await params;
  const locale = (isAppLocale(raw) ? raw : "en") as AppLocale;
  return docsMetadata(SLUG, locale);
}

export default async function Page({params}: Props) {
  const {locale: raw} = await params;
  return <DocsArticle slug={SLUG} locale={isAppLocale(raw) ? raw : "en"} />;
}
