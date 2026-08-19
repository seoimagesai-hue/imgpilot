import {isLocalePathIndexable, indexableLocalesForPath} from "@/i18n/indexability";
import {localePath, routing, type AppLocale} from "@/i18n/routing";
import {listSitemapPaths} from "@/lib/marketing/tool-landing-registry";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function absoluteUrlForOrigin(origin: string, locale: string, path: string): string {
  return `${normalizeOrigin(origin)}${localePath(locale, path)}`;
}

function hreflangAlternatesForOrigin(origin: string, path: string): Record<string, string> {
  const clean = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const base = normalizeOrigin(origin);
  const languages: Record<string, string> = {};
  for (const locale of indexableLocalesForPath(clean)) {
    languages[locale] = `${base}${localePath(locale, clean)}`;
  }
  languages["x-default"] = `${base}${localePath(routing.defaultLocale, clean)}`;
  if (!languages.en) {
    languages.en = `${base}${localePath(routing.defaultLocale, clean)}`;
  }
  return languages;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** XML sitemap index listing every locale child sitemap. */
export function buildSitemapIndexXml(origin: string): string {
  const entries = routing.locales
    .map(
      (locale) =>
        `  <sitemap>\n    <loc>${escapeXml(`${origin}/sitemap/${locale}.xml`)}</loc>\n  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

/** One locale urlset with hreflang alternates for Search Console. */
export function buildLocaleSitemapXml(
  locale: AppLocale,
  origin: string,
): string {
  const paths = listSitemapPaths();
  const urls: string[] = [];

  for (const path of paths) {
    if (!isLocalePathIndexable(locale, path)) continue;

    const alternates = hreflangAlternatesForOrigin(origin, path);
    const hreflangLinks = Object.entries(alternates)
      .map(
        ([lang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`,
      )
      .join("\n");

    const changeFrequency = path === "/" ? "weekly" : "monthly";
    const priority = path === "/" ? "1" : "0.7";

    urls.push(
      [
        "  <url>",
        `    <loc>${escapeXml(absoluteUrlForOrigin(origin, locale, path))}</loc>`,
        hreflangLinks,
        `    <changefreq>${changeFrequency}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n"),
    );
  }

  if (urls.length === 0) {
    throw new Error(`Sitemap for locale "${locale}" has no indexable URLs`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

export function countLocaleSitemapUrls(locale: AppLocale): number {
  return listSitemapPaths().filter((path) => isLocalePathIndexable(locale, path)).length;
}
