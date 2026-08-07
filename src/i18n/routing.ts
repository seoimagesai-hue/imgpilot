import {defineRouting} from "next-intl/routing";

/**
 * English is unprefixed (`/`, `/compress-image`).
 * All other locales use `/{locale}/...`.
 * Never serve English under `/en/`.
 */
export const locales = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "sv",
  "tr",
  "ru",
  "uk",
  "ja",
  "ko",
  "th",
  "id",
  "ms",
  "vi",
  "hi",
  "ar",
  "el",
  "bg",
  "sw",
  "ca",
  "ur",
] as const;

export type AppLocale = (typeof locales)[number];

export const RTL_LOCALES = ["ar", "ur"] as const;
export type RtlLocale = (typeof RTL_LOCALES)[number];

/** Native-script language names for the switcher (no flags). */
export const LOCALE_NATIVE_NAMES: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  sv: "Svenska",
  tr: "Türkçe",
  ru: "Русский",
  uk: "Українська",
  ja: "日本語",
  ko: "한국어",
  th: "ไทย",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  vi: "Tiếng Việt",
  hi: "हिन्दी",
  ar: "العربية",
  el: "Ελληνικά",
  bg: "Български",
  sw: "Kiswahili",
  ca: "Català",
  ur: "اردو",
};

/** Open Graph `locale` tags (Facebook-style region codes where conventional). */
export const OG_LOCALE_TAGS: Record<AppLocale, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  it: "it_IT",
  pt: "pt_PT",
  nl: "nl_NL",
  pl: "pl_PL",
  sv: "sv_SE",
  tr: "tr_TR",
  ru: "ru_RU",
  uk: "uk_UA",
  ja: "ja_JP",
  ko: "ko_KR",
  th: "th_TH",
  id: "id_ID",
  ms: "ms_MY",
  vi: "vi_VN",
  hi: "hi_IN",
  ar: "ar_SA",
  el: "el_GR",
  bg: "bg_BG",
  sw: "sw_KE",
  ca: "ca_ES",
  ur: "ur_PK",
};

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Keep unprefixed English stable; do not redirect `/` based on Accept-Language/cookie.
  localeDetection: false,
});

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

export function localeNativeName(locale: string): string {
  if (isAppLocale(locale)) return LOCALE_NATIVE_NAMES[locale];
  return locale;
}

export function localeDisplayList(): {code: AppLocale; nativeName: string}[] {
  return locales.map((code) => ({code, nativeName: LOCALE_NATIVE_NAMES[code]}));
}

/** Path prefix for a locale (`""` for English, `"/es"` for Spanish). */
export function localePrefix(locale: string): string {
  if (!locale || locale === routing.defaultLocale) return "";
  return `/${locale}`;
}

/**
 * Locale-aware path. English stays unprefixed.
 * Examples: localePath("en","/compress-image") → "/compress-image"
 *           localePath("es","/compress-image") → "/es/compress-image"
 *           localePath("en","/") → "/"
 *           localePath("es","/") → "/es"
 */
export function localePath(locale: string, path: string): string {
  const clean = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const prefix = localePrefix(locale);
  if (clean === "/") return prefix || "/";
  return `${prefix}${clean}`;
}
