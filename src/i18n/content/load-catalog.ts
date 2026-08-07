import {existsSync, readFileSync} from "node:fs";
import path from "node:path";
import type {AppLocale} from "@/i18n/routing";
import type {HomepageCopy} from "@/lib/marketing/homepage-content";
import type {ToolLandingCopy} from "@/lib/marketing/tool-landing-copy";

const CONTENT_DIR = path.join(process.cwd(), "src/content/locales");

function readLocaleJson<T>(locale: string, name: string): T | null {
  const file = path.join(CONTENT_DIR, locale, `${name}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Locale catalog homepage; falls back to null when missing (caller uses EN/TS). */
export function loadHomepageCatalog(locale: string): HomepageCopy | null {
  return readLocaleJson<HomepageCopy>(locale, "homepage");
}

export function loadToolsCatalog(locale: string): Record<string, ToolLandingCopy> | null {
  return readLocaleJson<Record<string, ToolLandingCopy>>(locale, "tools");
}

export function loadToolLandingFromCatalog(
  locale: AppLocale | string,
  routePath: string,
): ToolLandingCopy | null {
  const catalog = loadToolsCatalog(locale);
  if (!catalog) return null;
  return catalog[routePath] || null;
}

export type SeoLandingsCatalog = {
  registry?: Record<string, Record<string, unknown>>;
  shells?: Record<string, ToolLandingCopy>;
};

export function loadSeoLandingsCatalog(locale: string): SeoLandingsCatalog | null {
  return readLocaleJson<SeoLandingsCatalog>(locale, "seo-landings");
}

export function loadSeoShellFromCatalog(
  locale: AppLocale | string,
  routePath: string,
): ToolLandingCopy | null {
  const catalog = loadSeoLandingsCatalog(locale);
  if (!catalog?.shells) return null;
  return catalog.shells[routePath] || null;
}
