import {getClientEnv} from "@/lib/env";
import {routing, type AppLocale} from "@/i18n/routing";

export function getPublicAppOrigin(): string {
  return getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function absoluteUrl(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicAppOrigin()}/${locale}${clean === "/" ? "" : clean}`;
}

export function hreflangAlternates(path: string): Record<string, string> {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(locale, clean === "/" ? "" : clean);
  }
  languages["x-default"] = absoluteUrl(routing.defaultLocale, clean === "/" ? "" : clean);
  return languages;
}

export type PublicSeoInput = {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  index?: boolean;
};

export function buildPublicMetadata(input: PublicSeoInput) {
  const canonical = absoluteUrl(input.locale, input.path === "/" ? "" : input.path);
  const index = input.index !== false;
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: hreflangAlternates(input.path === "/" ? "/" : input.path),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "SEO Images",
      locale: input.locale === "ur" ? "ur_PK" : "en_US",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: input.title,
      description: input.description,
    },
    robots: index
      ? {index: true, follow: true}
      : {index: false, follow: false},
  };
}

/** Public indexable paths (no locale prefix). Prefer listSitemapPaths() from tool-landing-registry. */
export {listSitemapPaths as PUBLIC_SITEMAP_PATHS_DYNAMIC} from "@/lib/marketing/tool-landing-registry";

/** @deprecated Use listSitemapPaths() — kept temporarily for older imports. */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/pricing",
  "/docs",
  "/compress-image",
  "/resize-image",
  "/crop-image",
  "/convert-image",
  "/privacy",
  "/terms",
] as const;
