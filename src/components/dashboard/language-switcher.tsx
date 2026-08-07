"use client";

import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {localeDisplayList, type AppLocale} from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const options = localeDisplayList();

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="sr-only sm:not-sr-only sm:inline">{t("label")}</span>
      <select
        className="max-w-[11rem] rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--foreground)]"
        value={locale}
        aria-label={t("label")}
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          // Keep equivalent page; drop job/result query state on locale change.
          router.replace(pathname, {locale: nextLocale});
          if (typeof window !== "undefined" && window.location.search) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code} lang={option.code}>
            {option.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
