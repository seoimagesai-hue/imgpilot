import type {MetadataRoute} from "next";
import {routing} from "@/i18n/routing";
import {listSitemapPaths} from "@/lib/marketing/tool-landing-registry";
import {getPublicAppOrigin} from "@/server/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicAppOrigin();
  const paths = listSitemapPaths();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of paths) {
      const suffix = path === "/" ? "" : path;
      entries.push({
        url: `${origin}/${locale}${suffix}`,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.7,
      });
    }
  }
  return entries;
}
