"use client";

import {useTranslations} from "next-intl";

export function EmptyState() {
  const t = useTranslations("guest.empty");
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
      <p className="font-medium">{t("title")}</p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("body")}</p>
    </div>
  );
}
