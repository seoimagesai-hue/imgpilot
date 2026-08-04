"use client";

import {useTranslations} from "next-intl";

type Props = {
  children?: React.ReactNode;
  empty?: boolean;
};

export function ResultCard({children, empty}: Props) {
  const t = useTranslations("guest.result");
  return (
    <section className="rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <div className="mt-2 text-sm text-[var(--muted-foreground)]">
        {empty || !children ? t("empty") : children}
      </div>
    </section>
  );
}
