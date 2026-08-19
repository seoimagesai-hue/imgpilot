import type {MetadataRoute} from "next";
import {isLocalePathIndexable} from "@/i18n/indexability";
import {routing, type AppLocale} from "@/i18n/routing";
import {listSitemapPaths} from "@/lib/marketing/tool-landing-registry";
import {absoluteUrl, hreflangAlternates} from "@/server/marketing/seo";

/** One child sitemap per locale keeps each file small for Search Console fetch limits. */
export async function generateSitemaps() {
  return routing.locales.map((locale) => ({id: locale}));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const locale = (await id) as AppLocale;
  const paths = listSitemapPaths();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    if (!isLocalePathIndexable(locale, path)) continue;
    entries.push({
      url: absoluteUrl(locale, path),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: hreflangAlternates(path),
      },
    });
  }

  return entries;
}
