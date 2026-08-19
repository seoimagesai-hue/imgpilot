import {routing} from "@/i18n/routing";
import {getPublicAppOrigin} from "@/server/marketing/seo";

/** XML sitemap index listing every locale child sitemap. */
export function buildSitemapIndexXml(origin = getPublicAppOrigin()): string {
  const entries = routing.locales
    .map(
      (locale) =>
        `  <sitemap>\n    <loc>${origin}/sitemap/${locale}.xml</loc>\n  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}
