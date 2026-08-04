"use client";

import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";

export function UpgradeBanner() {
  const t = useTranslations("guest.upgrade");
  return (
    <aside className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm">
      <p className="font-medium">{t("title")}</p>
      <p className="mt-1 text-[var(--muted-foreground)]">{t("body")}</p>
      <Link href="/pricing" className="mt-2 inline-block underline">
        {t("cta")}
      </Link>
    </aside>
  );
}
