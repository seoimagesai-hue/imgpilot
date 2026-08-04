"use client";

import {useTranslations} from "next-intl";
import {formatByteSize} from "@/lib/format-bytes";
import type {ReadySummaryDto} from "@/server/images/ready-service";

export type ProjectReadySummaryProps = {
  summary: ReadySummaryDto;
  locale: string;
};

export function ProjectReadySummary({summary, locale}: ProjectReadySummaryProps) {
  const t = useTranslations("images.ready");

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm shadow-sm"
      aria-labelledby="project-ready-summary-heading"
    >
      <h2 id="project-ready-summary-heading" className="text-base font-semibold">
        {t("summaryTitle")}
      </h2>
      <p className="mt-1 text-[var(--muted)]">{t("summaryHint")}</p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-[var(--muted)]">{t("readyCount")}</dt>
          <dd className="font-medium">{summary.readyImageCount.toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("activeCount")}</dt>
          <dd className="font-medium">{summary.activeImageCount.toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("processingJobs")}</dt>
          <dd className="font-medium">{summary.processingCount.toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("optimizedDerivatives")}</dt>
          <dd className="font-medium">
            {summary.optimizedDerivativeCount.toLocaleString(locale)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("resizeDerivatives")}</dt>
          <dd className="font-medium">
            {summary.resizeDerivativeCount.toLocaleString(locale)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("convertedDerivatives")}</dt>
          <dd className="font-medium">
            {summary.convertedDerivativeCount.toLocaleString(locale)}
          </dd>
        </div>
        {summary.storageEffectiveBytes != null ? (
          <div>
            <dt className="text-[var(--muted)]">{t("storage")}</dt>
            <dd className="font-medium">
              {formatByteSize(summary.storageEffectiveBytes, locale)}
            </dd>
          </div>
        ) : null}
        {summary.generatedOutputBytes != null ? (
          <div>
            <dt className="text-[var(--muted)]">{t("generatedStorage")}</dt>
            <dd className="font-medium">
              {formatByteSize(summary.generatedOutputBytes, locale)}
            </dd>
          </div>
        ) : null}
        {summary.reservedUploadBytes != null && summary.reservedUploadBytes > 0 ? (
          <div>
            <dt className="text-[var(--muted)]">{t("reserved")}</dt>
            <dd className="font-medium">
              {formatByteSize(summary.reservedUploadBytes, locale)}
            </dd>
          </div>
        ) : null}
        {summary.cleanupPendingBytes != null && summary.cleanupPendingBytes > 0 ? (
          <div>
            <dt className="text-[var(--muted)]">{t("cleanupPending")}</dt>
            <dd className="font-medium">
              {formatByteSize(summary.cleanupPendingBytes, locale)}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
