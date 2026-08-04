"use client";

import {useLocale, useTranslations} from "next-intl";
import {useEffect, useId, useRef, useState} from "react";
import {formatByteSize} from "@/lib/format-bytes";
import {pollProcessingJob} from "@/components/images/poll-processing-job";

type JobDto = {
  id: string;
  status: string;
  sourceByteSize: number;
  outputByteSize: number | null;
  sourceDetectedFormat: string | null;
  outputDetectedFormat: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  outputWidth: number | null;
  outputHeight: number | null;
  byteDifference: number | null;
  percentDifference: number | null;
  lastErrorCode: string | null;
  attemptCount: number;
  maxAttempts: number;
};

type Props = {
  projectId: string;
  imageId: string;
  imageStatus: string;
  originalFilename: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  detectedFormat: string | null;
};

export function ImageOptimizePanel({
  projectId,
  imageId,
  imageStatus,
  originalFilename,
  sizeBytes,
  width,
  height,
  detectedFormat,
}: Props) {
  const t = useTranslations("images.processing");
  const locale = useLocale();
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const optimizeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusLive, setStatusLive] = useState("");

  const eligible = imageStatus === "ready_for_processing";

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        setOpen(false);
        optimizeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (!eligible && !job) {
    return (
      <p className="text-sm text-[var(--muted)]">{t("notEligible")}</p>
    );
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    setPreviewUrl(null);
    setStatusLive(t("processing"));
    try {
      const createRes = await fetch(`/api/projects/${projectId}/processing/jobs`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          imageId,
          idempotencyKey: `opt:${imageId}:${Date.now()}`,
        }),
      });
      const createJson = (await createRes.json()) as {
        ok?: boolean;
        error?: string;
        job?: JobDto;
      };
      if (!createJson.ok || !createJson.job) {
        setError(createJson.error ?? "PROCESSING_FAILED");
        setStatusLive(t("status.failed"));
        return;
      }

      setJob(createJson.job);

      const polled = await pollProcessingJob<JobDto>({
        projectId,
        jobId: createJson.job.id,
        onUpdate: (next) => {
          setJob(next);
          setStatusLive(t(`status.${next.status}` as "status.completed"));
        },
      });
      if (polled) {
        setJob(polled);
        setStatusLive(t(`status.${polled.status}` as "status.completed"));
        if (polled.status !== "completed") {
          setError(polled.lastErrorCode ?? "PROCESSING_FAILED");
        }
      } else {
        setError("PROCESSING_FAILED");
      }
    } catch {
      setError("PROCESSING_FAILED");
      setStatusLive(t("status.failed"));
    } finally {
      setBusy(false);
      setOpen(false);
      optimizeRef.current?.focus();
    }
  };

  const retry = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    setStatusLive(t("processing"));
    try {
      const res = await fetch(
        `/api/projects/${projectId}/processing/jobs/${job.id}?action=retry`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; error?: string; job?: JobDto};
      if (!json.ok || !json.job) {
        setError(json.error ?? "PROCESSING_FAILED");
        return;
      }
      setJob(json.job);
      const polled = await pollProcessingJob<JobDto>({
        projectId,
        jobId: json.job.id,
        onUpdate: (next) => {
          setJob(next);
          setStatusLive(t(`status.${next.status}` as "status.completed"));
        },
      });
      if (polled) {
        setJob(polled);
        setStatusLive(t(`status.${polled.status}` as "status.completed"));
        if (polled.status !== "completed") {
          setError(polled.lastErrorCode ?? "PROCESSING_FAILED");
        }
      }
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    if (!job || job.status !== "completed") return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/processing/jobs/${job.id}/preview`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; url?: string; error?: string};
      if (json.ok && json.url) setPreviewUrl(json.url);
      else setError(json.error ?? "PROCESSING_FAILED");
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-3">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="text-sm text-[var(--muted)]">{t("originalUnchanged")}</p>
      <p className="text-sm text-[var(--muted)]">
        {t("sameFormat")} · {t("sameDimensions")}
      </p>
      <p className="text-xs text-[var(--muted)]">{t("metadataPolicy")}</p>
      <p className="text-xs text-[var(--muted)]">{t("noGuaranteedSavings")}</p>
      <div className="sr-only" aria-live="polite">
        {statusLive}
      </div>

      {eligible ? (
        <button
          ref={optimizeRef}
          type="button"
          className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={busy}
          aria-disabled={busy}
          onClick={() => setOpen(true)}
        >
          {t("optimizeAction")}
        </button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 p-3 text-sm"
        >
          <h4 id={titleId} className="font-medium">
            {t("confirmTitle")}
          </h4>
          <p className="mt-1 text-[var(--muted)]">
            {t("confirmBody", {name: originalFilename})}
          </p>
          <ul className="mt-2 list-disc ps-5 text-[var(--muted)]">
            <li>{t("originalUnchanged")}</li>
            <li>{t("sameFormat")}</li>
            <li>{t("sameDimensions")}</li>
            <li>{t("metadataPolicy")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              ref={confirmRef}
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => void start()}
            >
              {busy ? t("processing") : t("confirmStart")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                optimizeRef.current?.focus();
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {job ? (
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-white p-3 text-sm">
          <p>
            <span className="text-[var(--muted)]">{t("statusLabel")}: </span>
            {t(`status.${job.status}` as "status.completed")}
          </p>
          {job.status === "completed" ? (
            <>
              <p>
                {t("originalSize")}: {formatByteSize(job.sourceByteSize, locale)}
              </p>
              <p>
                {t("optimizedSize")}:{" "}
                {job.outputByteSize != null
                  ? formatByteSize(job.outputByteSize, locale)
                  : "—"}
              </p>
              {job.byteDifference != null ? (
                <p>
                  {job.byteDifference > 0
                    ? t("outputLarger")
                    : job.byteDifference < 0
                      ? t("sizeDifference")
                      : t("noSizeReduction")}
                  : {formatByteSize(Math.abs(job.byteDifference), locale)}
                  {job.percentDifference != null ? ` (${job.percentDifference}%)` : ""}
                </p>
              ) : null}
              <p className="text-xs text-[var(--muted)]">
                {detectedFormat ?? "—"} {width}×{height} → {job.outputDetectedFormat}{" "}
                {job.outputWidth}×{job.outputHeight}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="underline"
                  disabled={busy}
                  onClick={() => void preview()}
                >
                  {t("previewOptimized")}
                </button>
              </div>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={t("previewOptimized")}
                  className="mt-2 max-h-48 rounded-lg border border-[var(--border)] object-contain"
                />
              ) : null}
            </>
          ) : null}
          {(job.status === "failed" || job.status === "cleanup_failed") &&
          job.attemptCount < job.maxAttempts ? (
            <button
              type="button"
              className="underline"
              disabled={busy}
              onClick={() => void retry()}
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {t.has(`errors.${error}` as "errors.PROCESSING_FAILED")
            ? t(`errors.${error}` as "errors.PROCESSING_FAILED")
            : t("errors.PROCESSING_FAILED")}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        {formatByteSize(sizeBytes, locale)} · {detectedFormat ?? "—"}
      </p>
    </div>
  );
}
