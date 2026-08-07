/**
 * Pick a locale-specific marketing copy pack, falling back to English
 * when the locale pack is missing (intentional for incomplete locales).
 */
export function localizedCopy<T>(
  locale: string,
  packs: {en: T} & Partial<Record<string, T>>,
): T {
  if (locale !== "en" && packs[locale] != null) {
    return packs[locale] as T;
  }
  return packs.en;
}
