"use client";

import {useEffect, useRef, useState, useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";
import {
  guestMimeFamilyFromFile,
  sizeBucket,
  trackGuestEvent,
} from "@/lib/guest/analytics";
import type {SafeGuestErrorCode} from "@/server/guest/errors";
import {BeforeAfterPreview} from "@/components/guest/before-after-preview";
import {ExpiryCountdown} from "@/components/guest/expiry-countdown";
import {
  authorizeGuestUpload,
  confirmGuestUpload,
  createGuestDownload,
  createGuestToolJob,
  ensureGuestSession,
  fetchGuestStatus,
  putToPresignedUrl,
} from "@/components/guest/guest-api-client";
import {takePendingGuestFile} from "@/components/guest/guest-file-handoff";
import {GuestLimitBanner} from "@/components/guest/guest-limit-banner";
import {ProgressCard, type GuestProgressPhase} from "@/components/guest/progress-card";
import type {GuestToolConfig} from "@/components/guest/tool-config";
import {ToolActionBar} from "@/components/guest/tool-action-bar";
import {ToolHeader} from "@/components/guest/tool-header";
import {ToolResultPanel} from "@/components/guest/tool-result-panel";
import {UpgradeBanner} from "@/components/guest/upgrade-banner";
import {UploadDropzone} from "@/components/guest/upload-dropzone";
import {
  dispatchGuestToolClearResult,
  dispatchGuestToolResult,
  GUEST_TOOL_RESET_EVENT,
} from "@/components/marketing/guest-tool-events";

type Stage = "idle" | "busy" | "ready" | "done" | "error" | "limit";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isNearLimit(used: number, limit: number): boolean {
  if (limit <= 0) return false;
  return used / limit >= 0.8;
}

export function GuestToolWorkspace<TOptions>({config}: {config: GuestToolConfig<TOptions>}) {
  const t = useTranslations("guest");
  /** Prefer messageNamespace; fall back to titleKey if a bad RSC serialize dropped it. */
  const toolMessageNamespace = config.messageNamespace ?? config.titleKey;
  const tTool = useTranslations(`guest.${toolMessageNamespace}`);
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const mainRef = useRef<HTMLDivElement>(null);
  const OptionsPanel = config.OptionsPanel;
  const CustomResultPanel = config.CustomResultPanel;
  const presentation = config.presentation;
  const premiumStatus = presentation?.statusBarVariant === "premium";

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState<GuestProgressPhase>("idle");
  const [errorCode, setErrorCode] = useState<SafeGuestErrorCode | null>(null);
  const [options, setOptions] = useState<TOptions>(config.defaultOptions);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [opsUsed, setOpsUsed] = useState(0);
  const [opsLimit, setOpsLimit] = useState(5);
  const [maxMb, setMaxMb] = useState(10);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState<number | null>(null);
  const [sourceHeight, setSourceHeight] = useState<number | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string | null>(null);
  const [hasAlpha, setHasAlpha] = useState<boolean | null>(null);
  const [avifEncodeSupported, setAvifEncodeSupported] = useState(false);
  const [processBlockedByOptions, setProcessBlockedByOptions] = useState(false);
  const [beforeMeta, setBeforeMeta] = useState<{
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    format?: string | null;
  } | null>(null);
  const [afterMeta, setAfterMeta] = useState<{
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
    format?: string | null;
  } | null>(null);
  const [resultRows, setResultRows] = useState<{label: string; value: string}[] | null>(null);
  const [rawResultSummary, setRawResultSummary] = useState<Record<string, unknown> | null>(null);
  const beforeObjectUrl = useRef<string | null>(null);

  function revokeBefore() {
    if (beforeObjectUrl.current) {
      URL.revokeObjectURL(beforeObjectUrl.current);
      beforeObjectUrl.current = null;
    }
  }

  function focusMain() {
    mainRef.current?.focus({preventScroll: true});
  }

  function resetWorkspace() {
    revokeBefore();
    setBeforeUrl(null);
    setAfterUrl(null);
    setUploadId(null);
    setJobId(null);
    setSavedLabel(null);
    setFileName(null);
    setErrorCode(null);
    setBeforeMeta(null);
    setAfterMeta(null);
    setResultRows(null);
    setRawResultSummary(null);
    setSourceWidth(null);
    setSourceHeight(null);
    setSourceMimeType(null);
    setHasAlpha(null);
    setProcessBlockedByOptions(false);
    setOptions(config.defaultOptions);
    setProgress("idle");
    setStage("idle");
    if (presentation?.emitResultEvents) {
      dispatchGuestToolClearResult(presentation.resultEventTool);
    }
    queueMicrotask(focusMain);
  }

  useEffect(() => {
    if (!presentation?.enableExternalReset) return;
    function onExternalReset() {
      resetWorkspace();
      void refreshStatus();
    }
    window.addEventListener(GUEST_TOOL_RESET_EVENT, onExternalReset);
    return () => window.removeEventListener(GUEST_TOOL_RESET_EVENT, onExternalReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when presentation flag changes
  }, [presentation?.enableExternalReset]);

  async function refreshStatus() {
    const status = await fetchGuestStatus();
    if (!status.ok) return;
    setExpiresAt(status.expiresAt);
    setOpsUsed(status.operationsUsed);
    setOpsLimit(status.operationsLimit);
    setMaxMb(Math.round(status.policy.maxFileBytes / (1024 * 1024)));
    setAvifEncodeSupported(Boolean(status.policy.avifEncodeSupported));
    if (status.operationsUsed >= status.operationsLimit) {
      setStage((prev) => (prev === "idle" || prev === "ready" ? "limit" : prev));
    }
  }

  async function handleFile(file: File) {
    setErrorCode(null);
    setAfterUrl(null);
    setSavedLabel(null);
    setJobId(null);
    setResultRows(null);
    setAfterMeta(null);

    const mime = (file.type || "").toLowerCase();
    const allowed = config.allowedMimeTypes
      ? new Set(config.allowedMimeTypes.map((m) => m.toLowerCase()))
      : ALLOWED_MIME;
    if (!allowed.has(mime)) {
      setErrorCode("UNSUPPORTED_MEDIA_TYPE");
      setStage("error");
      setProgress("failed");
      trackGuestEvent({
        name: "guest_tool_upload",
        toolCode: config.toolCode,
        ok: false,
        errorCode: "UNSUPPORTED_MEDIA_TYPE",
        mimeFamily: guestMimeFamilyFromFile(file),
        sizeBucket: sizeBucket(file.size),
      });
      return;
    }

    setStage("busy");
    setProgress("uploading");
    revokeBefore();
    const objectUrl = URL.createObjectURL(file);
    beforeObjectUrl.current = objectUrl;
    setBeforeUrl(objectUrl);
    setFileName(file.name);
    setBeforeMeta({
      bytes: file.size,
      format: mime.replace("image/", "").replace("jpg", "jpeg"),
    });

    const session = await ensureGuestSession({locale, toolCode: config.toolCode});
    if (!session.ok) {
      setErrorCode(session.error);
      setStage(session.error === "GUEST_LIMIT_REACHED" ? "limit" : "error");
      setProgress("failed");
      return;
    }
    setExpiresAt(session.expiresAt);
    await refreshStatus();

    const auth = await authorizeGuestUpload({
      originalFilename: file.name || "image.jpg",
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    });
    if (!auth.ok) {
      setErrorCode(auth.error);
      setStage(auth.error === "GUEST_LIMIT_REACHED" ? "limit" : "error");
      setProgress("failed");
      return;
    }

    try {
      await putToPresignedUrl(auth.uploadUrl, file, auth.headers);
    } catch {
      setErrorCode("STORAGE_UNAVAILABLE");
      setStage("error");
      setProgress("failed");
      return;
    }

    setProgress("validating");
    const confirmed = await confirmGuestUpload(auth.uploadId);
    if (!confirmed.ok) {
      setErrorCode(confirmed.error);
      setStage(confirmed.error === "GUEST_LIMIT_REACHED" ? "limit" : "error");
      setProgress("failed");
      return;
    }

    if (config.operation === "convert.format") {
      setProgress("reading_format");
    } else {
      setProgress("preparing_editor");
    }
    setUploadId(confirmed.uploadId);
    setSourceWidth(confirmed.width);
    setSourceHeight(confirmed.height);
    setSourceMimeType(confirmed.mimeType);
    setHasAlpha(confirmed.hasAlpha ?? null);
    setBeforeMeta({
      width: confirmed.width,
      height: confirmed.height,
      bytes: confirmed.sizeBytes != null ? Number(confirmed.sizeBytes) : file.size,
      format: (confirmed.mimeType || mime).replace("image/", "").replace("jpg", "jpeg"),
    });
    setStage("ready");
    setProgress("idle");
    trackGuestEvent({
      name: "guest_tool_upload",
      toolCode: config.toolCode,
      ok: true,
      mimeFamily: guestMimeFamilyFromFile(file),
      sizeBucket: sizeBucket(file.size),
    });
    await refreshStatus();
    focusMain();
  }

  async function handleProcess() {
    if (!uploadId) return;
    setStage("busy");
    setProgress(config.processingPhase);
    setErrorCode(null);
    const started = performance.now();

    const job = await createGuestToolJob({
      uploadId,
      operation: config.operation,
      options: config.buildJobOptions(options),
    });
    if (!job.ok) {
      setErrorCode(job.error);
      setStage(job.error === "GUEST_LIMIT_REACHED" ? "limit" : "error");
      setProgress("failed");
      trackGuestEvent({
        name: "guest_tool_process",
        toolCode: config.toolCode,
        ok: false,
        errorCode: job.error,
        durationMs: Math.round(performance.now() - started),
      });
      await refreshStatus();
      return;
    }

    if (config.operation === "convert.format") {
      setProgress("verifying_output");
    }
    if (config.operation === "geotag.write_gps") {
      setProgress("verifying_gps");
    }
    if (config.operation === "metadata.inspect") {
      setProgress("preparing_download");
    }
    if (config.operation === "ai.generate_alt_text") {
      setProgress("generating_metadata");
    }
    if (config.operation === "metadata.edit") {
      setProgress("preparing_editor");
    }

    setJobId(job.jobId);
    setRawResultSummary(
      job.resultSummary && typeof job.resultSummary === "object"
        ? (job.resultSummary as Record<string, unknown>)
        : null,
    );
    const mapped = config.mapResultSummary(job.resultSummary ?? undefined, {
      formatBytes,
      tTool: (key, values) => tTool(key as never, values as never),
    });
    setSavedLabel(mapped.savedLabel ?? null);
    setAfterMeta(mapped.afterMeta ?? null);
    setResultRows(mapped.rows);

    let resultPreviewUrl: string | null = null;
    if (!config.hideImageDownload) {
      setProgress("preparing_download");
      const dl = await createGuestDownload(job.jobId);
      if (dl.ok) {
        setAfterUrl(dl.url);
        resultPreviewUrl = dl.url;
      }
    }
    setStage("done");
    setProgress("complete");

    if (presentation?.emitResultEvents) {
      const summary =
        job.resultSummary && typeof job.resultSummary === "object"
          ? (job.resultSummary as Record<string, unknown>)
          : {};
      const inputBytes = Number(summary.inputBytes ?? beforeMeta?.bytes ?? 0);
      const outputBytes = Number(summary.outputBytes ?? mapped.afterMeta?.bytes ?? 0);
      const savedBytes = Number(
        summary.savedBytes ?? Math.max(0, inputBytes - outputBytes),
      );
      const savedPercent = Number(
        summary.savedPercent ??
          (inputBytes > 0 ? Math.round((savedBytes / inputBytes) * 100) : 0),
      );
      dispatchGuestToolResult({
        tool: presentation.resultEventTool ?? config.toolCode,
        savedPercent,
        before: {
          url: beforeUrl,
          width: beforeMeta?.width ?? sourceWidth,
          height: beforeMeta?.height ?? sourceHeight,
          bytes: beforeMeta?.bytes ?? inputBytes,
          format: beforeMeta?.format ?? sourceMimeType?.replace("image/", ""),
        },
        after: {
          url: resultPreviewUrl,
          width: mapped.afterMeta?.width ?? null,
          height: mapped.afterMeta?.height ?? null,
          bytes: mapped.afterMeta?.bytes ?? outputBytes,
          format: mapped.afterMeta?.format ?? "jpeg",
        },
      });
    }

    trackGuestEvent({
      name: "guest_tool_process",
      toolCode: config.toolCode,
      ok: true,
      durationMs: Math.round(performance.now() - started),
    });
    await refreshStatus();
    focusMain();
  }

  async function handleDownload() {
    if (!jobId) return;
    const dl = await createGuestDownload(jobId);
    if (!dl.ok) {
      setErrorCode(dl.error);
      trackGuestEvent({name: "guest_tool_download", toolCode: config.toolCode, ok: false});
      return;
    }
    const prefix = config.downloadFilenamePrefix ?? "processed";
    const suggested =
      config.buildDownloadFilename?.(fileName) ??
      (fileName ? `${prefix}-${fileName}` : `${prefix}-image`);
    const a = document.createElement("a");
    a.href = dl.url;
    a.download = suggested;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    trackGuestEvent({name: "guest_tool_download", toolCode: config.toolCode, ok: true});
  }

  useEffect(() => {
    const pending = takePendingGuestFile();
    if (pending) {
      startTransition(() => {
        void handleFile(pending);
      });
    } else {
      void refreshStatus();
    }
    return () => revokeBefore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount handoff only
  }, []);

  const actionStage =
    stage === "busy"
      ? "processing"
      : stage === "ready"
        ? "ready"
        : stage === "done"
          ? "done"
          : stage === "error"
            ? "error"
            : stage === "limit"
              ? "limit"
              : "idle";

  const showUpgrade =
    stage === "limit" || opsUsed >= opsLimit || isNearLimit(opsUsed, opsLimit);

  const showOptions =
    stage === "ready" ||
    stage === "error" ||
    (config.showOptionsWhenDone && stage === "done") ||
    (stage === "busy" &&
      (progress === config.processingPhase ||
        progress === "processing" ||
        progress === "compressing" ||
        progress === "resizing" ||
        progress === "cropping" ||
        progress === "converting" ||
        progress === "writing_gps" ||
        progress === "verifying_gps" ||
        progress === "reading_metadata" ||
        progress === "generating_metadata" ||
        progress === "analyzing_image" ||
        progress === "verifying_output" ||
        progress === "reading_format" ||
        progress === "reading_gps" ||
        progress === "preparing_download" ||
        progress === "preparing_editor"));

  return (
    <div
      ref={mainRef}
      tabIndex={-1}
      className={`outline-none ${
        presentation?.landingChrome === "marketing"
          ? "space-y-4 py-1"
          : "tool-container space-y-6 py-8 sm:py-10"
      }`}
    >
      {config.hideToolHeader ? null : (
        <ToolHeader
          title={t(`tools.${config.titleKey}`)}
          description={tTool("subtitle")}
        />
      )}

      {presentation?.landingChrome === "marketing" && (stage === "idle" || stage === "limit") ? null : premiumStatus ? (
        <aside className="flex flex-col gap-4 rounded-[18px] border border-[var(--border)] bg-white px-4 py-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <GuestLimitBanner
            variant="premium"
            used={opsUsed}
            limit={opsLimit}
            maxMb={maxMb}
            title={presentation?.guestBarTitle}
            body={presentation?.guestBarBody}
          />
          {expiresAt ? (
            <div className="shrink-0 sm:text-end">
              {presentation?.guestDeletionTitle ? (
                <p className="font-semibold text-[var(--foreground)]">
                  {presentation.guestDeletionTitle}
                </p>
              ) : null}
              <ExpiryCountdown
                expiresAt={expiresAt}
                labelPrefix={presentation?.guestCountdownLabel}
                align="end"
              />
            </div>
          ) : null}
        </aside>
      ) : (
        <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
          <GuestLimitBanner used={opsUsed} limit={opsLimit} maxMb={maxMb} />
          {expiresAt ? <ExpiryCountdown expiresAt={expiresAt} /> : null}
        </div>
      )}

      {stage === "idle" || stage === "limit" ? (
        <>
          <UploadDropzone
            large
            variant={presentation?.landingChrome === "marketing" ? "marketing" : "default"}
            showHints={!presentation?.formatsHint && presentation?.landingChrome !== "marketing"}
            maxMb={maxMb}
            disabled={stage === "limit"}
            dropLabel={presentation?.dropLabel}
            supportLabel={presentation?.supportLabel}
            browseLabel={presentation?.browseLabel}
            pasteLabel={presentation?.formatsHint}
            onFileSelected={(file) => void handleFile(file)}
          />
          {presentation?.uploadFeatures?.length ? (
            <ul
              className={`grid gap-4 ${
                presentation.uploadFeatures.length >= 4
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-3"
              }`}
            >
              {presentation.uploadFeatures.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{feature.body}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {!presentation?.uploadFeatures?.length && presentation?.landingChrome !== "marketing" ? (
            <p className="text-sm text-[var(--muted-foreground)]">{tTool("expiryNotice")}</p>
          ) : null}
          {showUpgrade && presentation?.landingChrome !== "marketing" ? <UpgradeBanner /> : null}
        </>
      ) : null}

      {stage !== "idle" && stage !== "limit" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <BeforeAfterPreview
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
              beforeMeta={beforeMeta}
              afterMeta={afterMeta}
              savedLabel={savedLabel}
            />
            <div className="space-y-4">
              {showOptions ? (
                <OptionsPanel
                  options={options}
                  sourceWidth={sourceWidth}
                  sourceHeight={sourceHeight}
                  imageUrl={beforeUrl}
                  sourceMimeType={sourceMimeType}
                  hasAlpha={hasAlpha}
                  avifEncodeSupported={avifEncodeSupported}
                  uploadId={uploadId}
                  onProcessGateChange={setProcessBlockedByOptions}
                  disabled={stage === "busy"}
                  onChange={setOptions}
                  presentation={presentation}
                />
              ) : null}
              <ToolActionBar
                stage={actionStage}
                processDisabled={!uploadId || processBlockedByOptions}
                allowReprocess={config.allowReprocess}
                hideDownload={config.hideImageDownload}
                onProcess={() => void handleProcess()}
                onDownload={() => void handleDownload()}
                onProcessAnother={resetWorkspace}
                processLabel={tTool("actions.process")}
                processingLabel={tTool("actions.processing")}
                downloadLabel={tTool("actions.download")}
                processAnotherLabel={tTool("actions.processAnother")}
              />
            </div>
          </div>

          <ProgressCard
            phase={progress}
            detail={errorCode ? t(`errors.${errorCode}`) : undefined}
          />

          {errorCode && stage === "error" ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {t(`errors.${errorCode}`)}
            </p>
          ) : null}

          {stage === "done" && CustomResultPanel ? (
            <CustomResultPanel
              summary={rawResultSummary}
              expiresAt={expiresAt}
              uploadId={uploadId}
              jobId={jobId}
            />
          ) : null}

          {stage === "done" && resultRows && !CustomResultPanel ? (
            <ToolResultPanel title={tTool("result.title")} rows={resultRows} />
          ) : null}

          {showUpgrade ? <UpgradeBanner /> : null}
          <p className="text-xs text-[var(--muted-foreground)]">{tTool("expiryNotice")}</p>
        </>
      ) : null}
    </div>
  );
}
