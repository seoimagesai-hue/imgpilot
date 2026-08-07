import {getClientEnv} from "@/lib/env";
import {indexableLocalesForPath, isLocalePathIndexable} from "@/i18n/indexability";
import {
  OG_LOCALE_TAGS,
  isAppLocale,
  localePath,
  routing,
  type AppLocale,
} from "@/i18n/routing";

export {localePath} from "@/i18n/routing";

export function getPublicAppOrigin(): string {
  return getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function absoluteUrl(locale: string, path: string): string {
  return `${getPublicAppOrigin()}${localePath(locale, path)}`;
}

/**
 * Hreflang alternates for indexable localized equivalents only (+ x-default English).
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const clean = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const locale of indexableLocalesForPath(clean)) {
    languages[locale] = absoluteUrl(locale, clean);
  }
  // Always advertise English as x-default even if somehow filtered
  languages["x-default"] = absoluteUrl(routing.defaultLocale, clean);
  if (!languages.en) {
    languages.en = absoluteUrl(routing.defaultLocale, clean);
  }
  return languages;
}

export type PublicSeoInput = {
  locale: AppLocale;
  path: string;
  title: string;
  description: string;
  index?: boolean;
};

export function ogLocaleTag(locale: string): string {
  if (isAppLocale(locale)) return OG_LOCALE_TAGS[locale];
  return "en_US";
}

export function buildPublicMetadata(input: PublicSeoInput) {
  const path = input.path === "/" ? "/" : input.path;
  const canonical = absoluteUrl(input.locale, path);
  const gateIndex = isLocalePathIndexable(input.locale, path);
  // Explicit false wins; otherwise require translation quality gate.
  const finalIndex = input.index === false ? false : gateIndex && (input.index ?? true);
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "Img Pilot",
      locale: ogLocaleTag(input.locale),
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: input.title,
      description: input.description,
    },
    robots: finalIndex
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
