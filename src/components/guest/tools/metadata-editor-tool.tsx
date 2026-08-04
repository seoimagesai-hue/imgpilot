"use client";

import Link from "next/link";
import {useEffect, useId, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {trackGuestEvent} from "@/lib/guest/analytics";
import {
  buildHtmlFigureSnippet,
  buildHtmlImageSnippet,
  defaultGuestEditorDraft,
  formatEditorCsv,
  formatEditorJson,
  formatEditorTxt,
  GUEST_EDITOR_ALT_HARD_MAX,
  GUEST_EDITOR_ALT_RECOMMENDED_MAX,
  GUEST_EDITOR_CAPTION_MAX,
  GUEST_EDITOR_LONG_MAX,
  GUEST_EDITOR_SHORT_MAX,
  GUEST_EDITOR_TITLE_MAX,
  GUEST_METADATA_EDIT_OPERATION,
  suggestedFilenameWithExtension,
  type GuestEditorDraft,
  type GuestEditorValidation,
} from "@/lib/guest/metadata-editor-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";
import {
  createGuestRenamedDownload,
  importGuestMetadataEditorAi,
  saveGuestMetadataEditorDraft,
} from "@/components/guest/guest-api-client";

export type GuestMetadataEditorOptions = {
  sourceMode: "blank" | "ai_import";
};

type EditorSummary = {
  schemaVersion: "image-seo-metadata-v2";
  uploadId: string;
  image: {
    originalFilename: string | null;
    format: string;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    byteSize: number | null;
  };
  draft: GuestEditorDraft;
  validation: GuestEditorValidation | null;
  aiImportAvailable: boolean;
  preparedAt: string;
};

function isEditorSummary(raw: unknown): raw is EditorSummary {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (raw as EditorSummary).schemaVersion === "image-seo-metadata-v2" &&
      (raw as EditorSummary).draft?.metadata &&
      (raw as EditorSummary).uploadId,
  );
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], {type: `${mime};charset=utf-8`});
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

function OptionsPanel({
  options,
  onChange,
  disabled,
}: GuestToolOptionsPanelProps<GuestMetadataEditorOptions>) {
  const t = useTranslations("guest.metadataEditor");
  const formId = useId();
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
        <p className="mt-2 text-xs text-[var(--muted-foreground)]" role="note">
          {t("altCmsNote")}
        </p>
      </div>
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">{t("startMode")}</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("startMode")}>
          {(
            [
              ["blank", "blankStart"],
              ["ai_import", "aiImportStart"],
            ] as const
          ).map(([mode, key]) => {
            const selected = options.sourceMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({sourceMode: mode})}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                }`}
              >
                {t(key)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">{t("aiImportHint")}</p>
      </fieldset>
    </section>
  );
}

function CharCount({value, max, recommended}: {value: string; max: number; recommended?: number}) {
  const len = value.length;
  const overRec = recommended != null && len > recommended;
  return (
    <p className="text-xs text-[var(--muted-foreground)]" dir="ltr">
      {len}/{max}
      {recommended != null ? ` (rec. ≤${recommended})` : ""}
      {overRec ? " ·" : ""}
    </p>
  );
}

function EditorResultPanel({
  summary,
  expiresAt,
  jobId,
}: {
  summary: Record<string, unknown> | null | undefined;
  expiresAt: string | null;
  uploadId?: string | null;
  jobId?: string | null;
}) {
  const t = useTranslations("guest.metadataEditor");
  const locale = useLocale();
  const formId = useId();
  const validationRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<"fields" | "validation" | "website" | "cms" | "export">("fields");
  const [draft, setDraft] = useState<GuestEditorDraft>(defaultGuestEditorDraft());
  const [validation, setValidation] = useState<GuestEditorValidation | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<EditorSummary["image"] | null>(null);
  const [resolvedUploadId, setResolvedUploadId] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditorSummary(summary)) return;
    setDraft(summary.draft);
    setValidation(summary.validation);
    setAiAvailable(summary.aiImportAvailable);
    setImage(summary.image);
    setResolvedUploadId(summary.uploadId);
  }, [summary]);

  if (!isEditorSummary(summary) || !image) {
    return <p className="text-sm text-[var(--muted-foreground)]">{t("resultUnavailable")}</p>;
  }

  const imageInfo = image;

  const suggested = suggestedFilenameWithExtension(draft.metadata.filename, imageInfo.mimeType);
  const imgSnippet = buildHtmlImageSnippet({
    filename: suggested,
    altText: draft.metadata.altText,
    title: draft.metadata.title,
    decorative: draft.decorative,
  });
  const figSnippet = buildHtmlFigureSnippet({
    filename: suggested,
    altText: draft.metadata.altText,
    caption: draft.metadata.caption,
    decorative: draft.decorative,
  });

  async function persist(next: GuestEditorDraft, validate: boolean) {
    if (!jobId) return;
    setBusy(true);
    const res = await saveGuestMetadataEditorDraft({jobId, draft: next, validate});
    setBusy(false);
    if (!res.ok) {
      setStatus(t("saveFailed"));
      return;
    }
    if (isEditorSummary(res.resultSummary as unknown)) {
      setDraft((res.resultSummary as EditorSummary).draft);
      setValidation((res.resultSummary as EditorSummary).validation);
      setAiAvailable((res.resultSummary as EditorSummary).aiImportAvailable);
    }
    trackGuestEvent({
      name: validate ? "guest_metadata_editor_validate" : "guest_metadata_editor_save",
      toolCode: "image-metadata-editor",
    });
    setStatus(validate ? t("validated") : t("saved"));
    if (validate) {
      setTab("validation");
      requestAnimationFrame(() => validationRef.current?.focus());
    }
  }

  async function onImportAi() {
    if (!jobId) return;
    setBusy(true);
    const res = await importGuestMetadataEditorAi(jobId);
    setBusy(false);
    if (!res.ok) {
      setStatus(
        res.error === "GUEST_METADATA_EDITOR_AI_RESULT_NOT_FOUND"
          ? t("aiNotFound")
          : t("importFailed"),
      );
      return;
    }
    if (isEditorSummary(res.resultSummary as unknown)) {
      setDraft((res.resultSummary as EditorSummary).draft);
      setValidation((res.resultSummary as EditorSummary).validation);
      setAiAvailable((res.resultSummary as EditorSummary).aiImportAvailable);
    }
    trackGuestEvent({name: "guest_metadata_editor_ai_import", toolCode: "image-metadata-editor"});
    setStatus(t("imported"));
  }

  async function onCopy(label: string, value: string) {
    if (!value) {
      setStatus(t("emptyField"));
      return;
    }
    const ok = await copyText(value);
    setStatus(ok ? t("copySuccess") : t("copyFailed"));
    if (ok) trackGuestEvent({name: "guest_metadata_editor_copy", toolCode: "image-metadata-editor"});
  }

  function exportPayload() {
    return {
      draft,
      originalFilename: imageInfo.originalFilename,
      suggestedFilename: suggested,
      format: imageInfo.format,
      width: imageInfo.width,
      height: imageInfo.height,
      generatedAt: new Date().toISOString(),
      expiresAt,
    };
  }

  function onExportTxt() {
    downloadBlob(
      "image-seo-metadata.txt",
      formatEditorTxt({
        draft,
        suggestedFilename: suggested,
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
        expiresAt,
      }),
      "text/plain",
    );
    trackGuestEvent({name: "guest_metadata_editor_export_txt", toolCode: "image-metadata-editor"});
    setStatus(t("exportTxtReady"));
  }

  function onExportJson() {
    const p = exportPayload();
    downloadBlob(
      "image-seo-metadata.json",
      formatEditorJson({
        draft: p.draft,
        originalFilename: p.originalFilename,
        suggestedFilename: p.suggestedFilename,
        format: p.format,
        width: p.width,
        height: p.height,
        generatedAt: p.generatedAt,
        expiresAt: p.expiresAt,
      }),
      "application/json",
    );
    trackGuestEvent({name: "guest_metadata_editor_export_json", toolCode: "image-metadata-editor"});
    setStatus(t("exportJsonReady"));
  }

  function onExportCsv() {
    downloadBlob(
      "image-seo-metadata.csv",
      formatEditorCsv({
        draft,
        originalFilename: imageInfo.originalFilename,
        suggestedFilename: suggested,
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
      }),
      "text/csv",
    );
    trackGuestEvent({name: "guest_metadata_editor_export_csv", toolCode: "image-metadata-editor"});
    setStatus(t("exportCsvReady"));
  }

  function onExportHtml() {
    const body = [
      "<!-- Safe HTML snippets — placeholder paths only. Not live R2 URLs. -->",
      imgSnippet,
      "",
      figSnippet,
      "",
    ].join("\n");
    downloadBlob("image-seo-metadata-snippets.txt", body, "text/plain");
    trackGuestEvent({name: "guest_metadata_editor_export_html", toolCode: "image-metadata-editor"});
    setStatus(t("exportHtmlReady"));
  }

  async function onRenamedDownload() {
    if (!resolvedUploadId || !draft.metadata.filename) {
      setStatus(t("filenameRequired"));
      return;
    }
    setBusy(true);
    const res = await createGuestRenamedDownload({
      uploadId: resolvedUploadId,
      filenameBase: draft.metadata.filename,
    });
    setBusy(false);
    if (!res.ok) {
      setStatus(t("downloadFailed"));
      return;
    }
    const a = document.createElement("a");
    a.href = res.url;
    a.download = res.filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    trackGuestEvent({
      name: "guest_metadata_editor_renamed_download",
      toolCode: "image-metadata-editor",
    });
    setStatus(t("downloadStarted"));
  }

  function addKeyword() {
    const next = keywordInput.trim().toLowerCase();
    if (!next) return;
    if (draft.metadata.keywords.includes(next)) {
      setKeywordInput("");
      return;
    }
    if (draft.metadata.keywords.length >= 12) return;
    setDraft({
      ...draft,
      metadata: {...draft.metadata, keywords: [...draft.metadata.keywords, next.slice(0, 40)]},
    });
    setKeywordInput("");
  }

  const tabs = [
    ["fields", "tabFields"],
    ["validation", "tabValidation"],
    ["website", "tabWebsite"],
    ["cms", "tabCms"],
    ["export", "tabExport"],
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]" role="note">
        {t("rankingDisclaimer")}
      </p>
      {draft.sourceMode === "ai_import" ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">
          {t("aiReviewWarning")}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] p-4 text-sm">
        <h3 className="font-semibold">{t("imageDetails")}</h3>
        <dl className="mt-2 grid gap-1 sm:grid-cols-2" dir="ltr">
          <div>
            <dt className="text-[var(--muted-foreground)]">{t("originalFilename")}</dt>
            <dd>{imageInfo.originalFilename || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">{t("format")}</dt>
            <dd>{imageInfo.format}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">{t("dimensions")}</dt>
            <dd>
              {imageInfo.width ?? "—"}×{imageInfo.height ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {aiAvailable ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onImportAi()}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
          >
            {t("importAi")}
          </button>
          <p className="text-xs text-[var(--muted-foreground)]">{t("importAiHint")}</p>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("noAiResult")}{" "}
          <Link className="underline" href={`/${locale}/ai-alt-text`}>
            {t("openAiAlt")}
          </Link>
        </p>
      )}

      <div role="tablist" aria-label={t("tabsAria")} className="flex flex-wrap gap-2">
        {tabs.map(([id, key]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            id={`${formId}-tab-${id}`}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === id ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)]/20"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === "fields" ? (
        <div className="space-y-4" role="tabpanel" aria-labelledby={`${formId}-tab-fields`}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.decorative}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  decorative: e.target.checked,
                  metadata: {...draft.metadata, altText: e.target.checked ? "" : draft.metadata.altText},
                })
              }
            />
            {t("decorative")}
          </label>
          <p className="text-xs text-[var(--muted-foreground)]">{t("decorativeHint")}</p>

          {(
            [
              ["altText", "altText", GUEST_EDITOR_ALT_HARD_MAX, GUEST_EDITOR_ALT_RECOMMENDED_MAX, false],
              ["title", "title", GUEST_EDITOR_TITLE_MAX, undefined, false],
              ["caption", "caption", GUEST_EDITOR_CAPTION_MAX, undefined, true],
              ["shortDescription", "shortDescription", GUEST_EDITOR_SHORT_MAX, undefined, true],
              ["longDescription", "longDescription", GUEST_EDITOR_LONG_MAX, undefined, true],
            ] as const
          ).map(([field, labelKey, max, rec, multiline]) => (
            <div key={field} className="space-y-1">
              <label className="text-sm font-medium" htmlFor={`${formId}-${field}`}>
                {t(labelKey)}
              </label>
              {multiline ? (
                <textarea
                  id={`${formId}-${field}`}
                  rows={field === "longDescription" ? 5 : 3}
                  maxLength={max}
                  value={draft.metadata[field]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      metadata: {...draft.metadata, [field]: e.target.value},
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                />
              ) : (
                <input
                  id={`${formId}-${field}`}
                  type="text"
                  maxLength={max}
                  disabled={field === "altText" && draft.decorative}
                  value={draft.metadata[field]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      metadata: {...draft.metadata, [field]: e.target.value},
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                />
              )}
              <CharCount value={draft.metadata[field]} max={max} recommended={rec} />
              <button
                type="button"
                className="text-xs underline"
                onClick={() => void onCopy(field, draft.metadata[field])}
              >
                {t("copyField")}
              </button>
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor={`${formId}-filename`}>
              {t("suggestedFilename")}
            </label>
            <input
              id={`${formId}-filename`}
              type="text"
              dir="ltr"
              value={draft.metadata.filename}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  metadata: {...draft.metadata, filename: e.target.value},
                })
              }
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
            <p className="text-xs text-[var(--muted-foreground)]" dir="ltr">
              {t("suggestedAs")}: {suggested}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{t("filenameBoundary")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`${formId}-kw`}>
              {t("keywords")}
            </label>
            <div className="flex flex-wrap gap-2">
              {draft.metadata.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--muted)]/25 px-2 py-1 text-xs"
                >
                  {kw}
                  <button
                    type="button"
                    aria-label={`${t("removeKeyword")}: ${kw}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        metadata: {
                          ...draft.metadata,
                          keywords: draft.metadata.keywords.filter((k) => k !== kw),
                        },
                      })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                id={`${formId}-kw`}
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                className="min-w-[12rem] flex-1 rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                {t("addKeyword")}
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">{t("keywordsHint")}</p>
          </div>

          {draft.sourceMode === "ai_import" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.aiReviewed}
                onChange={(e) => setDraft({...draft, aiReviewed: e.target.checked})}
              />
              {t("markAiReviewed")}
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void persist(draft, false)}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              {t("saveDraft")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void persist(draft, true)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium"
            >
              {t("validate")}
            </button>
          </div>
        </div>
      ) : null}

      {tab === "validation" ? (
        <section
          ref={validationRef}
          tabIndex={-1}
          className="space-y-3 rounded-xl border border-[var(--border)] p-4 outline-none"
          role="tabpanel"
          aria-labelledby={`${formId}-tab-validation`}
        >
          <h3 className="text-sm font-semibold">{t("checklistTitle")}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">{t("rankingDisclaimer")}</p>
          <ul className="space-y-1 text-sm">
            {(validation?.checklist ?? []).map((item) => (
              <li key={item.id}>
                {item.passed ? "✓" : "○"} {item.label}
              </li>
            ))}
          </ul>
          <h4 className="text-sm font-semibold">{t("issuesTitle")}</h4>
          {(validation?.issues ?? []).length === 0 ? (
            <p className="text-sm">{t("noIssues")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {validation!.issues.map((issue) => (
                <li key={`${issue.code}-${issue.field}`}>
                  <span className="font-medium">[{issue.severity}]</span> {issue.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "website" ? (
        <div className="space-y-3" role="tabpanel" aria-labelledby={`${formId}-tab-website`}>
          <p className="text-xs text-[var(--muted-foreground)]">{t("htmlPreviewHint")}</p>
          <pre
            className="overflow-x-auto rounded-xl border border-[var(--border)] p-3 text-xs"
            dir="ltr"
          >
            <code>{imgSnippet}</code>
          </pre>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => void onCopy("html", imgSnippet)}
          >
            {t("copyHtml")}
          </button>
          <pre
            className="overflow-x-auto rounded-xl border border-[var(--border)] p-3 text-xs"
            dir="ltr"
          >
            <code>{figSnippet}</code>
          </pre>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => void onCopy("figure", figSnippet)}
          >
            {t("copyFigure")}
          </button>
        </div>
      ) : null}

      {tab === "cms" ? (
        <div className="space-y-2 text-sm" role="tabpanel" aria-labelledby={`${formId}-tab-cms`}>
          <p className="text-xs text-[var(--muted-foreground)]">{t("cmsHint")}</p>
          <dl className="space-y-2">
            {[
              ["cmsFilename", suggested],
              ["altText", draft.decorative ? '""' : draft.metadata.altText || "—"],
              ["title", draft.metadata.title || "—"],
              ["caption", draft.metadata.caption || "—"],
              ["shortDescription", draft.metadata.shortDescription || "—"],
              ["keywords", draft.metadata.keywords.join(", ") || "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-[var(--muted-foreground)]">{t(k)}</dt>
                <dd dir={k === "cmsFilename" ? "ltr" : undefined}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-[var(--muted-foreground)]">{t("exportNoPublish")}</p>
        </div>
      ) : null}

      {tab === "export" ? (
        <div className="flex flex-wrap gap-2" role="tabpanel" aria-labelledby={`${formId}-tab-export`}>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={onExportTxt}
          >
            {t("downloadTxt")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={onExportJson}
          >
            {t("downloadJson")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={onExportCsv}
          >
            {t("downloadCsv")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={onExportHtml}
          >
            {t("downloadHtml")}
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            onClick={() => void onRenamedDownload()}
          >
            {t("downloadRenamed")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() =>
              void onCopy(
                "all",
                [
                  draft.metadata.altText,
                  draft.metadata.title,
                  draft.metadata.caption,
                  draft.metadata.shortDescription,
                  draft.metadata.longDescription,
                  suggested,
                  draft.metadata.keywords.join(", "),
                ].join("\n"),
              )
            }
          >
            {t("copyAll")}
          </button>
        </div>
      ) : null}

      <p className="text-sm text-[var(--muted-foreground)]" role="status" aria-live="polite">
        {status}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">{t("expiryNotice")}</p>
    </div>
  );
}

export function createMetadataEditorToolConfig(
  _locale?: string,
): GuestToolConfig<GuestMetadataEditorOptions> {
  void _locale;
  return {
    toolCode: "image-metadata-editor",
    operation: GUEST_METADATA_EDIT_OPERATION,
    titleKey: "metadataEditor",
    messageNamespace: "metadataEditor",
    processingPhase: "preparing_editor",
    hideImageDownload: true,
    allowReprocess: true,
    showOptionsWhenDone: true,
    defaultOptions: {sourceMode: "blank"},
    OptionsPanel,
    CustomResultPanel: EditorResultPanel,
    buildJobOptions: (options) => ({sourceMode: options.sourceMode}),
    mapResultSummary: (summary, {tTool}) => {
      if (!isEditorSummary(summary)) {
        return {rows: [], savedLabel: null, afterMeta: null};
      }
      return {
        savedLabel: tTool("inspectComplete"),
        afterMeta: {
          width: summary.image.width,
          height: summary.image.height,
          bytes: summary.image.byteSize,
          format: summary.image.format,
        },
        rows: [],
      };
    },
  };
}

export const metadataEditorToolConfig = createMetadataEditorToolConfig();
