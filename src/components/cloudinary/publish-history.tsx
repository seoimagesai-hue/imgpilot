"use client";

import {useFormatter, useTranslations} from "next-intl";
import {PublishStatusBadge, RetryButton, RETRYABLE_STATUSES} from "@/components/cloudinary/publish-status";

/**
 * DTO for one row of publish history. Deliberately excludes credentials and
 * any other server-internal fields — only display-safe columns already part
 * of `CloudinaryPublishJobDto`. Mirrors `components/webflow/publish-history.tsx`.
 */
export type PublishHistoryJob = {
  id: string;
  projectId: string;
  connectionId: string;
  requestedPublicId: string | null;
  remotePublicId: string | null;
  deliveryType: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastErrorCode: string | null;
  updatedAt: Date | string;
};

type PublishHistoryProps = {
  jobs: PublishHistoryJob[];
  showRetry?: boolean;
};

/** Table of past Cloudinary publish attempts — used on connection detail and project publish pages. */
export function PublishHistory({jobs, showRetry = true}: PublishHistoryProps) {
  const t = useTranslations("cloudinary");
  const format = useFormatter();

  if (jobs.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{t("recentPublishesEmpty")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-3 py-2">{t("columnPublicId")}</th>
            <th className="px-3 py-2">{t("columnDelivery")}</th>
            <th className="px-3 py-2">{t("columnJobStatus")}</th>
            <th className="px-3 py-2">{t("columnAttempts")}</th>
            <th className="px-3 py-2">{t("columnUpdated")}</th>
            {showRetry ? <th className="px-3 py-2">{t("columnActions")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-[var(--border)] last:border-b-0">
              <td className="max-w-[240px] truncate px-3 py-2 font-mono text-xs">
                {job.remotePublicId || job.requestedPublicId}
              </td>
              <td className="px-3 py-2">
                {t(`deliveryTypeValues.${job.deliveryType}` as "deliveryTypeValues.upload")}
              </td>
              <td className="px-3 py-2">
                <PublishStatusBadge status={job.status} lastErrorCode={job.lastErrorCode} />
              </td>
              <td className="px-3 py-2 tabular-nums">
                {job.attemptCount} / {job.maxAttempts}
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">
                {format.dateTime(new Date(job.updatedAt), {dateStyle: "medium", timeStyle: "short", timeZone: "UTC"})}
              </td>
              {showRetry ? (
                <td className="px-3 py-2">{RETRYABLE_STATUSES.has(job.status) ? <RetryButton job={job} /> : null}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
