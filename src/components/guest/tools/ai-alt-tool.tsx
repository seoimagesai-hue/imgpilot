"use client";

import {useEffect, useId, useState} from "react";
import {useTranslations} from "next-intl";
import {trackGuestEvent} from "@/lib/guest/analytics";
import {
  defaultGuestAiAltOptions,
  formatGuestAiAltJson,
  formatGuestAiAltTxt,
  GUEST_AI_PURPOSES,
  type GuestAiAltOptions,
  type GuestAiAltResultSummary,
  type GuestAiPurpose,
  type GuestAiExportLabels,
} from "@/lib/guest/ai-alt-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";
import {fetchGuestAiAltStatus} from "@/components/guest/guest-api-client";

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function isAiSummary(raw: unknown): raw is GuestAiAltResultSummary {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (raw as GuestAiAltResultSummary).schemaVersion === "image-seo-ai-v2" &&
      (raw as GuestAiAltResultSummary).result?.altText,
  );
}

function FieldCard({
  id,
  title,
  value,
  copyLabel,
  onCopy,
  ltr,
}: {
  id: string;
  title: string;
  value: string;
  copyLabel: string;
  onCopy: () => void;
  ltr?: boolean;
}) {
  const chars = value.length;
  return (
    <section className="space-y-2 rounded-xl border border-[var(--border)] p-4" aria-labelledby={id}>
      <div className="flex items-start justify-between gap-2">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium"
        >
          {copyLabel}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm" dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]" dir="ltr">
        {chars}
      </p>
    </section>
  );
}

function AiOptionsPanel({
  options,
  onChange,
  onProcessGateChange,
  disabled,
}: GuestToolOptionsPanelProps<GuestAiAltOptions>) {
  const t = useTranslations("guest.aiAlt");
  const formId = useId();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchGuestAiAltStatus().then((res) => {
      if (cancelled) return;
      setConfigured(res.ok ? res.configured : false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onProcessGateChange?.(configured === false);
  }, [configured, onProcessGateChange]);

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
      aria-labelledby={`${formId}-title`}
    >
      <div>
        <h2 id={`${formId}-title`} className="text-sm font-semibold">
          {t("optionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("formats")}</p>
      </div>

      {configured === false ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="alert">
          {t("unavailable")}
        </p>
      ) : null}

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">{t("purpose")}</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("purpose")}>
          {GUEST_AI_PURPOSES.map((purpose) => {
            const selected = options.purpose === purpose;
            return (
              <button
                key={purpose}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({...options, purpose: purpose as GuestAiPurpose})}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                }`}
              >
                {t(`purposes.${purpose}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">{t("outputLanguage")}</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("outputLanguage")}>
          {(["en", "ur"] as const).map((lang) => {
            const selected = options.outputLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({...options, outputLanguage: lang})}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                }`}
              >
                {t(`languages.${lang}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-xs text-[var(--muted-foreground)]">{t("privacyNotice")}</p>
      <p className="text-xs text-[var(--muted-foreground)]" role="note">
        {t("reviewWarning")}
      </p>
    </section>
  );
}

function AiResultPanel({
  summary,
  expiresAt,
}: {
  summary: Record<string, unknown> | null | undefined;
  expiresAt: string | null;
}) {
  const t = useTranslations("guest.aiAlt");
  const formId = useId();
  const [status, setStatus] = useState<string | null>(null);

  if (!isAiSummary(summary)) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]" role="status">
        {t("resultUnavailable")}
      </p>
    );
  }

  const data = summary;
  const r = data.result;
  const resultDir = data.outputLanguage === "ur" ? "rtl" : "ltr";

  function labels(): GuestAiExportLabels {
    return {
      purpose: t("purpose"),
      language: t("outputLanguage"),
      altText: t("fields.altText"),
      title: t("fields.title"),
      caption: t("fields.caption"),
      shortDescription: t("fields.shortDescription"),
      longDescription: t("fields.longDescription"),
      filename: t("fields.filename"),
      keywords: t("fields.keywords"),
      warning: t("reviewWarning"),
      generatedAt: t("fields.generatedAt"),
      expiresAt: t("fields.expiresAt"),
    };
  }

  async function onCopy(text: string) {
    const ok = await copyText(text);
    setStatus(ok ? t("copySuccess") : t("copyFailed"));
  }

  return (
    <div className="space-y-4" aria-labelledby={`${formId}-results`}>
      <h2 id={`${formId}-results`} className="text-base font-semibold">
        {t("result.title")}
      </h2>
      <p className="text-sm" role="note">
        {t("reviewWarning")}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">
        {t("purpose")}: {t(`purposes.${data.purpose}`)} · {t("outputLanguage")}:{" "}
        {t(`languages.${data.outputLanguage}`)}
      </p>

      <div className="space-y-3" dir={resultDir}>
        <FieldCard
          id={`${formId}-alt`}
          title={t("fields.altText")}
          value={r.altText}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.altText)}
        />
        <FieldCard
          id={`${formId}-title`}
          title={t("fields.title")}
          value={r.title}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.title)}
        />
        <FieldCard
          id={`${formId}-caption`}
          title={t("fields.caption")}
          value={r.caption}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.caption)}
        />
        <FieldCard
          id={`${formId}-short`}
          title={t("fields.shortDescription")}
          value={r.shortDescription}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.shortDescription)}
        />
        <FieldCard
          id={`${formId}-long`}
          title={t("fields.longDescription")}
          value={r.longDescription}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.longDescription)}
        />
        <FieldCard
          id={`${formId}-file`}
          title={t("fields.filename")}
          value={r.filename}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.filename)}
          ltr
        />
        <FieldCard
          id={`${formId}-kw`}
          title={t("fields.keywords")}
          value={r.keywords.join(", ")}
          copyLabel={t("actions.copy")}
          onCopy={() => void onCopy(r.keywords.join(", "))}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="group" aria-label={t("exportGroupAria")}>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() =>
            void onCopy(formatGuestAiAltTxt(data, labels(), expiresAt))
          }
        >
          {t("actions.copyAll")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() => {
            downloadBlob(
              "ai-alt-text.txt",
              formatGuestAiAltTxt(data, labels(), expiresAt),
              "text/plain;charset=utf-8",
            );
            trackGuestEvent({name: "guest_ai_export_txt", toolCode: "ai-alt-text"});
            setStatus(t("exportTxtReady"));
          }}
        >
          {t("actions.downloadTxt")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          onClick={() => {
            downloadBlob(
              "ai-alt-text.json",
              formatGuestAiAltJson(data, expiresAt),
              "application/json;charset=utf-8",
            );
            trackGuestEvent({name: "guest_ai_export_json", toolCode: "ai-alt-text"});
            setStatus(t("exportJsonReady"));
          }}
        >
          {t("actions.downloadJson")}
        </button>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
        {status}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">{t("expiryNotice")}</p>
    </div>
  );
}

export function createAiAltToolConfig(locale: string): GuestToolConfig<GuestAiAltOptions> {
  return {
    toolCode: "ai-alt-text",
    operation: "ai.generate_alt_text",
    titleKey: "aiAlt",
    messageNamespace: "aiAlt",
    processingPhase: "generating_metadata",
    hideImageDownload: true,
    allowReprocess: true,
    showOptionsWhenDone: true,
    defaultOptions: defaultGuestAiAltOptions(locale),
    OptionsPanel: AiOptionsPanel,
    CustomResultPanel: AiResultPanel,
    buildJobOptions: (options) => ({
      purpose: options.purpose,
      outputLanguage: options.outputLanguage,
      schemaVersion: options.schemaVersion,
    }),
    mapResultSummary: (summary, {tTool}) => {
      if (!isAiSummary(summary)) {
        return {rows: [], savedLabel: null, afterMeta: null};
      }
      return {
        savedLabel: tTool("inspectComplete"),
        afterMeta: null,
        rows: [
          {label: tTool("fields.altText"), value: summary.result.altText},
          {label: tTool("fields.title"), value: summary.result.title},
        ],
      };
    },
  };
}

/** Default EN config for tests / pages that set options from locale later. */
export const aiAltToolConfig = createAiAltToolConfig("en");
