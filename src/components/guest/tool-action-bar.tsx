"use client";

import {useTranslations} from "next-intl";

type Props = {
  stage: "idle" | "ready" | "processing" | "done" | "error" | "limit";
  onProcess?: () => void;
  onDownload?: () => void;
  onProcessAnother?: () => void;
  processDisabled?: boolean;
  downloadDisabled?: boolean;
  allowReprocess?: boolean;
  /** Hide primary image download (viewer-only tools). */
  hideDownload?: boolean;
  processLabel: string;
  processingLabel: string;
  downloadLabel: string;
  processAnotherLabel: string;
};

export function ToolActionBar({
  stage,
  onProcess,
  onDownload,
  onProcessAnother,
  processDisabled,
  downloadDisabled,
  allowReprocess,
  hideDownload,
  processLabel,
  processingLabel,
  downloadLabel,
  processAnotherLabel,
}: Props) {
  const t = useTranslations("guest.tool");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="group" aria-label={t("actionsAria")}>
      {(stage === "ready" || stage === "error") && (
        <button
          type="button"
          disabled={processDisabled}
          onClick={onProcess}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {processLabel}
        </button>
      )}

      {stage === "done" && (
        <>
          {!hideDownload ? (
            <button
              type="button"
              disabled={downloadDisabled}
              onClick={onDownload}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {downloadLabel}
            </button>
          ) : null}
          {allowReprocess ? (
            <button
              type="button"
              disabled={processDisabled}
              onClick={onProcess}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium disabled:opacity-50"
            >
              {processLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onProcessAnother}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-medium ${
              hideDownload
                ? "bg-[var(--accent)] font-semibold text-white"
                : "border border-[var(--border)]"
            }`}
          >
            {processAnotherLabel}
          </button>
        </>
      )}

      {stage === "processing" && (
        <button
          type="button"
          disabled
          aria-busy="true"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white opacity-60"
        >
          {processingLabel}
        </button>
      )}
    </div>
  );
}
