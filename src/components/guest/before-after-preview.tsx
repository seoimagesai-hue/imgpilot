"use client";

import {useTranslations} from "next-intl";

export type PreviewMeta = {
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  format?: string | null;
};

type Props = {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeMeta?: PreviewMeta | null;
  afterMeta?: PreviewMeta | null;
  savedLabel?: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MetaLine({meta}: {meta?: PreviewMeta | null}) {
  const t = useTranslations("guest.compare");
  if (!meta) return null;
  const parts: string[] = [];
  if (meta.width && meta.height) parts.push(`${meta.width}×${meta.height}`);
  if (meta.bytes != null) parts.push(formatBytes(meta.bytes));
  if (meta.format) parts.push(meta.format.toUpperCase());
  if (parts.length === 0) return null;
  return (
    <p className="text-xs text-[var(--muted-foreground)]" aria-label={t("metaAria")}>
      {parts.join(" · ")}
    </p>
  );
}

export function BeforeAfterPreview({
  beforeUrl,
  afterUrl,
  beforeMeta,
  afterMeta,
  savedLabel,
}: Props) {
  const t = useTranslations("guest.compare");

  if (!beforeUrl) return null;

  return (
    <section className="space-y-3" aria-labelledby="before-after-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="before-after-title" className="text-sm font-semibold">
          {t("previewTitle")}
        </h2>
        {savedLabel ? (
          <p className="text-sm font-medium text-[var(--accent)]">{savedLabel}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt={t("before")} className="aspect-[4/3] w-full object-contain" />
          <figcaption className="space-y-1 border-t border-[var(--border)] px-3 py-2">
            <p className="text-xs font-medium">{t("before")}</p>
            <MetaLine meta={beforeMeta} />
          </figcaption>
        </figure>
        <figure className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {afterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={afterUrl} alt={t("after")} className="aspect-[4/3] w-full object-contain" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-[var(--muted)]/15 text-sm text-[var(--muted-foreground)]">
              {t("afterPlaceholder")}
            </div>
          )}
          <figcaption className="space-y-1 border-t border-[var(--border)] px-3 py-2">
            <p className="text-xs font-medium">{t("after")}</p>
            <MetaLine meta={afterMeta} />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
