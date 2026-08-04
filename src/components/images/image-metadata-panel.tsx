"use client";

import {useLocale, useTranslations} from "next-intl";
import {useEffect, useMemo, useState} from "react";
import {scoreMetadataFields} from "@/server/images/ai-metadata-quality";
import {MetadataDiffView} from "@/components/images/metadata-diff-view";

type Generation = {
  id: string;
  status: string;
  language: string;
  altText: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  filenameSuggestion: string | null;
  lastErrorCode: string | null;
  provider: string;
  model: string;
  promptVersion: string;
};

type Approved = {
  altText: string;
  title: string;
  caption: string | null;
  description: string;
  filenameSuggestion: string;
  approvedAt: string;
  language: string;
};

type Props = {
  projectId: string;
  imageId: string;
  imageStatus: string;
  metadataLanguage: string;
};

const ELIGIBLE = new Set(["validated", "ready_for_processing"]);
const TERMINAL_DRAFT = new Set(["draft", "reviewed", "approved", "rejected", "failed", "cancelled", "stale"]);

export function ImageMetadataPanel({
  projectId,
  imageId,
  imageStatus,
  metadataLanguage,
}: Props) {
  const t = useTranslations("images.metadata");
  const locale = useLocale();
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [approved, setApproved] = useState<Approved | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [diffs, setDiffs] = useState<
    Array<{
      field: string;
      before: string;
      after: string;
      changed: boolean;
      ops: Array<{type: "equal" | "added" | "removed"; text: string}>;
    }>
  >([]);
  const [form, setForm] = useState({
    altText: "",
    title: "",
    caption: "",
    description: "",
    filenameSuggestion: "",
  });

  const eligible = ELIGIBLE.has(imageStatus);
  const rtl = (generation?.language ?? metadataLanguage) === "ur";
  const quality = useMemo(
    () =>
      scoreMetadataFields({
        altText: form.altText || generation?.altText,
        title: form.title || generation?.title,
        caption: form.caption || generation?.caption,
        description: form.description || generation?.description,
        filenameSuggestion: form.filenameSuggestion || generation?.filenameSuggestion,
      }),
    [form, generation],
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/projects/${projectId}/metadata`);
      const json = (await res.json()) as {ok?: boolean; ai?: {configured?: boolean}};
      setAiConfigured(Boolean(json.ai?.configured));
      const histRes = await fetch(`/api/projects/${projectId}/images/${imageId}/metadata`);
      const histJson = (await histRes.json()) as {
        ok?: boolean;
        history?: Generation[];
        approved?: Approved | null;
      };
      if (histJson.history) setHistory(histJson.history);
      if (histJson.approved) setApproved(histJson.approved);
      const latest = histJson.history?.[0];
      if (latest && TERMINAL_DRAFT.has(latest.status)) {
        setGeneration(latest);
        setForm({
          altText: latest.altText ?? "",
          title: latest.title ?? "",
          caption: latest.caption ?? "",
          description: latest.description ?? "",
          filenameSuggestion: latest.filenameSuggestion ?? "",
        });
      }
    })();
  }, [projectId, imageId]);

  const pollGeneration = async (generationId: string) => {
    const started = Date.now();
    while (Date.now() - started < 120_000) {
      const res = await fetch(`/api/projects/${projectId}/metadata/${generationId}`);
      const json = (await res.json()) as {ok?: boolean; generation?: Generation};
      if (json.generation) {
        setGeneration(json.generation);
        if (TERMINAL_DRAFT.has(json.generation.status)) {
          setForm({
            altText: json.generation.altText ?? "",
            title: json.generation.title ?? "",
            caption: json.generation.caption ?? "",
            description: json.generation.description ?? "",
            filenameSuggestion: json.generation.filenameSuggestion ?? "",
          });
          return json.generation;
        }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    return null;
  };

  const generate = async () => {
    if (!noticeAccepted) {
      setError("PRIVACY_NOTICE_REQUIRED");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          imageId,
          language: metadataLanguage,
          idempotencyKey: `meta:${imageId}:${metadataLanguage}:${Date.now()}`,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        generation?: Generation;
      };
      if (!json.ok || !json.generation) {
        setError(json.error ?? "AI_PROVIDER_UNAVAILABLE");
        return;
      }
      setGeneration(json.generation);
      await pollGeneration(json.generation.id);
      const histRes = await fetch(`/api/projects/${projectId}/images/${imageId}/metadata`);
      const histJson = (await histRes.json()) as {history?: Generation[]; approved?: Approved | null};
      if (histJson.history) setHistory(histJson.history);
      if (histJson.approved) setApproved(histJson.approved);
    } catch {
      setError("AI_PROVIDER_UNAVAILABLE");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!generation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata/${generation.id}?action=save`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          ...form,
          caption: form.caption || null,
        }),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; generation?: Generation};
      if (json.generation) setGeneration(json.generation);
      if (!json.ok) setError(json.error ?? "METADATA_VALIDATION_FAILED");
    } catch {
      setError("METADATA_VALIDATION_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!generation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metadata/${generation.id}?action=approve`,
        {method: "POST"},
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        generation?: Generation;
        approved?: Approved;
      };
      if (json.generation) setGeneration(json.generation);
      if (json.approved) setApproved(json.approved);
      if (!json.ok) setError(json.error ?? "METADATA_NOT_APPROVABLE");
    } catch {
      setError("METADATA_NOT_APPROVABLE");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!generation) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metadata/${generation.id}?action=reject`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; generation?: Generation; error?: string};
      if (json.generation) setGeneration(json.generation);
      if (!json.ok) setError(json.error ?? "METADATA_NOT_APPROVABLE");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    if (!generation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metadata/${generation.id}?action=retry`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean; generation?: Generation; error?: string};
      if (!json.ok || !json.generation) {
        setError(json.error ?? "AI_PROVIDER_UNAVAILABLE");
        return;
      }
      setGeneration(json.generation);
      await pollGeneration(json.generation.id);
    } catch {
      setError("AI_PROVIDER_UNAVAILABLE");
    } finally {
      setBusy(false);
    }
  };

  const openCompare = async () => {
    if (!generation) return;
    const res = await fetch(
      `/api/projects/${projectId}/metadata/review?mode=compare&generationId=${generation.id}`,
    );
    const json = (await res.json()) as {ok?: boolean; diffs?: typeof diffs};
    if (json.diffs) {
      setDiffs(json.diffs);
      setCompareOpen(true);
    }
  };

  if (!eligible && !generation && !approved) {
    return <p className="text-sm text-[var(--muted)]">{t("notEligible")}</p>;
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-3">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="text-xs text-[var(--muted)]">
        {t("languageLabel")}: {metadataLanguage === "ur" ? t("langUrdu") : t("langEnglish")}
      </p>
      <p className="text-xs text-[var(--muted)]">{t("privacyNotice")}</p>
      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={noticeAccepted}
          onChange={(e) => setNoticeAccepted(e.target.checked)}
        />
        <span>{t("privacyAck")}</span>
      </label>
      {aiConfigured === false ? (
        <p className="text-sm text-[var(--muted)]">{t("aiUnavailable")}</p>
      ) : (
        <button
          type="button"
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          disabled={busy || !noticeAccepted || !eligible}
          onClick={generate}
        >
          {busy ? t("generating") : t("generate")}
        </button>
      )}

      {generation ? (
        <p className="text-xs text-[var(--muted)]" aria-live="polite">
          {t("statusLabel")}: {generation.status}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {generation && (generation.status === "draft" || generation.status === "reviewed") ? (
        <div className={`space-y-2 ${rtl ? "text-right" : "text-left"}`} dir={rtl ? "rtl" : "ltr"}>
          <p className="text-xs font-medium text-[var(--muted)]">{t("draftLabel")}</p>
          <p className="text-xs">
            {t("qualityScore")}: <strong>{quality.overall}/100</strong>
            {quality.overall < 60 ? (
              <span className="ms-2 text-amber-700">{t("lowQualityWarn")}</span>
            ) : null}
          </p>
          {(
            [
              ["altText", t("altText"), 200],
              ["title", t("titleField"), 80],
              ["caption", t("caption"), 200],
              ["description", t("description"), 500],
              ["filenameSuggestion", t("filenameSuggestion"), 80],
            ] as const
          ).map(([key, label, max]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">
                {label}{" "}
                <span className="text-xs text-[var(--muted)]">
                  {form[key].length}/{max}
                </span>
              </span>
              {key === "description" || key === "altText" ? (
                <textarea
                  className="w-full rounded-lg border border-[var(--border)] px-2 py-1"
                  rows={key === "description" ? 4 : 2}
                  value={form[key]}
                  maxLength={max}
                  onChange={(e) => setForm((f) => ({...f, [key]: e.target.value}))}
                />
              ) : (
                <input
                  className="w-full rounded-lg border border-[var(--border)] px-2 py-1"
                  value={form[key]}
                  maxLength={max}
                  onChange={(e) => setForm((f) => ({...f, [key]: e.target.value}))}
                />
              )}
            </label>
          ))}
          <p className="text-xs text-[var(--muted)]">{t("filenameHint")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              disabled={busy}
              onClick={save}
            >
              {t("saveReview")}
            </button>
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
              disabled={busy}
              onClick={approve}
            >
              {t("approve")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              disabled={busy}
              onClick={reject}
            >
              {t("reject")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
              disabled={busy || !noticeAccepted}
              onClick={generate}
            >
              {t("regenerate")}
            </button>
            {approved ? (
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                onClick={openCompare}
              >
                {t("compareToApproved")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {generation && generation.status === "failed" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            disabled={busy}
            onClick={retry}
          >
            {t("retry")}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            disabled={busy || !noticeAccepted}
            onClick={generate}
          >
            {t("regenerate")}
          </button>
        </div>
      ) : null}

      {approved ? (
        <div className={`rounded-lg border border-[var(--border)] p-3 text-sm ${rtl ? "text-right" : ""}`} dir={approved.language === "ur" ? "rtl" : "ltr"}>
          <p className="font-medium">{t("approvedBadge")}</p>
          <p className="text-xs text-[var(--muted)]">
            {new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(
              new Date(approved.approvedAt),
            )}
          </p>
          <p className="mt-2">{approved.altText}</p>
          <p className="mt-1 text-[var(--muted)]">{approved.title}</p>
        </div>
      ) : null}

      {history.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--muted)]">
          <li className="font-medium text-[var(--foreground)]">{t("history")}</li>
          {history.slice(0, 5).map((h) => (
            <li key={h.id}>
              {h.status} · {h.language} · {h.promptVersion}
            </li>
          ))}
        </ul>
      ) : null}

      {compareOpen ? (
        <div className="rounded-lg border border-[var(--border)] p-3">
          <button
            type="button"
            className="mb-2 text-xs text-[var(--muted)]"
            onClick={() => setCompareOpen(false)}
          >
            ×
          </button>
          <MetadataDiffView
            diffs={diffs}
            rtl={rtl}
            labels={{
              altText: t("altText"),
              title: t("titleField"),
              caption: t("caption"),
              description: t("description"),
              filenameSuggestion: t("filenameSuggestion"),
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
