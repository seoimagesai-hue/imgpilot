"use client";

import {useTranslations} from "next-intl";
import {useCallback, useEffect, useState} from "react";
import {
  bulkApproveBatchAction,
  bulkRejectBatchAction,
  type BatchReviewRow,
} from "@/server/images/ai-metadata-batch-actions";

type Props = {
  projectId: string;
  batchId: string;
  outputLanguage: string;
};

export function BatchReviewPanel({projectId, batchId, outputLanguage}: Props) {
  const t = useTranslations("aiBatches");
  const tm = useTranslations("images.metadata");
  const isRtl = outputLanguage === "ur";
  const [rows, setRows] = useState<BatchReviewRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/projects/${projectId}/metadata/batches/${batchId}/items?view=review`,
    );
    const json = (await res.json()) as {ok?: boolean; rows?: BatchReviewRow[]; error?: string};
    if (json.rows) setRows(json.rows);
    if (!json.ok) setError(json.error ?? "INVALID_REQUEST");
  }, [projectId, batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const msg = (code?: string) => {
    if (!code) return null;
    try {
      return t(`errors.${code}` as "errors.INVALID_REQUEST");
    } catch {
      return code;
    }
  };

  const selectableRows = rows.filter((r) => r.generation && !r.blocked);
  const selectedGenerationIds = [...selected].filter((id) =>
    selectableRows.some((r) => r.generation?.id === id),
  );

  const toggle = (generationId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(generationId)) next.delete(generationId);
      else next.add(generationId);
      return next;
    });
  };

  const selectAllReviewable = () => {
    setSelected(new Set(selectableRows.map((r) => r.generation!.id)));
  };

  const runBulk = async (action: "approve" | "reject") => {
    if (!selectedGenerationIds.length) return;
    setBusy(true);
    setError(null);
    setResultSummary(null);
    try {
      const result =
        action === "approve"
          ? await bulkApproveBatchAction(projectId, batchId, selectedGenerationIds, true)
          : await bulkRejectBatchAction(projectId, batchId, selectedGenerationIds, true);
      if (!result.ok) {
        setError(result.error ?? "INVALID_REQUEST");
        return;
      }
      setResultSummary(
        t("review.resultSummary", {
          attempted: result.attempted ?? 0,
          succeeded: result.succeeded ?? 0,
          failed: (result.failed ?? []).length,
        }),
      );
      setSelected(new Set());
      setConfirmAction(null);
      await load();
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const textDir = isRtl ? "rtl" : "ltr";
  const textAlign = isRtl ? "text-right" : "text-left";

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">{t("review.hint")}</p>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-white p-3">
          <span className="text-sm">{t("review.selected", {count: selected.size})}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmAction("approve")}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {t("review.approveSelected")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmAction("reject")}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t("review.rejectSelected")}
          </button>
          <button type="button" className="text-sm underline" onClick={() => setSelected(new Set())}>
            {t("review.clearSelection")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="text-sm underline"
          onClick={selectAllReviewable}
          disabled={!selectableRows.length}
        >
          {t("review.selectAllReviewable")}
        </button>
      )}

      {confirmAction ? (
        <div
          role="dialog"
          aria-labelledby="batch-review-confirm"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"
        >
          <h2 id="batch-review-confirm" className="font-semibold">
            {confirmAction === "approve" ? t("review.confirmApproveTitle") : t("review.confirmRejectTitle")}
          </h2>
          <p className="mt-2">
            {confirmAction === "approve"
              ? t("review.confirmApproveBody", {count: selectedGenerationIds.length})
              : t("review.confirmRejectBody", {count: selectedGenerationIds.length})}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => runBulk(confirmAction)}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {t("review.confirmYes")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            >
              {t("review.confirmNo")}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {msg(error)}
        </p>
      ) : null}

      {resultSummary ? (
        <p className="text-sm text-emerald-800" role="status">
          {resultSummary}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
          {t("review.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-gray-50/80 text-left">
              <tr>
                <th className="px-3 py-2" scope="col">
                  <span className="sr-only">{t("review.select")}</span>
                </th>
                <th className="px-3 py-2">{t("review.colFile")}</th>
                <th className="px-3 py-2">{t("review.colAlt")}</th>
                <th className="px-3 py-2">{t("review.colTitle")}</th>
                <th className="px-3 py-2">{t("review.colQuality")}</th>
                <th className="px-3 py-2">{t("review.colFlags")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((row) => {
                const gen = row.generation;
                const canSelect = Boolean(gen && !row.blocked);
                return (
                  <tr key={row.itemId} className={row.blocked ? "opacity-60" : undefined}>
                    <td className="px-3 py-2">
                      {canSelect && gen ? (
                        <input
                          type="checkbox"
                          checked={selected.has(gen.id)}
                          disabled={busy}
                          onChange={() => toggle(gen.id)}
                          aria-label={row.originalFilename}
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.originalFilename}</div>
                      <div className="text-xs text-[var(--muted)]">{row.imageStatus}</div>
                      {row.blocked && row.blockReason ? (
                        <div className="text-xs text-red-700">{msg(row.blockReason) ?? row.blockReason}</div>
                      ) : null}
                    </td>
                    <td className={`max-w-xs px-3 py-2 ${textAlign}`} dir={textDir}>
                      {gen?.altText ?? "—"}
                    </td>
                    <td className={`max-w-xs px-3 py-2 ${textAlign}`} dir={textDir}>
                      {gen?.title ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.quality ? (
                        <span className={row.needsReview ? "text-amber-700" : undefined}>
                          {row.quality.overall}
                          {row.needsReview ? ` · ${tm("lowQualityWarn")}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {row.isDuplicate ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                            {t("review.flagDuplicate")}
                          </span>
                        ) : null}
                        {row.needsReview ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                            {t("review.flagLowQuality")}
                          </span>
                        ) : null}
                        {gen?.status === "draft" ? (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{t("review.flagDraft")}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
