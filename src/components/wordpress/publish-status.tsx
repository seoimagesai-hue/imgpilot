"use client";

import {useActionState} from "react";
import {useFormatter, useTranslations} from "next-intl";
import {retryWordpressPublishAction, type WordpressActionState} from "@/server/wordpress/actions";

const initial: WordpressActionState = {ok: false};

const RETRYABLE_STATUSES = new Set(["failed", "partially_completed", "stale"]);

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-gray-100 text-gray-700",
  leased: "bg-blue-100 text-blue-800",
  validating: "bg-blue-100 text-blue-800",
  uploading_media: "bg-blue-100 text-blue-800",
  updating_metadata: "bg-blue-100 text-blue-800",
  verifying_remote: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  partially_completed: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  stale: "bg-gray-100 text-gray-700",
};

export type PublishStatusJob = {
  id: string;
  projectId: string;
  requestedFilename: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastErrorCode: string | null;
  updatedAt: Date | string;
};

function RetryButton({job}: {job: PublishStatusJob}) {
  const t = useTranslations("wordpress");
  const tErr = useTranslations("wordpress.errors");
  const [state, action, pending] = useActionState(retryWordpressPublishAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={job.projectId} />
      <input type="hidden" name="jobId" value={job.id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        {pending ? t("retrying") : t("retry")}
      </button>
      {state.error ? <p className="mt-1 text-xs text-red-700">{msg(state.error)}</p> : null}
    </form>
  );
}

type PublishStatusProps = {
  jobs: PublishStatusJob[];
  showRetry?: boolean;
};

export function PublishStatus({jobs, showRetry = true}: PublishStatusProps) {
  const t = useTranslations("wordpress");
  const format = useFormatter();

  if (jobs.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{t("recentPublishesEmpty")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-3 py-2">{t("columnFilename")}</th>
            <th className="px-3 py-2">{t("columnJobStatus")}</th>
            <th className="px-3 py-2">{t("columnAttempts")}</th>
            <th className="px-3 py-2">{t("columnUpdated")}</th>
            {showRetry ? <th className="px-3 py-2">{t("columnActions")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-[var(--border)] last:border-b-0">
              <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs">{job.requestedFilename}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[job.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t(`jobStatusValues.${job.status}` as "jobStatusValues.queued")}
                </span>
                {job.lastErrorCode ? <span className="ms-1 text-xs text-[var(--muted)]">({job.lastErrorCode})</span> : null}
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
