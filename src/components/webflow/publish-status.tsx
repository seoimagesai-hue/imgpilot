"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";
import {retryWebflowPublishAction, type WebflowActionState} from "@/server/webflow/actions";

const initial: WebflowActionState = {ok: false};

export const RETRYABLE_STATUSES = new Set(["failed", "partially_completed", "stale"]);

export const STATUS_STYLES: Record<string, string> = {
  queued: "bg-gray-100 text-gray-700",
  leased: "bg-blue-100 text-blue-800",
  validating: "bg-blue-100 text-blue-800",
  creating_asset: "bg-blue-100 text-blue-800",
  uploading_asset: "bg-blue-100 text-blue-800",
  verifying_asset: "bg-blue-100 text-blue-800",
  updating_cms_item: "bg-blue-100 text-blue-800",
  verifying_cms_item: "bg-blue-100 text-blue-800",
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

/** Small status pill for a single publish job's current status (+ optional last error code). */
export function PublishStatusBadge({status, lastErrorCode}: {status: string; lastErrorCode?: string | null}) {
  const t = useTranslations("webflow");
  return (
    <>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {t(`jobStatusValues.${status}` as "jobStatusValues.queued")}
      </span>
      {lastErrorCode ? <span className="ms-1 text-xs text-[var(--muted)]">({lastErrorCode})</span> : null}
    </>
  );
}

/** Retry button for one publish job — only renders for jobs in a retryable terminal state. */
export function RetryButton({job}: {job: PublishStatusJob}) {
  const t = useTranslations("webflow");
  const tErr = useTranslations("webflow.errors");
  const [state, action, pending] = useActionState(retryWebflowPublishAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INTERNAL_ERROR");
    } catch {
      return tErr("INTERNAL_ERROR");
    }
  }

  if (!RETRYABLE_STATUSES.has(job.status)) return null;

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
      {state.error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {msg(state.error)}
        </p>
      ) : null}
    </form>
  );
}
