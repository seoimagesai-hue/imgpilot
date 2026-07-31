"use client";

import {useLocale, useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <span>{t("label")}</span>
      <select
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--foreground)]"
        value={locale}
        aria-label={t("label")}
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          router.replace(pathname, {locale: nextLocale});
        }}
      >
        <option value="en">{t("english")}</option>
        <option value="ur">{t("urdu")}</option>
      </select>
    </label>
  );
}
