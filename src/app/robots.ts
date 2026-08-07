import type {MetadataRoute} from "next";
import {routing} from "@/i18n/routing";
import {getPublicAppOrigin, localePath} from "@/server/marketing/seo";

/** Disallow private app areas for English (unprefixed) and every locale prefix. */
function disallowPatterns(): string[] {
  const bases = ["/api/", "/dashboard/", "/account/", "/admin/"];
  const out = new Set<string>(bases);
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    for (const base of bases) {
      out.add(localePath(locale, base));
    }
  }
  return [...out];
}

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicAppOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowPatterns(),
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
