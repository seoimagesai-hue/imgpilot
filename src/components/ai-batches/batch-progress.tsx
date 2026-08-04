"use client";

import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useState} from "react";
import {Link} from "@/i18n/navigation";
import {
  isTerminalBatchStatus,
  pollMetadataBatch,
  type MetadataBatchPollDto,
} from "@/components/ai-batches/poll-metadata-batch";
import type {AiMetadataBatchDto} from "@/server/images/ai-metadata-batch-actions";

type Props = {
  projectId: string;
  batchId: string;
  initialBatch: AiMetadataBatchDto;
};

function toPollDto(batch: AiMetadataBatchDto): MetadataBatchPollDto {
  return {
    id: batch.id,
    status: batch.status,
    queuedCount: batch.queuedCount,
    runningCount: batch.runningCount,
    draftCount: batch.draftCount,
    failedCount: batch.failedCount,
    cancelledCount: batch.cancelledCount,
    staleCount: batch.staleCount,
    skippedCount: batch.skippedCount,
    approvedCount: batch.approvedCount,
    rejectedCount: batch.rejectedCount,
    reviewedCount: batch.reviewedCount,
    totalCount: batch.totalCount,
    eligibleCount: batch.eligibleCount,
    cancelRequested: batch.cancelRequested,
  };
}

export function BatchProgress({projectId, batchId, initialBatch}: Props) {
  const t = useTranslations("aiBatches");
  const locale = useLocale();
  const [batch, setBatch] = useState<MetadataBatchPollDto>(() => toPollDto(initialBatch));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/metadata/batches/${batchId}`);
    const json = (await res.json()) as {ok?: boolean; batch?: MetadataBatchPollDto; error?: string};
    if (json.ok && json.batch) setBatch(json.batch);
    else if (json.error) setError(json.error);
  }, [projectId, batchId]);

  useEffect(() => {
    if (isTerminalBatchStatus(batch.status) && batch.queuedCount + batch.runningCount === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      await pollMetadataBatch({
        projectId,
        batchId,
        onUpdate: (b) => {
          if (!cancelled) setBatch(b);
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, batchId, batch.status, batch.queuedCount, batch.runningCount]);

  const msg = (code: string) => {
    try {
      return t(`errors.${code}` as "errors.INVALID_REQUEST");
    } catch {
      return code;
    }
  };

  const postAction = async (action: "cancel" | "retry_failed") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metadata/batches/${batchId}?action=${action}`,
        {method: "POST"},
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        batch?: MetadataBatchPollDto;
      };
      if (!json.ok) {
        setError(json.error ?? "INVALID_REQUEST");
        return;
      }
      if (json.batch) setBatch(json.batch);
      if (action === "retry_failed" && json.batch) {
        await pollMetadataBatch({projectId, batchId, onUpdate: setBatch});
      } else {
        await refresh();
      }
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const active = batch.queuedCount + batch.runningCount;
  const reviewReady = batch.draftCount + batch.reviewedCount > 0;
  const canCancel =
    !isTerminalBatchStatus(batch.status) || batch.status === "cancelling" || active > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("progress.title")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("progress.status")}: {t(`status.${batch.status}` as "status.running")}
            {batch.cancelRequested ? ` · ${t("progress.cancelRequested")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancel && active > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => postAction("cancel")}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
            >
              {t("progress.cancel")}
            </button>
          ) : null}
          {batch.failedCount > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => postAction("retry_failed")}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
            >
              {t("progress.retryFailed")}
            </button>
          ) : null}
          {reviewReady ? (
            <Link
              href={`/dashboard/projects/${projectId}/ai-batches/${batchId}/review`}
              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
            >
              {t("progress.openReview")}
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {msg(error)}
        </p>
      ) : null}

      <dl
        className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"
        aria-live="polite"
      >
        {(
          [
            ["queued", batch.queuedCount],
            ["running", batch.runningCount],
            ["draft", batch.draftCount],
            ["reviewed", batch.reviewedCount],
            ["approved", batch.approvedCount],
            ["rejected", batch.rejectedCount],
            ["failed", batch.failedCount],
            ["cancelled", batch.cancelledCount],
            ["stale", batch.staleCount],
            ["skipped", batch.skippedCount],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-[var(--border)] bg-gray-50/50 px-3 py-2">
            <dt className="text-[var(--muted)]">{t(`counters.${key}`)}</dt>
            <dd className="text-lg font-semibold">{new Intl.NumberFormat(locale).format(value)}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-[var(--muted)]">
        {t("progress.summary", {
          eligible: batch.eligibleCount,
          total: batch.totalCount,
          active,
        })}
      </p>
    </div>
  );
}
