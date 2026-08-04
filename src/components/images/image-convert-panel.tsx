"use client";

import {useLocale, useTranslations} from "next-intl";
import {useId, useMemo, useState} from "react";
import {formatByteSize} from "@/lib/format-bytes";
import {
  CONVERSION_TARGET_FORMATS,
  type ConversionTargetFormat,
} from "@/lib/conversion-formats";
import {pollProcessingJob} from "@/components/images/poll-processing-job";

/** Client-side mirror of conversion matrix — server still enforces. */
const CLIENT_MATRIX: Record<string, ConversionTargetFormat[]> = {
  jpeg: ["jpeg", "webp", "avif"],
  png: ["png", "webp", "avif"],
  webp: ["webp", "avif"],
  avif: ["avif"],
};

type JobDto = {
  id: string;
  status: string;
  operation: string;
  preset: string | null;
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

export function ImageConvertPanel({
  projectId,
  imageId,
  imageStatus,
  originalFilename,
  sizeBytes,
  detectedFormat,
}: Props) {
  const t = useTranslations("images.convert");
  const locale = useLocale();
  const titleId = useId();
  const [busyTarget, setBusyTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConversionTargetFormat | null>(null);
  const [jobsByTarget, setJobsByTarget] = useState<
    Partial<Record<ConversionTargetFormat, JobDto>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<string | null>(null);

  const eligible = imageStatus === "ready_for_processing";
  const allowed = useMemo(() => {
    if (!detectedFormat) return [] as ConversionTargetFormat[];
    return CLIENT_MATRIX[detectedFormat] ?? [];
  }, [detectedFormat]);

  if (!eligible && Object.keys(jobsByTarget).length === 0) {
    return <p className="text-sm text-[var(--muted)]">{t("notEligible")}</p>;
  }

  const runConvert = async (target: ConversionTargetFormat) => {
    setBusyTarget(target);
    setError(null);
    setPreviewUrl(null);
    try {
      const createRes = await fetch(`/api/projects/${projectId}/processing/jobs`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          imageId,
          operation: "convert_format",
          targetFormat: target,
          idempotencyKey: `convert:${imageId}:${target}:${Date.now()}`,
        }),
      });
      const createJson = (await createRes.json()) as {
        ok?: boolean;
        error?: string;
        job?: JobDto;
      };
      if (!createJson.ok || !createJson.job) {
        setError(createJson.error ?? "PROCESSING_FAILED");
        return;
      }
      setJobsByTarget((prev) => ({...prev, [target]: createJson.job!}));

      const polled = await pollProcessingJob<JobDto>({
        projectId,
        jobId: createJson.job.id,
        onUpdate: (next) => setJobsByTarget((prev) => ({...prev, [target]: next})),
      });
      if (polled) {
        setJobsByTarget((prev) => ({...prev, [target]: polled}));
        if (polled.status !== "completed") {
          setError(polled.lastErrorCode ?? "PROCESSING_FAILED");
        }
      } else {
        setError("PROCESSING_FAILED");
      }
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusyTarget(null);
      setConfirmTarget(null);
    }
  };

  const retry = async (target: ConversionTargetFormat) => {
    const job = jobsByTarget[target];
    if (!job) return;
    setBusyTarget(target);
    setError(null);
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
      setJobsByTarget((prev) => ({...prev, [target]: json.job!}));
      const polled = await pollProcessingJob<JobDto>({
        projectId,
        jobId: json.job.id,
        onUpdate: (next) => setJobsByTarget((prev) => ({...prev, [target]: next})),
      });
      if (polled) {
        setJobsByTarget((prev) => ({...prev, [target]: polled}));
        if (polled.status !== "completed") {
          setError(polled.lastErrorCode ?? "PROCESSING_FAILED");
        }
      }
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusyTarget(null);
    }
  };

  const preview = async (target: ConversionTargetFormat) => {
    const job = jobsByTarget[target];
    if (!job || job.status !== "completed") return;
    setBusyTarget(target);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/processing/jobs/${job.id}/preview`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; url?: string; error?: string};
      if (json.ok && json.url) {
        setPreviewUrl(json.url);
        setPreviewTarget(target);
      } else setError(json.error ?? "PROCESSING_FAILED");
    } catch {
      setError("PROCESSING_FAILED");
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-3">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="text-sm text-[var(--muted)]">{t("fromOriginal")}</p>
      <p className="text-xs text-[var(--muted)]">{t("sameDimensions")}</p>
      <p className="text-xs text-[var(--muted)]">{t("noSilentJpeg")}</p>
      <p className="text-xs text-[var(--muted)]">
        {t("originalFormat")}: {detectedFormat ?? "—"} · {formatByteSize(sizeBytes, locale)}
      </p>

      <ul className="space-y-2">
        {(allowed.length ? allowed : CONVERSION_TARGET_FORMATS).map((target) => {
          const permitted = allowed.includes(target);
          const job = jobsByTarget[target];
          const busy = busyTarget === target;
          return (
            <li
              key={target}
              className="rounded-xl border border-[var(--border)] bg-white p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{t(`formats.${target}`)}</span>
                {!permitted ? (
                  <span className="text-xs text-[var(--muted)]">{t("notAllowed")}</span>
                ) : null}
                {job?.status === "completed" ? (
                  <span className="text-xs text-green-800">{t("badgeCompleted")}</span>
                ) : null}
                {job?.status === "failed" || job?.status === "cleanup_failed" ? (
                  <span className="text-xs text-red-800">{t("badgeFailed")}</span>
                ) : null}
              </div>

              {job?.status === "completed" ? (
                <div className="mt-2 space-y-1 text-[var(--muted)]">
                  <p>
                    {t("outputFormat")}: {job.outputDetectedFormat ?? target}
                  </p>
                  <p>
                    {t("outputSize")}:{" "}
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
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="underline"
                    disabled={busy}
                    onClick={() => void preview(target)}
                  >
                    {t("preview")}
                  </button>
                </div>
              ) : null}

              {(job?.status === "failed" || job?.status === "cleanup_failed") &&
              job.attemptCount < job.maxAttempts ? (
                <button
                  type="button"
                  className="mt-2 underline"
                  disabled={busy}
                  onClick={() => void retry(target)}
                >
                  {t("retry")}
                </button>
              ) : null}

              {eligible &&
              permitted &&
              (!job || job.status === "cancelled" || job.status === "stale") ? (
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-white disabled:opacity-60"
                  disabled={busy || Boolean(busyTarget)}
                  onClick={() => setConfirmTarget(target)}
                >
                  {t("generate")}
                </button>
              ) : null}

              {job &&
              ["queued", "processing", "uploading_output", "verifying_output"].includes(
                job.status,
              ) ? (
                <p className="mt-2 text-[var(--muted)]" aria-live="polite">
                  {t(`status.${job.status}` as "status.processing")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {confirmTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 p-3 text-sm"
        >
          <h4 id={titleId} className="font-medium">
            {t("confirmTitle", {format: t(`formats.${confirmTarget}`)})}
          </h4>
          <p className="mt-1 text-[var(--muted)]">
            {t("confirmBody", {name: originalFilename})}
          </p>
          <ul className="mt-2 list-disc ps-5 text-[var(--muted)]">
            <li>{t("fromOriginal")}</li>
            <li>{t("sameDimensions")}</li>
            <li>{t("noSilentJpeg")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-white disabled:opacity-60"
              disabled={Boolean(busyTarget)}
              onClick={() => void runConvert(confirmTarget)}
            >
              {busyTarget === confirmTarget ? t("processing") : t("confirmStart")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5"
              disabled={Boolean(busyTarget)}
              onClick={() => setConfirmTarget(null)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {previewUrl && previewTarget ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={t("previewAlt", {format: t(`formats.${previewTarget}` as "formats.webp")})}
          className="max-h-48 rounded-lg border border-[var(--border)] object-contain"
        />
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {t.has(`errors.${error}` as "errors.PROCESSING_FAILED")
            ? t(`errors.${error}` as "errors.PROCESSING_FAILED")
            : t("errors.PROCESSING_FAILED")}
        </p>
      ) : null}
    </div>
  );
}
