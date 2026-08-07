import type {MetadataRoute} from "next";
import {isLocalePathIndexable} from "@/i18n/indexability";
import {routing} from "@/i18n/routing";
import {listSitemapPaths} from "@/lib/marketing/tool-landing-registry";
import {absoluteUrl, hreflangAlternates} from "@/server/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = listSitemapPaths();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
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
  }
  return entries;
}
