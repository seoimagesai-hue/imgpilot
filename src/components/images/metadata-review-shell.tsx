"use client";

import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useState} from "react";
import {Link} from "@/i18n/navigation";
import {CommentThread} from "@/components/collaboration/comment-thread";
import {MetadataDiffView} from "@/components/images/metadata-diff-view";

type Dashboard = {
  approved: number;
  drafts: number;
  reviewed: number;
  rejected: number;
  failed: number;
  stale: number;
  needsReview: number;
  missingApproved: number;
  duplicates: number;
  averageSeoScore: number | null;
  eligible: number;
};

type ReviewRow = {
  imageId: string;
  originalFilename: string;
  imageStatus: string;
  language: string;
  generation: {
    id: string;
    status: string;
    altText: string | null;
    title: string | null;
    filenameSuggestion: string | null;
  } | null;
  approved: {altText: string; title: string} | null;
  quality: {overall: number} | null;
  isDuplicate: boolean;
  isMissingApproved: boolean;
  needsReview: boolean;
};

const FILTERS = [
  "all",
  "needs_review",
  "draft",
  "reviewed",
  "approved",
  "rejected",
  "failed",
  "stale",
  "missing",
  "duplicate",
  "low_quality",
] as const;

type Props = {
  projectId: string;
  metadataLanguage: string;
  currentUserId?: string;
};

export function MetadataReviewShell({projectId, metadataLanguage, currentUserId}: Props) {
  const t = useTranslations("images.metadataReview");
  const tm = useTranslations("images.metadata");
  const locale = useLocale();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("needs_review");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<
    Array<{
      field: string;
      before: string;
      after: string;
      changed: boolean;
      ops: Array<{type: "equal" | "added" | "removed"; text: string}>;
    }>
  >([]);
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [packageKind, setPackageKind] = useState<
    "zip" | "csv" | "json" | "wordpress" | "shopify" | "webflow" | "generic"
  >("zip");
  const [includeImages, setIncludeImages] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [dashRes, listRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/metadata/review?mode=dashboard`),
      fetch(
        `/api/projects/${projectId}/metadata/review?filter=${filter}&q=${encodeURIComponent(q)}`,
      ),
    ]);
    const dashJson = (await dashRes.json()) as {ok?: boolean; dashboard?: Dashboard};
    const listJson = (await listRes.json()) as {ok?: boolean; rows?: ReviewRow[]; error?: string};
    if (dashJson.dashboard) setDashboard(dashJson.dashboard);
    if (listJson.rows) setRows(listJson.rows);
    if (!listJson.ok) setError(listJson.error ?? "INVALID_REQUEST");
  }, [projectId, filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (generationId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(generationId)) next.delete(generationId);
      else next.add(generationId);
      return next;
    });
  };

  const bulk = async (action: "approve" | "reject" | "regenerate" | "mark_reviewed") => {
    const generationIds = [...selected];
    const imageIds =
      action === "regenerate"
        ? rows.filter((r) => r.generation && selected.has(r.generation.id)).map((r) => r.imageId)
        : undefined;
    if (!generationIds.length && !imageIds?.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/metadata/bulk`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(
          action === "regenerate"
            ? {action, imageIds}
            : {action, generationIds},
        ),
      });
      const json = (await res.json()) as {ok?: boolean; error?: string; failed?: unknown[]};
      if (!json.ok) setError(json.error ?? "INVALID_REQUEST");
      setSelected(new Set());
      await load();
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const openCompare = async (generationId: string) => {
    setCompareId(generationId);
    const res = await fetch(
      `/api/projects/${projectId}/metadata/review?mode=compare&generationId=${generationId}`,
    );
    const json = (await res.json()) as {ok?: boolean; diffs?: typeof diffs};
    if (json.diffs) setDiffs(json.diffs);
  };

  const previewExport = async () => {
    const res = await fetch(`/api/projects/${projectId}/metadata/export-preview`);
    const json = (await res.json()) as {
      ok?: boolean;
      package?: {itemCount: number; filesGenerated: boolean};
    };
    if (json.ok && json.package) setExportCount(json.package.itemCount);
  };

  const startExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/exports`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          packageKind,
          sourceFilter: "approved",
          includeImages,
          idempotencyKey: `export:${projectId}:${packageKind}:${Date.now()}`,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        job?: {id: string; status: string};
      };
      if (!json.ok || !json.job) {
        setError(json.error ?? "INVALID_REQUEST");
        return;
      }
      setExportJobId(json.job.id);
      setExportStatus(json.job.status);
      const started = Date.now();
      while (Date.now() - started < 180_000) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await fetch(`/api/projects/${projectId}/exports/${json.job.id}`);
        const pollJson = (await poll.json()) as {
          ok?: boolean;
          job?: {status: string};
        };
        if (pollJson.job) {
          setExportStatus(pollJson.job.status);
          if (["completed", "failed", "cancelled"].includes(pollJson.job.status)) break;
        }
      }
    } catch {
      setError("INVALID_REQUEST");
    } finally {
      setBusy(false);
    }
  };

  const downloadExport = async () => {
    if (!exportJobId) return;
    const res = await fetch(
      `/api/projects/${projectId}/exports/${exportJobId}?action=download-url`,
      {method: "POST"},
    );
    const json = (await res.json()) as {ok?: boolean; downloadUrl?: string; error?: string};
    if (json.ok && json.downloadUrl) {
      window.location.href = json.downloadUrl;
    } else {
      setError(json.error ?? "EXPORT_NOT_READY");
    }
  };

  const rtl = metadataLanguage === "ur";
  const selectable = rows.filter((r) => r.generation && ["draft", "reviewed", "failed"].includes(r.generation.status));

  return (
    <div className="space-y-6">
      {dashboard ? (
        <section className="grid gap-2 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <Stat label={t("approved")} value={dashboard.approved} />
          <Stat label={t("drafts")} value={dashboard.drafts} />
          <Stat label={t("needsReview")} value={dashboard.needsReview} />
          <Stat label={t("missing")} value={dashboard.missingApproved} />
          <Stat label={t("rejected")} value={dashboard.rejected} />
          <Stat label={t("failed")} value={dashboard.failed} />
          <Stat label={t("duplicates")} value={dashboard.duplicates} />
          <Stat
            label={t("avgScore")}
            value={dashboard.averageSeoScore == null ? "—" : `${dashboard.averageSeoScore}/100`}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("search")}</span>
          <input
            className="w-full min-w-[220px] rounded-lg border border-[var(--border)] px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("filter")}</span>
          <select
            className="rounded-lg border border-[var(--border)] px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number])}
          >
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {t(`filters.${f}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          onClick={previewExport}
        >
          {t("exportPreview")}
        </button>
      </div>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="text-sm font-semibold">{t("exportTitle")}</h2>
        <p className="text-xs text-[var(--muted)]">{t("exportHint")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block">{t("packageKind")}</span>
            <select
              className="rounded-lg border border-[var(--border)] px-3 py-2"
              value={packageKind}
              onChange={(e) => setPackageKind(e.target.value as typeof packageKind)}
            >
              {(["zip", "csv", "json", "generic", "wordpress", "shopify", "webflow"] as const).map(
                (k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
            />
            {t("includeImages")}
          </label>
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={busy}
            onClick={startExport}
          >
            {t("startExport")}
          </button>
          {exportStatus === "completed" && exportJobId ? (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={downloadExport}
            >
              {t("downloadExport")}
            </button>
          ) : null}
        </div>
        {exportStatus ? (
          <p className="text-xs text-[var(--muted)]" aria-live="polite">
            {t("exportStatus")}: {exportStatus}
          </p>
        ) : null}
      </section>

      {exportCount != null ? (
        <p className="text-sm text-[var(--muted)]">
          {t("exportPreviewResult", {count: exportCount})}
        </p>
      ) : null}

      {selected.size > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-white p-3">
          <span className="text-sm">{t("selected", {count: selected.size})}</span>
          <button type="button" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50" disabled={busy} onClick={() => bulk("approve")}>{t("bulkApprove")}</button>
          <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => bulk("reject")}>{t("bulkReject")}</button>
          <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => bulk("mark_reviewed")}>{t("bulkMarkReviewed")}</button>
          <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => bulk("regenerate")}>{t("bulkRegenerate")}</button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--border)] text-left text-[var(--muted)]">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  aria-label={t("selectAll")}
                  checked={
                    selectable.length > 0 &&
                    selectable.every((r) => r.generation && selected.has(r.generation.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(
                        new Set(selectable.map((r) => r.generation!.id)),
                      );
                    } else setSelected(new Set());
                  }}
                />
              </th>
              <th className="p-3">{t("colFile")}</th>
              <th className="p-3">{t("colStatus")}</th>
              <th className="p-3">{t("colScore")}</th>
              <th className="p-3">{t("colFlags")}</th>
              <th className="p-3">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const genId = row.generation?.id;
              return (
                <tr key={row.imageId} className="border-b border-[var(--border)]">
                  <td className="p-3">
                    {genId && ["draft", "reviewed", "failed"].includes(row.generation!.status) ? (
                      <input
                        type="checkbox"
                        checked={selected.has(genId)}
                        onChange={() => toggle(genId)}
                      />
                    ) : null}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/projects/${projectId}/images?image=${row.imageId}`}
                      className="font-medium hover:underline"
                    >
                      {row.originalFilename}
                    </Link>
                    <p className={`mt-1 text-xs text-[var(--muted)] ${rtl ? "text-right" : ""}`} dir={rtl ? "rtl" : "ltr"}>
                      {row.generation?.title || row.approved?.title || "—"}
                    </p>
                  </td>
                  <td className="p-3">{row.generation?.status ?? (row.approved ? "approved" : "—")}</td>
                  <td className="p-3">
                    {row.quality ? `${row.quality.overall}/100` : "—"}
                  </td>
                  <td className="p-3 text-xs text-[var(--muted)]">
                    {[
                      row.needsReview ? t("flagNeedsReview") : null,
                      row.isMissingApproved ? t("flagMissing") : null,
                      row.isDuplicate ? t("flagDuplicate") : null,
                      row.quality && row.quality.overall < 60 ? t("flagLowQuality") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="p-3">
                    {genId ? (
                      <button
                        type="button"
                        className="text-[var(--accent)] hover:underline"
                        onClick={() => openCompare(genId)}
                      >
                        {t("compare")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--muted)]">
                  {t("empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {compareId ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t("compareTitle")}</h2>
            <button type="button" className="text-sm text-[var(--muted)]" onClick={() => setCompareId(null)}>
              {t("closeCompare")}
            </button>
          </div>
          <p className="mb-2 text-xs text-[var(--muted)]">
            {t("compareHint")} · {new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date())}
          </p>
          <MetadataDiffView
            diffs={diffs}
            rtl={rtl}
            labels={{
              altText: tm("altText"),
              title: tm("titleField"),
              caption: tm("caption"),
              description: tm("description"),
              filenameSuggestion: tm("filenameSuggestion"),
            }}
          />
          <div className="mt-4">
            <CommentThread
              projectId={projectId}
              subjectType="metadata_generation"
              subjectId={compareId}
              currentUserId={currentUserId}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({label, value}: {label: string; value: string | number}) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
