"use client";

import {useEffect, useId, useMemo, useState, useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {
  authorizeGuestUpload,
  confirmGuestUpload,
  createGuestDownload,
  ensureGuestSession,
  putToPresignedUrl,
} from "@/components/guest/guest-api-client";
import {ExpiryCountdown} from "@/components/guest/expiry-countdown";
import {ToolHeader} from "@/components/guest/tool-header";
import {UpgradeBanner} from "@/components/guest/upgrade-banner";
import {GUEST_TOOL_RESET_EVENT} from "@/components/marketing/guest-tool-events";
import type {GuestBulkPublicPolicy, GuestBulkToolCode} from "@/lib/guest/bulk-policy";
import {isGuestBulkToolCode} from "@/lib/guest/bulk-policy";
import type {SafeGuestErrorCode} from "@/server/guest/errors";

/** Optional chrome overrides for dedicated bulk landings — never changes upload/process/zip logic. */
export type BulkToolPresentation = {
  hideToolHeader?: boolean;
  hideToolPicker?: boolean;
  hideSingleOnlyNote?: boolean;
  dropTitle?: string;
  dropHint?: string;
  browseLabel?: string;
  formatsHint?: string;
  /** Use `{count}` placeholder — filled from real accepted selection length. */
  statsImagesTemplate?: string;
  /** Use `{size}` placeholder — filled from real total bytes. */
  statsBytesTemplate?: string;
  statsReadyLabel?: string;
  /** Use `{format}` placeholder — filled from live convert target (JPEG/PNG/WebP). */
  statsOutputTemplate?: string;
  enableExternalReset?: boolean;
  /** Matches `dispatchGuestToolReset(tool)` detail.tool */
  resetToolKey?: string;
  embedded?: boolean;
};

type SelectedFile = {
  key: string;
  file: File;
  status: "selected" | "rejected" | "uploading" | "validated" | "processing" | "completed" | "failed";
  error?: string;
  itemId?: string;
  uploadId?: string;
  childJobId?: string;
  resultSummary?: Record<string, unknown> | null;
};

type PublicBulkJob = {
  bulkJobId: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  expiresAt: string;
  items: {
    itemId: string;
    uploadId: string | null;
    childJobId: string | null;
    originalFilename: string | null;
    status: string;
    errorCode: string | null;
    resultSummary: Record<string, unknown> | null;
  }[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function parseJson<T>(res: Response): Promise<{ok: true} & T | {ok: false; error: SafeGuestErrorCode}> {
  const data = (await res.json().catch(() => null)) as ({ok: true} & T) | {ok: false; error: SafeGuestErrorCode} | null;
  if (!data || typeof data !== "object" || !("ok" in data)) {
    return {ok: false, error: "INTERNAL_ERROR"};
  }
  return data;
}

export function BulkToolWorkspace({
  initialTool,
  presentation,
}: {
  initialTool?: string;
  presentation?: BulkToolPresentation;
}) {
  const t = useTranslations("guest.bulk");
  const tErrors = useTranslations("guest.errors");
  const locale = useLocale();
  const formId = useId();
  const [, startTransition] = useTransition();

  const tool: GuestBulkToolCode = isGuestBulkToolCode(initialTool || "")
    ? (initialTool as GuestBulkToolCode)
    : "compress";

  const [policy, setPolicy] = useState<GuestBulkPublicPolicy | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [resizeMode, setResizeMode] = useState<"width" | "height" | "fit_inside">("fit_inside");
  const [resizeValue, setResizeValue] = useState(1280);
  const [targetFormat, setTargetFormat] = useState<"jpeg" | "png" | "webp">("webp");
  const [stage, setStage] = useState<"idle" | "gated" | "busy" | "done" | "error">("idle");
  const [gateReason, setGateReason] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<SafeGuestErrorCode | null>(null);
  const [bulkJob, setBulkJob] = useState<PublicBulkJob | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await ensureGuestSession({locale, toolCode: "bulk-image-tools"});
      const res = await fetch("/api/guest/bulk", {credentials: "include"});
      const data = await parseJson<{policy: GuestBulkPublicPolicy}>(res);
      if (data.ok) setPolicy(data.policy);
    })();
  }, [locale]);

  useEffect(() => {
    if (!presentation?.enableExternalReset) return;
    const onReset = (event: Event) => {
      const detail = (event as CustomEvent<{tool?: string}>).detail;
      const expected = presentation.resetToolKey ?? "bulk-resize";
      if (detail?.tool && detail.tool !== expected) return;
      setFiles([]);
      setBulkJob(null);
      setGateReason(null);
      setStage("idle");
      setStatus(null);
      setErrorCode(null);
    };
    window.addEventListener(GUEST_TOOL_RESET_EVENT, onReset);
    return () => window.removeEventListener(GUEST_TOOL_RESET_EVENT, onReset);
  }, [presentation?.enableExternalReset, presentation?.resetToolKey]);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.file.size, 0), [files]);
  const accepted = files.filter((f) => f.status !== "rejected");
  const dropTitle = presentation?.dropTitle ?? t("dropTitle");
  const dropHint = presentation?.dropHint ?? t("dropHint");
  const browseLabel = presentation?.browseLabel;
  const shellClass = presentation?.embedded
    ? "w-full space-y-6"
    : "mx-auto w-full max-w-4xl space-y-6 px-4 py-8";

  function evaluateSelection(next: SelectedFile[]): {ok: true} | {ok: false; reason: string} {
    if (!policy) return {ok: false, reason: t("policyLoading")};
    if (next.filter((f) => f.status !== "rejected").length > policy.maxFiles) {
      return {
        ok: false,
        reason: t("gateTooMany", {count: policy.maxFiles, selected: next.length}),
      };
    }
    const bytes = next.filter((f) => f.status !== "rejected").reduce((s, f) => s + f.file.size, 0);
    if (bytes > policy.maxBatchBytes) {
      return {
        ok: false,
        reason: t("gateTooLarge", {
          max: formatBytes(policy.maxBatchBytes),
          selected: formatBytes(bytes),
        }),
      };
    }
    return {ok: true};
  }

  function onPick(list: FileList | File[]) {
    const max = policy?.maxFileBytes ?? 10 * 1024 * 1024;
    const mapped: SelectedFile[] = Array.from(list).map((file, i) => {
      const mimeOk = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
      const sizeOk = file.size > 0 && file.size <= max;
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${i}`,
        file,
        status: mimeOk && sizeOk ? "selected" : "rejected",
        error: !mimeOk ? "UNSUPPORTED_MEDIA_TYPE" : !sizeOk ? "OBJECT_TOO_LARGE" : undefined,
      };
    });
    const merged = [...files, ...mapped];
    const gate = evaluateSelection(merged);
    if (!gate.ok) {
      setGateReason(gate.reason);
      setStage("gated");
      // Keep only allowed prefix
      const allowed: SelectedFile[] = [];
      for (const f of merged) {
        if (f.status === "rejected") {
          allowed.push(f);
          continue;
        }
        const probe = [...allowed.filter((a) => a.status !== "rejected"), f];
        const bytes = probe.reduce((s, x) => s + x.file.size, 0);
        if (probe.length <= (policy?.maxFiles ?? 5) && bytes <= (policy?.maxBatchBytes ?? 0)) {
          allowed.push(f);
        } else {
          allowed.push({...f, status: "rejected", error: "GUEST_BULK_LIMIT"});
        }
      }
      setFiles(allowed);
      return;
    }
    setGateReason(null);
    setStage("idle");
    setFiles(merged);
  }

  function removeFile(key: string) {
    setFiles((prev) => prev.filter((f) => f.key !== key));
    setGateReason(null);
    setStage("idle");
  }

  function clearAll() {
    setFiles([]);
    setBulkJob(null);
    setGateReason(null);
    setStage("idle");
    setStatus(null);
  }

  function buildOptions(): Record<string, unknown> {
    if (tool === "resize") {
      const method =
        resizeMode === "width" ? "by_width" : resizeMode === "height" ? "by_height" : "fit_inside";
      return {
        method,
        width: resizeMode === "height" ? null : resizeValue,
        height: resizeMode === "width" ? null : resizeValue,
        maintainAspectRatio: true,
        preventUpscale: true,
        preset: "custom",
      };
    }
    if (tool === "convert") {
      return {targetFormat, qualityPreset: "balanced", jpegBackground: "white"};
    }
    return {quality, preset: "custom"};
  }

  async function processBatch() {
    if (!policy) return;
    const ready = files.filter((f) => f.status === "selected" || f.status === "validated");
    if (!ready.length) return;

    setStage("busy");
    setErrorCode(null);
    setStatus(t("creatingBatch"));

    const session = await ensureGuestSession({locale, toolCode: "bulk-image-tools"});
    if (!session.ok) {
      setErrorCode(session.error);
      setStage("error");
      return;
    }
    setExpiresAt(session.expiresAt);

    const createRes = await fetch("/api/guest/bulk", {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        toolCode: tool,
        options: buildOptions(),
        files: ready.map((f) => ({
          originalFilename: f.file.name,
          mimeType: f.file.type || "application/octet-stream",
          sizeBytes: f.file.size,
        })),
      }),
    });
    const created = await parseJson<PublicBulkJob>(createRes);
    if (!created.ok) {
      setErrorCode(created.error);
      setStage(created.error === "GUEST_LIMIT_REACHED" ? "gated" : "error");
      if (created.error === "GUEST_LIMIT_REACHED") setGateReason(t("gateOps"));
      return;
    }

    setBulkJob(created);
    const itemByIndex = created.items;

    // Upload with concurrency 3
    const queue = ready.map((f, i) => ({file: f, item: itemByIndex[i]!}));
    let cursor = 0;
    const workers = Array.from({length: Math.min(policy.uploadConcurrency, queue.length)}, async () => {
      while (cursor < queue.length) {
        const idx = cursor++;
        const entry = queue[idx]!;
        setFiles((prev) =>
          prev.map((p) => (p.key === entry.file.key ? {...p, status: "uploading", itemId: entry.item.itemId} : p)),
        );
        const authz = await authorizeGuestUpload({
          originalFilename: entry.file.file.name,
          mimeType: entry.file.file.type || "image/jpeg",
          sizeBytes: entry.file.file.size,
        });
        if (!authz.ok) {
          setFiles((prev) =>
            prev.map((p) =>
              p.key === entry.file.key ? {...p, status: "failed", error: authz.error} : p,
            ),
          );
          continue;
        }
        try {
          await putToPresignedUrl(authz.uploadUrl, entry.file.file, authz.headers);
          const confirmed = await confirmGuestUpload(authz.uploadId);
          if (!confirmed.ok) {
            setFiles((prev) =>
              prev.map((p) =>
                p.key === entry.file.key ? {...p, status: "failed", error: confirmed.error} : p,
              ),
            );
            continue;
          }
          const attachRes = await fetch(`/api/guest/bulk/${created.bulkJobId}/attach`, {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({itemId: entry.item.itemId, uploadId: authz.uploadId}),
          });
          const attached = await parseJson<PublicBulkJob>(attachRes);
          if (!attached.ok) {
            setFiles((prev) =>
              prev.map((p) =>
                p.key === entry.file.key ? {...p, status: "failed", error: attached.error} : p,
              ),
            );
            continue;
          }
          setFiles((prev) =>
            prev.map((p) =>
              p.key === entry.file.key
                ? {...p, status: "validated", uploadId: authz.uploadId, itemId: entry.item.itemId}
                : p,
            ),
          );
          setBulkJob(attached);
        } catch {
          setFiles((prev) =>
            prev.map((p) =>
              p.key === entry.file.key ? {...p, status: "failed", error: "STORAGE_UNAVAILABLE"} : p,
            ),
          );
        }
      }
    });
    await Promise.all(workers);

    setStatus(t("processing"));
    const processRes = await fetch(`/api/guest/bulk/${created.bulkJobId}/process`, {
      method: "POST",
      credentials: "include",
    });
    const processed = await parseJson<PublicBulkJob>(processRes);
    if (!processed.ok) {
      setErrorCode(processed.error);
      setStage("error");
      return;
    }
    setBulkJob(processed);
    setFiles((prev) =>
      prev.map((p) => {
        const item = processed.items.find((i) => i.itemId === p.itemId);
        if (!item) return p;
        return {
          ...p,
          status:
            item.status === "completed"
              ? "completed"
              : item.status === "failed"
                ? "failed"
                : p.status,
          childJobId: item.childJobId ?? undefined,
          error: item.errorCode ?? undefined,
          resultSummary: item.resultSummary,
        };
      }),
    );
    setStage("done");
    setStatus(t("complete"));
  }

  async function downloadZip() {
    if (!bulkJob) return;
    setStatus(t("zipPreparing"));
    const res = await fetch(`/api/guest/bulk/${bulkJob.bulkJobId}/zip`, {
      method: "POST",
      credentials: "include",
    });
    const data = await parseJson<{url: string; filename: string}>(res);
    if (!data.ok) {
      setErrorCode(data.error);
      setStatus(t("zipFailed"));
      return;
    }
    const a = document.createElement("a");
    a.href = data.url;
    a.download = data.filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(t("zipReady"));
  }

  async function downloadOne(childJobId: string, name: string) {
    const dl = await createGuestDownload(childJobId);
    if (!dl.ok) {
      setErrorCode(dl.error);
      return;
    }
    const a = document.createElement("a");
    a.href = dl.url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const tools: GuestBulkToolCode[] = ["compress", "resize", "convert"];

  return (
    <div className={shellClass}>
      {presentation?.hideToolHeader ? null : (
        <ToolHeader title={t("title")} description={t("subtitle")} />
      )}
      {presentation?.hideToolHeader ? null : (
        <p className="text-sm text-[var(--muted-foreground)]">{t("bulkSupported")}</p>
      )}
      {presentation?.hideSingleOnlyNote ? null : (
        <p className="text-sm text-[var(--muted-foreground)]">{t("singleOnly")}</p>
      )}

      {presentation?.hideToolPicker ? null : (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("toolPicker")}>
          {tools.map((code) => (
            <Link
              key={code}
              href={`/bulk-image-tools?tool=${code}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                tool === code ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)]/20"
              }`}
              aria-current={tool === code ? "page" : undefined}
            >
              {t(`tools.${code}`)}
            </Link>
          ))}
        </div>
      )}

      {policy ? (
        <p className="text-sm" dir="ltr">
          {t("limitSummary", {
            files: policy.maxFiles,
            batch: formatBytes(policy.maxBatchBytes),
            file: formatBytes(policy.maxFileBytes),
          })}
        </p>
      ) : null}
      {presentation?.formatsHint ? (
        <p className="text-sm text-[var(--muted-foreground)]">{presentation.formatsHint}</p>
      ) : null}

      {stage === "gated" && gateReason ? (
        <section
          className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
          role="alert"
          tabIndex={-1}
        >
          <h2 className="text-sm font-semibold">{t("gateTitle")}</h2>
          <p className="text-sm">{gateReason}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              {t("signIn")}
            </Link>
            <Link href="/register" className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm text-white">
              {t("createAccount")}
            </Link>
            <Link href="/pricing" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              {t("viewPricing")}
            </Link>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">{t("reselectAfterLogin")}</p>
        </section>
      ) : null}

      <section
        className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
        aria-labelledby={`${formId}-drop`}
      >
        <h2 id={`${formId}-drop`} className="text-sm font-semibold sm:text-base">
          {dropTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{dropHint}</p>
        {browseLabel ? (
          <label className="btn-primary mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center px-6 text-sm">
            {browseLabel}
            <input
              id={`${formId}-input`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) onPick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <input
            id={`${formId}-input`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="mt-4 block w-full text-sm"
            onChange={(e) => {
              if (e.target.files?.length) onPick(e.target.files);
              e.target.value = "";
            }}
          />
        )}
      </section>

      {tool === "compress" ? (
        <label className="block text-sm">
          {t("quality")}: {quality}
          <input
            type="range"
            min={40}
            max={95}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 block w-full"
          />
        </label>
      ) : null}

      {tool === "resize" ? (
        <div className="flex flex-wrap gap-3 text-sm">
          <label>
            {t("resizeMode")}
            <select
              className="ml-2 rounded border border-[var(--border)] bg-transparent px-2 py-1"
              value={resizeMode}
              onChange={(e) => setResizeMode(e.target.value as typeof resizeMode)}
            >
              <option value="width">{t("byWidth")}</option>
              <option value="height">{t("byHeight")}</option>
              <option value="fit_inside">{t("fitInside")}</option>
            </select>
          </label>
          <label>
            {t("pixels")}
            <input
              type="number"
              min={16}
              max={8192}
              value={resizeValue}
              onChange={(e) => setResizeValue(Number(e.target.value))}
              className="ml-2 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1"
              dir="ltr"
            />
          </label>
        </div>
      ) : null}

      {tool === "convert" ? (
        <label className="text-sm">
          {t("targetFormat")}
          <select
            className="ml-2 rounded border border-[var(--border)] bg-transparent px-2 py-1"
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as typeof targetFormat)}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
      ) : null}

      {files.length ? (
        <section aria-label={t("selectedFiles")} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {presentation?.statsImagesTemplate && presentation.statsBytesTemplate ? (
              <ul className="flex flex-wrap gap-2" dir="ltr">
                <li className="rounded-full border border-[var(--border)] bg-[#f8fafc] px-3 py-1.5 font-medium">
                  {presentation.statsImagesTemplate.replace("{count}", String(accepted.length))}
                </li>
                <li className="rounded-full border border-[var(--border)] bg-[#f8fafc] px-3 py-1.5 font-medium">
                  {presentation.statsBytesTemplate.replace("{size}", formatBytes(totalBytes))}
                </li>
                {presentation.statsOutputTemplate && tool === "convert" ? (
                  <li className="rounded-full border border-[var(--border)] bg-[#f8fafc] px-3 py-1.5 font-medium">
                    {presentation.statsOutputTemplate.replace(
                      "{format}",
                      targetFormat === "jpeg" ? "JPG" : targetFormat === "png" ? "PNG" : "WebP",
                    )}
                  </li>
                ) : null}
                {presentation.statsReadyLabel &&
                accepted.length > 0 &&
                stage !== "busy" &&
                !(presentation.statsOutputTemplate && tool === "convert") ? (
                  <li className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-1.5 font-medium text-[var(--accent)]">
                    {presentation.statsReadyLabel}
                  </li>
                ) : null}
              </ul>
            ) : (
              <p dir="ltr">
                {accepted.length} · {formatBytes(totalBytes)}
              </p>
            )}
            <button type="button" className="underline" onClick={clearAll}>
              {t("clearAll")}
            </button>
          </div>
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {files.map((f) => (
              <li key={f.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 truncate" dir="ltr">
                  {f.file.name} · {formatBytes(f.file.size)} · {f.status}
                </span>
                <span className="flex gap-2">
                  {f.status === "completed" && f.childJobId ? (
                    <button
                      type="button"
                      className="underline"
                      onClick={() => void downloadOne(f.childJobId!, `bulk-${f.file.name}`)}
                    >
                      {t("downloadOne")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="underline"
                    aria-label={`${t("remove")}: ${f.file.name}`}
                    onClick={() => removeFile(f.key)}
                  >
                    {t("remove")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={stage === "busy" || !accepted.length}
          onClick={() => startTransition(() => void processBatch())}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {stage === "busy" ? t("processing") : t("process")}
        </button>
        {stage === "done" && bulkJob && (bulkJob.completedItems > 0) ? (
          <button
            type="button"
            onClick={() => void downloadZip()}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          >
            {t("downloadZip")}
          </button>
        ) : null}
      </div>

      {bulkJob ? (
        <p className="text-sm" role="status" aria-live="polite">
          {t("summary", {
            total: bulkJob.totalItems,
            completed: bulkJob.completedItems,
            failed: bulkJob.failedItems,
            skipped: bulkJob.skippedItems,
          })}
        </p>
      ) : null}

      {status ? (
        <p className="text-sm text-[var(--muted-foreground)]" role="status">
          {status}
        </p>
      ) : null}
      {errorCode ? (
        <p className="text-sm text-red-700" role="alert">
          {tErrors(errorCode)}
        </p>
      ) : null}

      {expiresAt ? <ExpiryCountdown expiresAt={expiresAt} /> : null}
      <UpgradeBanner />
      <p className="text-xs text-[var(--muted-foreground)]">{t("expiryNotice")}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{t("aiUnavailable")}</p>
    </div>
  );
}
