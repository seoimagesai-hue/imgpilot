"use client";

import {useTranslations} from "next-intl";

type Props = {
  href?: string | null;
  onDownload?: () => void;
  disabled?: boolean;
};

export function DownloadCard({href, onDownload, disabled}: Props) {
  const t = useTranslations("guest.download");
  return (
    <section className="rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("expires")}</p>
      {href ? (
        <a
          href={href}
          className="mt-3 inline-flex rounded-md bg-[var(--foreground)] px-3 py-2 text-sm text-[var(--background)]"
        >
          {t("button")}
        </a>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={onDownload}
          className="mt-3 inline-flex rounded-md bg-[var(--foreground)] px-3 py-2 text-sm text-[var(--background)] disabled:opacity-50"
        >
          {t("button")}
        </button>
      )}
    </section>
  );
}
