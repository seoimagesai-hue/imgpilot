import {existsSync, readFileSync} from "node:fs";
import path from "node:path";
import {locales, type AppLocale} from "@/i18n/routing";

export type TranslationStatus =
  | "missing"
  | "machine_translated"
  | "reviewed"
  | "approved"
  | "stale"
  | "english_fallback";

export type LocaleStatusFile = {
  locale: string;
  updatedAt: string;
  layers: {
    layer1_ui: TranslationStatus;
    layer2_tools: TranslationStatus;
    layer3_homepage: TranslationStatus;
    layer4_seo: TranslationStatus;
  };
  pages: Record<string, TranslationStatus>;
};

const STATUS_DIR = path.join(process.cwd(), "src/content/locales/_status");

function readStatus(locale: string): LocaleStatusFile | null {
  const file = path.join(STATUS_DIR, `${locale}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as LocaleStatusFile;
  } catch {
    return null;
  }
}

const INDEXABLE_STATUSES = new Set<TranslationStatus>([
  "machine_translated",
  "reviewed",
  "approved",
]);

/**
 * English is always indexable. Other locales require a non-missing page status
 * written by `npm run i18n:audit` after catalogs are complete.
 */
export function isLocalePathIndexable(locale: string, routePath: string): boolean {
  if (locale === "en" || locale === "default") return true;
  if (!(locales as readonly string[]).includes(locale)) return false;
  const status = readStatus(locale);
  if (!status) return false;
  if (status.layers.layer1_ui === "missing") return false;
  const normalized = routePath === "" ? "/" : routePath.startsWith("/") ? routePath : `/${routePath}`;
  const pageStatus = status.pages[normalized];
  if (!pageStatus) return false;
  return INDEXABLE_STATUSES.has(pageStatus);
}

/** Locales that may appear in hreflang for a given path. */
export function indexableLocalesForPath(routePath: string): AppLocale[] {
  return locales.filter((locale) => isLocalePathIndexable(locale, routePath));
}
