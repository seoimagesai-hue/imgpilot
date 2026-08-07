import {getRequestConfig} from "next-intl/server";
import {hasLocale} from "next-intl";
import {routing, type AppLocale} from "./routing";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {...base};
  for (const [key, value] of Object.entries(overlay)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key] as Record<string, unknown>, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Static import map so webpack can resolve every locale pack.
 * Missing packs are empty objects — English remains the merge base.
 */
const coreLoaders: Record<AppLocale, () => Promise<{default: Record<string, unknown>}>> = {
  en: () => import("../messages/en.json"),
  es: () => import("../messages/es.json"),
  fr: () => import("../messages/fr.json"),
  de: () => import("../messages/de.json"),
  it: () => import("../messages/it.json"),
  pt: () => import("../messages/pt.json"),
  nl: () => import("../messages/nl.json"),
  pl: () => import("../messages/pl.json"),
  sv: () => import("../messages/sv.json"),
  tr: () => import("../messages/tr.json"),
  ru: () => import("../messages/ru.json"),
  uk: () => import("../messages/uk.json"),
  ja: () => import("../messages/ja.json"),
  ko: () => import("../messages/ko.json"),
  th: () => import("../messages/th.json"),
  id: () => import("../messages/id.json"),
  ms: () => import("../messages/ms.json"),
  vi: () => import("../messages/vi.json"),
  hi: () => import("../messages/hi.json"),
  ar: () => import("../messages/ar.json"),
  el: () => import("../messages/el.json"),
  bg: () => import("../messages/bg.json"),
  sw: () => import("../messages/sw.json"),
  ca: () => import("../messages/ca.json"),
  ur: () => import("../messages/ur.json"),
};

const guestLoaders: Record<AppLocale, () => Promise<{default: Record<string, unknown>}>> = {
  en: () => import("../messages/guest/en.json"),
  es: () => import("../messages/guest/es.json"),
  fr: () => import("../messages/guest/fr.json"),
  de: () => import("../messages/guest/de.json"),
  it: () => import("../messages/guest/it.json"),
  pt: () => import("../messages/guest/pt.json"),
  nl: () => import("../messages/guest/nl.json"),
  pl: () => import("../messages/guest/pl.json"),
  sv: () => import("../messages/guest/sv.json"),
  tr: () => import("../messages/guest/tr.json"),
  ru: () => import("../messages/guest/ru.json"),
  uk: () => import("../messages/guest/uk.json"),
  ja: () => import("../messages/guest/ja.json"),
  ko: () => import("../messages/guest/ko.json"),
  th: () => import("../messages/guest/th.json"),
  id: () => import("../messages/guest/id.json"),
  ms: () => import("../messages/guest/ms.json"),
  vi: () => import("../messages/guest/vi.json"),
  hi: () => import("../messages/guest/hi.json"),
  ar: () => import("../messages/guest/ar.json"),
  el: () => import("../messages/guest/el.json"),
  bg: () => import("../messages/guest/bg.json"),
  sw: () => import("../messages/guest/sw.json"),
  ca: () => import("../messages/guest/ca.json"),
  ur: () => import("../messages/guest/ur.json"),
};

async function loadJson(
  loader: () => Promise<{default: Record<string, unknown>}>,
): Promise<Record<string, unknown>> {
  try {
    return (await loader()).default;
  } catch {
    return {};
  }
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const enCore = await loadJson(coreLoaders.en);
  const enGuest = await loadJson(guestLoaders.en);
  const localeCore = locale === "en" ? {} : await loadJson(coreLoaders[locale as AppLocale]);
  const localeGuest = locale === "en" ? {} : await loadJson(guestLoaders[locale as AppLocale]);

  const core = deepMerge(enCore, localeCore);
  const guest = deepMerge(enGuest, localeGuest);

  return {
    locale,
    messages: deepMerge(core, {guest}),
  };
});
