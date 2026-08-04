"use client";

import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useCallback, useId, useState} from "react";
import {
  createMetadataBatchAction,
  preflightMetadataBatchAction,
  type AiMetadataBatchActionState,
  type PreflightAiMetadataBatchResult,
} from "@/server/images/ai-metadata-batch-actions";
import {AI_METADATA_TEMPLATE_CODES} from "@/server/images/ai-metadata-templates";

const MAX_IMAGES = 50;

export type BatchImageOption = {
  id: string;
  originalFilename: string;
};

type Props = {
  projectId: string;
  defaultLanguage: string;
  availableImages: BatchImageOption[];
};

function parseIdsFromTextarea(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_IMAGES);
}

export function BatchCreateForm({projectId, defaultLanguage, availableImages}: Props) {
  const t = useTranslations("aiBatches");
  const router = useRouter();
  const formId = useId();
  const [templateCode, setTemplateCode] = useState<string>("seo");
  const [language, setLanguage] = useState(defaultLanguage === "ur" ? "ur" : "en");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [textareaIds, setTextareaIds] = useState("");
  const [useTextarea, setUseTextarea] = useState(availableImages.length === 0);
  const [skipExistingDrafts, setSkipExistingDrafts] = useState(true);
  const [privacyAck, setPrivacyAck] = useState(false);
  const [preflight, setPreflight] = useState<PreflightAiMetadataBatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedImageIds = useCallback((): string[] => {
    if (useTextarea) return parseIdsFromTextarea(textareaIds);
    return [...selectedIds].slice(0, MAX_IMAGES);
  }, [useTextarea, textareaIds, selectedIds]);

  const msg = (code?: string) => {
    if (!code) return null;
    try {
      return t(`errors.${code}` as "errors.INVALID_REQUEST");
    } catch {
      return code;
    }
  };

  const buildFormData = (imageIds: string[]) => {
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("templateCode", templateCode);
    fd.set("language", language);
    fd.set("selectionType", "manual");
    fd.set("imageIds", imageIds.join(","));
    fd.set("skipExistingDrafts", skipExistingDrafts ? "true" : "false");
    return fd;
  };

  const runPreflight = async () => {
    const imageIds = resolvedImageIds();
    if (!imageIds.length) {
      setError("AI_BATCH_EMPTY_SELECTION");
      return;
    }
    setBusy(true);
    setError(null);
    setPreflight(null);
    try {
      const result: AiMetadataBatchActionState = await preflightMetadataBatchAction(
        {ok: false},
        buildFormData(imageIds),
      );
      if (!result.ok) {
        setError(result.error ?? "INVALID_REQUEST");
        return;
      }
      if (result.preflight) setPreflight(result.preflight);
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const startBatch = async () => {
    const imageIds = resolvedImageIds();
    if (!imageIds.length) {
      setError("AI_BATCH_EMPTY_SELECTION");
      return;
    }
    if (!privacyAck) {
      setError("PRIVACY_ACK_REQUIRED");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = buildFormData(imageIds);
      fd.set("idempotencyKey", `ui-batch:${projectId}:${Date.now()}`);
      const result: AiMetadataBatchActionState = await createMetadataBatchAction({ok: false}, fd);
      if (!result.ok) {
        setError(result.error ?? "INVALID_REQUEST");
        return;
      }
      if (result.batch) {
        router.push(`/dashboard/projects/${projectId}/ai-batches/${result.batch.id}`);
      }
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const toggleImage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_IMAGES) next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(availableImages.slice(0, MAX_IMAGES).map((i) => i.id)));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("create.configuration")}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("create.template")}</span>
            <select
              value={templateCode}
              disabled={busy}
              onChange={(e) => {
                setTemplateCode(e.target.value);
                setPreflight(null);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            >
              {AI_METADATA_TEMPLATE_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`templates.${code}`)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              {t(`templateHints.${templateCode}` as "templateHints.seo")}
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("create.language")}</span>
            <select
              value={language}
              disabled={busy}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPreflight(null);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            >
              <option value="en">{t("languageEnglish")}</option>
              <option value="ur">{t("languageUrdu")}</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={skipExistingDrafts}
            disabled={busy}
            onChange={(e) => {
              setSkipExistingDrafts(e.target.checked);
              setPreflight(null);
            }}
          />
          {t("create.skipExistingDrafts")}
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("create.images")}</h2>
          {availableImages.length > 0 ? (
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={`underline ${!useTextarea ? "font-semibold" : ""}`}
                onClick={() => setUseTextarea(false)}
              >
                {t("create.selectFromList")}
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                className={`underline ${useTextarea ? "font-semibold" : ""}`}
                onClick={() => setUseTextarea(true)}
              >
                {t("create.pasteIds")}
              </button>
            </div>
          ) : null}
        </div>

        {useTextarea || availableImages.length === 0 ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("create.imageIdsLabel")}</span>
            <textarea
              value={textareaIds}
              disabled={busy}
              onChange={(e) => {
                setTextareaIds(e.target.value);
                setPreflight(null);
              }}
              rows={5}
              placeholder={t("create.imageIdsPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs"
            />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              {t("create.maxImages", {max: MAX_IMAGES})}
            </span>
          </label>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-sm">
              <span>{t("create.selectedCount", {count: selectedIds.size})}</span>
              <button type="button" className="underline" onClick={() => setSelectedIds(new Set())}>
                {t("create.clearSelection")}
              </button>
              <button type="button" className="underline" onClick={selectAllVisible}>
                {t("create.selectAllVisible")}
              </button>
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] p-2">
              {availableImages.map((img) => (
                <li key={img.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(img.id)}
                      disabled={busy}
                      onChange={() => toggleImage(img.id)}
                    />
                    <span className="truncate text-sm">{img.originalFilename}</span>
                    <span className="ms-auto font-mono text-xs text-[var(--muted)]">{img.id.slice(0, 8)}…</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <h2 className="font-semibold">{t("create.privacyTitle")}</h2>
        <p className="mt-2">{t("create.privacyNotice")}</p>
        <p className="mt-2">{t("create.reviewRequired")}</p>
        <label className="mt-3 flex items-start gap-2">
          <input
            type="checkbox"
            checked={privacyAck}
            disabled={busy}
            onChange={(e) => setPrivacyAck(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t("create.privacyAck")}</span>
        </label>
      </section>

      {preflight ? (
        <section className="space-y-2 rounded-2xl border border-[var(--border)] bg-gray-50/50 p-4 text-sm">
          <h2 className="font-semibold">{t("preflight.title")}</h2>
          <p>{t("preflight.resolved", {count: preflight.totalResolved})}</p>
          <p className="text-emerald-800">
            {t("preflight.eligible", {count: preflight.eligible.length})}
          </p>
          {preflight.ineligible.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-[var(--muted)]">
                {t("preflight.ineligible", {count: preflight.ineligible.length})}
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
                {preflight.ineligible.map((row) => (
                  <li key={row.imageId}>
                    {row.imageId.slice(0, 8)}… — {row.code ? t(`eligibility.${row.code}` as "eligibility.IMAGE_NOT_ELIGIBLE") : "—"}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <p className="text-[var(--muted)]">
            {preflight.allowanceRemaining == null
              ? t("preflight.allowanceUnlimited")
              : t("preflight.allowanceRemaining", {count: preflight.allowanceRemaining})}
            {!preflight.allowanceSufficient ? (
              <span className="ms-2 text-red-700">{t("preflight.allowanceInsufficient")}</span>
            ) : null}
          </p>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {msg(error)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={runPreflight}
          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? t("create.checking") : t("create.runPreflight")}
        </button>
        <button
          type="button"
          disabled={busy || !privacyAck}
          onClick={startBatch}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          aria-describedby={formId}
        >
          {busy ? t("create.starting") : t("create.startBatch")}
        </button>
      </div>
    </div>
  );
}
