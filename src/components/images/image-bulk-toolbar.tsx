"use client";

import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {pollBulkJob} from "@/components/images/poll-processing-job";

const BULK_MAX_IMAGES = 100;

type BulkJobDto = {
  id: string;
  operation: string;
  preset: string | null;
  status: string;
  totalCount: number;
  pendingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  cancelledCount: number;
  cancelRequested: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type BulkOp =
  | {operation: "optimize_same_format"}
  | {operation: "resize"; preset: "px_256" | "px_512" | "px_1024" | "px_2048"}
  | {operation: "convert_format"; targetFormat: "webp" | "avif" | "jpeg" | "png"};

type Props = {
  projectId: string;
  selectedIds: string[];
  filterQ: string;
  filterStatus: string;
  filterSort: string;
  onClearSelection: () => void;
  onSelectAllFiltered: (ids: string[]) => void;
};

function durationMs(job: BulkJobDto): number | null {
  if (!job.startedAt) return null;
  const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
  return Math.max(0, end - new Date(job.startedAt).getTime());
}

export function ImageBulkToolbar({
  projectId,
  selectedIds,
  filterQ,
  filterStatus,
  filterSort,
  onClearSelection,
  onSelectAllFiltered,
}: Props) {
  const t = useTranslations("images.bulk");
  const locale = useLocale();
  const [opKey, setOpKey] = useState("optimize");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<BulkJobDto | null>(null);
  const [recent, setRecent] = useState<BulkJobDto[]>([]);

  const parseOp = (): BulkOp => {
    switch (opKey) {
      case "resize_512":
        return {operation: "resize", preset: "px_512"};
      case "resize_1024":
        return {operation: "resize", preset: "px_1024"};
      case "convert_webp":
        return {operation: "convert_format", targetFormat: "webp"};
      case "convert_avif":
        return {operation: "convert_format", targetFormat: "avif"};
      default:
        return {operation: "optimize_same_format"};
    }
  };

  const selectAllFiltered = async () => {
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        q: filterQ,
        status: filterStatus,
        sort: filterSort,
      });
      const res = await fetch(`/api/projects/${projectId}/processing/bulk/ready-ids?${qs}`);
      const json = (await res.json()) as {ok?: boolean; error?: string; imageIds?: string[]};
      if (!json.ok || !json.imageIds) {
        setError(json.error ?? "INVALID_REQUEST");
        return;
      }
      onSelectAllFiltered(json.imageIds);
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    setError(null);
    const op = parseOp();
    try {
      const createRes = await fetch(`/api/projects/${projectId}/processing/bulk`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          imageIds: selectedIds.slice(0, BULK_MAX_IMAGES),
          ...op,
          idempotencyKey: `bulk:${projectId}:${op.operation}:${Date.now()}`,
        }),
      });
      const createJson = (await createRes.json()) as {
        ok?: boolean;
        error?: string;
        job?: BulkJobDto;
      };
      if (!createJson.ok || !createJson.job) {
        setError(createJson.error ?? "PROCESSING_FAILED");
        return;
      }
      setJob(createJson.job);

      const runRes = await fetch(
        `/api/projects/${projectId}/processing/bulk/${createJson.job.id}?action=run`,
        {method: "POST"},
      );
      const runJson = (await runRes.json()) as {
        ok?: boolean;
        error?: string;
        job?: BulkJobDto;
      };
      if (!runJson.ok || !runJson.job) {
        setError(runJson.error ?? "PROCESSING_FAILED");
        return;
      }
      setJob(runJson.job);

      const polled = await pollBulkJob<BulkJobDto>({
        projectId,
        bulkJobId: runJson.job.id,
        onUpdate: setJob,
      });
      if (polled) {
        setJob(polled);
        setRecent((prev) => [polled, ...prev.filter((j) => j.id !== polled.id)].slice(0, 8));
      }
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const cancelBulk = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/processing/bulk/${job.id}?action=cancel`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; error?: string; job?: BulkJobDto};
      if (json.job) setJob(json.job);
      if (!json.ok) setError(json.error ?? "PROCESSING_FAILED");
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const retryFailed = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/processing/bulk/${job.id}?action=retry_failed`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; error?: string; job?: BulkJobDto};
      if (!json.ok || !json.job) {
        setError(json.error ?? "PROCESSING_FAILED");
        return;
      }
      setJob(json.job);
      const polled = await pollBulkJob<BulkJobDto>({
        projectId,
        bulkJobId: json.job.id,
        onUpdate: setJob,
      });
      if (polled) {
        setJob(polled);
        setRecent((prev) => [polled, ...prev.filter((j) => j.id !== polled.id)].slice(0, 8));
      }
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const remaining = job != null ? job.pendingCount + job.runningCount : 0;
  const dur = job ? durationMs(job) : null;

  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/50 px-3 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{t("selectedCount", {count: selectedIds.length})}</span>
        <button type="button" className="underline" onClick={onClearSelection} disabled={busy}>
          {t("clearSelection")}
        </button>
        <button type="button" className="underline" onClick={selectAllFiltered} disabled={busy}>
          {t("selectAllFiltered")}
        </button>
        <label className="inline-flex items-center gap-2">
          <span className="text-[var(--muted)]">{t("operation")}</span>
          <select
            className="rounded-lg border border-[var(--border)] bg-white px-2 py-1"
            value={opKey}
            disabled={busy}
            onChange={(e) => setOpKey(e.target.value)}
            aria-label={t("operation")}
          >
            <option value="optimize">{t("ops.optimize")}</option>
            <option value="resize_512">{t("ops.resize512")}</option>
            <option value="resize_1024">{t("ops.resize1024")}</option>
            <option value="convert_webp">{t("ops.convertWebp")}</option>
            <option value="convert_avif">{t("ops.convertAvif")}</option>
          </select>
        </label>
        <button
          type="button"
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-white disabled:opacity-50"
          disabled={busy || selectedIds.length === 0}
          onClick={runBulk}
        >
          {busy ? t("running") : t("run")}
        </button>
        {job && (job.status === "running" || job.pendingCount > 0) ? (
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5"
            disabled={busy}
            onClick={cancelBulk}
          >
            {t("cancel")}
          </button>
        ) : null}
        {job && job.failedCount > 0 ? (
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5"
            disabled={busy}
            onClick={retryFailed}
          >
            {t("retryFailed")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-[var(--danger, #b91c1c)]" role="alert">
          {error}
        </p>
      ) : null}

      {job ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--muted)]" aria-live="polite">
          <span>
            {t("statusLabel")}: {job.status}
          </span>
          <span>
            {t("completed")}: {job.completedCount}
          </span>
          <span>
            {t("failed")}: {job.failedCount}
          </span>
          <span>
            {t("skipped")}: {job.skippedCount}
          </span>
          <span>
            {t("cancelled")}: {job.cancelledCount}
          </span>
          <span>
            {t("runningCount")}: {job.runningCount}
          </span>
          <span>
            {t("remaining")}: {remaining}
          </span>
          {dur != null ? (
            <span>
              {t("duration")}: {new Intl.NumberFormat(locale).format(Math.round(dur / 1000))}s
            </span>
          ) : null}
        </div>
      ) : null}

      {recent.length > 0 ? (
        <ul className="space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
          {recent.map((j) => (
            <li key={j.id}>
              {j.status} — {j.completedCount}/{j.totalCount} {j.operation}
              {j.preset ? `:${j.preset}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
