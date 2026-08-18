"use client";

import {useEffect, useRef, useState, type ReactNode} from "react";
import {useLocale} from "next-intl";
import {
  authorizeGuestUpload,
  confirmGuestUpload,
  ensureGuestSession,
  putToPresignedUrl,
} from "@/components/guest/guest-api-client";
import {setPendingGuestFile} from "@/components/guest/guest-file-handoff";
import type {GuestToolPresentation} from "@/components/guest/tool-config";
import {
  ToolLandingWorkspace,
  type LandingToolId,
} from "@/components/marketing/tool-landing-workspace";
import type {GuestBulkPublicPolicy, GuestBulkToolCode} from "@/lib/guest/bulk-policy";
import type {SafeGuestErrorCode} from "@/server/guest/errors";

type FormatTab = "jpeg" | "png" | "gif" | "exif";

type StagedItem = {
  key: string;
  file: File;
  url: string;
  itemId?: string;
  childJobId?: string;
  status?: "ready" | "busy" | "done" | "failed";
  resultSummary?: Record<string, unknown> | null;
};

type PublicBulkJob = {
  bulkJobId: string;
  completedItems: number;
  items: {
    itemId: string;
    childJobId: string | null;
    status: string;
    errorCode: string | null;
    resultSummary?: Record<string, unknown> | null;
  }[];
};

export type HomeStyleToolEntryProps = {
  heading: string;
  support: string;
  chooseLabel: string;
  pasteHint: string;
  formatLimitLine?: string;
  privacyLine?: string;
  defaultActionLabel?: string;
  maxMb: number;
  /** Homepage JPEG/PNG/GIF/EXIF tabs. Off on other tool pages. */
  showFormatTabs?: boolean;
  toolId: LandingToolId;
  actionLabel: string;
  bulkTool?: GuestBulkToolCode | null;
  bulkOptions?: Record<string, unknown>;
  accept?: string;
  matchesFile?: (file: File) => boolean;
  workspacePresentation?: GuestToolPresentation;
  renderSingleWorkspace?: (ctx: {workspaceKey: number; onIdleReset: () => void}) => ReactNode;
  showFooter?: boolean;
};

function acceptForTab(tab: FormatTab): string {
  if (tab === "jpeg") return "image/jpeg";
  if (tab === "png") return "image/png";
  if (tab === "gif") return "image/jpeg,image/png,image/webp";
  return "image/jpeg,image/png,image/webp";
}

function fileMatchesTab(file: File, tab: FormatTab): boolean {
  const mime = file.type.toLowerCase();
  if (tab === "jpeg") return mime === "image/jpeg" || mime === "image/jpg";
  if (tab === "png") return mime === "image/png";
  if (tab === "gif") {
    return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
  }
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

function defaultMatchesFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  return mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png" || mime === "image/webp";
}

function toolIdForTab(tab: FormatTab): LandingToolId {
  return tab === "exif" ? "metadata" : "compress";
}

async function parseJson<T>(
  res: Response,
): Promise<({ok: true} & T) | {ok: false; error: SafeGuestErrorCode}> {
  const data = (await res.json().catch(() => null)) as
    | (({ok: true} & T) | {ok: false; error: SafeGuestErrorCode})
    | null;
  if (!data || typeof data !== "object" || !("ok" in data)) {
    return {ok: false, error: "INTERNAL_ERROR"};
  }
  return data;
}

const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0",
};

function IconSelect() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 16V8M8.8 11.2 12 8l3.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconAction() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4 12 7.5 15 4M9 20l3-3.5 3 3.5M4 9l3.5 3L4 15M20 9l-3.5 3 3.5 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8.8 12.8 12 16l3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ToolButton({
  label,
  colorClass,
  disabled,
  onClick,
  icon,
  badge,
}: {
  label: string;
  colorClass: string;
  disabled?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center gap-2.5 rounded-md px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 ${colorClass}`}
    >
      <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/90">
        {icon}
      </span>
      {label}
      {badge ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2b2b2b] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function fileFormatLabel(file: File): string {
  if (file.type.includes("png")) return "PNG";
  if (file.type.includes("webp")) return "WEBP";
  if (file.type.includes("gif")) return "GIF";
  return "JPG";
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function bulkItemDetails(summary: Record<string, unknown> | null | undefined): {
  original: string;
  result: string;
  saved: string | null;
  dimensions: string | null;
  format: string | null;
} | null {
  if (!summary) return null;
  const inputBytes = Number(summary.inputBytes ?? 0);
  const outputBytes = Number(summary.outputBytes ?? 0);
  if (!inputBytes && !outputBytes) return null;
  const savedBytes = Number(summary.savedBytes ?? Math.max(0, inputBytes - outputBytes));
  const savedPercent = Number(
    summary.savedPercent ?? (inputBytes > 0 ? Math.round((savedBytes / inputBytes) * 100) : 0),
  );
  const width = Number(summary.width ?? 0);
  const height = Number(summary.height ?? 0);
  const mime = String(summary.mimeType ?? summary.targetFormat ?? "");
  const format = mime.includes("/") ? mime.replace("image/", "") : mime;
  return {
    original: formatBytes(inputBytes),
    result: formatBytes(outputBytes),
    saved: inputBytes > 0 ? `${savedPercent}% (${formatBytes(savedBytes)})` : null,
    dimensions: width && height ? `${width}×${height}` : null,
    format: format ? format.toUpperCase() : null,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function HomeStyleToolEntry({
  heading,
  support,
  chooseLabel,
  pasteHint,
  formatLimitLine,
  privacyLine,
  defaultActionLabel = "",
  maxMb,
  showFormatTabs = false,
  toolId,
  actionLabel,
  bulkTool = null,
  bulkOptions,
  accept,
  matchesFile,
  workspacePresentation,
  renderSingleWorkspace,
  showFooter = true,
}: HomeStyleToolEntryProps) {
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<StagedItem[]>([]);
  const [items, setItems] = useState<StagedItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<FormatTab>("jpeg");
  const [mode, setMode] = useState<"picker" | "workspace">("picker");
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const [policy, setPolicy] = useState<GuestBulkPublicPolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulkJob, setBulkJob] = useState<PublicBulkJob | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const compressingRef = useRef(false);

  itemsRef.current = items;

  const allowFile = (file: File) => {
    if (showFormatTabs) return fileMatchesTab(file, activeTab);
    if (matchesFile) return matchesFile(file);
    return defaultMatchesFile(file);
  };

  const inputAccept = showFormatTabs
    ? acceptForTab(activeTab)
    : accept ?? "image/jpeg,image/png,image/webp";

  const activeToolId = showFormatTabs ? toolIdForTab(activeTab) : toolId;
  const activeBulkTool = showFormatTabs
    ? activeTab === "exif"
      ? null
      : "compress"
    : bulkTool;
  const activeBulkOptions =
    activeBulkTool === "compress"
      ? (bulkOptions ?? {quality: 80, preset: "custom"})
      : (bulkOptions ?? {});

  function revokeAll(list: StagedItem[]) {
    for (const item of list) URL.revokeObjectURL(item.url);
  }

  function addFiles(list: FileList | File[]) {
    const maxFiles = policy?.maxFiles ?? 5;
    const maxBytes = policy?.maxFileBytes ?? maxMb * 1024 * 1024;
    const incoming = Array.from(list);
    setItems((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (!allowFile(file)) continue;
        if (file.size <= 0 || file.size > maxBytes) continue;
        if (next.length >= maxFiles) break;
        next.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${next.length}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          url: URL.createObjectURL(file),
          status: "ready",
        });
      }
      return next;
    });
    setBulkJob(null);
    setStatus(null);
    setMode("picker");
  }

  function removeOne(key: string) {
    setItems((prev) => {
      const hit = prev.find((item) => item.key === key);
      if (hit) URL.revokeObjectURL(hit.url);
      return prev.filter((item) => item.key !== key);
    });
    setBulkJob(null);
    setStatus(null);
  }

  function clearAll() {
    revokeAll(itemsRef.current);
    setItems([]);
    setBulkJob(null);
    setBusy(false);
    setStatus(null);
    setMode("picker");
    if (inputRef.current) inputRef.current.value = "";
  }

  function returnToPicker() {
    setMode("picker");
  }

  function selectTab(id: FormatTab) {
    setActiveTab(id);
    setMode("picker");
    setBulkJob(null);
    setItems((prev) => {
      const kept: StagedItem[] = [];
      for (const item of prev) {
        if (fileMatchesTab(item.file, id)) kept.push(item);
        else URL.revokeObjectURL(item.url);
      }
      return kept;
    });
  }

  function scrollStrip(dir: -1 | 1) {
    stripRef.current?.scrollBy({left: dir * 156, behavior: "smooth"});
  }

  function startSingle(file: File) {
    setPendingGuestFile(file);
    setWorkspaceKey((key) => key + 1);
    setMode("workspace");
  }

  async function runBulk(ready: StagedItem[]) {
    if (!activeBulkTool) return;
    setBusy(true);
    setStatus(activeBulkTool === "compress" ? "Compressing…" : "Processing…");
    setBulkJob(null);

    const session = await ensureGuestSession({locale, toolCode: "bulk-image-tools"});
    if (!session.ok) {
      setStatus("Could not start a guest session.");
      setBusy(false);
      return;
    }

    let created: ({ok: true} & PublicBulkJob) | {ok: false; error: SafeGuestErrorCode} = {
      ok: false,
      error: "INTERNAL_ERROR",
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      const createRes = await fetch("/api/guest/bulk", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          toolCode: activeBulkTool,
          options: activeBulkOptions,
          files: ready.map((item) => ({
            originalFilename: item.file.name,
            mimeType: item.file.type || "application/octet-stream",
            sizeBytes: item.file.size,
          })),
        }),
      });
      created = await parseJson<PublicBulkJob>(createRes);
      if (created.ok) break;
      if (
        created.error === "GUEST_BULK_ACTIVE_EXISTS" ||
        created.error === "GUEST_ACTIVE_JOB_EXISTS"
      ) {
        await delay(400 * (attempt + 1));
        continue;
      }
      break;
    }
    if (!created.ok) {
      setStatus(created.error === "GUEST_LIMIT_REACHED" ? "Guest limit reached." : "Could not create the batch.");
      setBusy(false);
      return;
    }

    const bulkJobId = created.bulkJobId;
    const queue = ready.map((item, index) => ({item, jobItem: created.items[index]!})).filter((entry) => entry.jobItem);
    const maxConcurrency = Math.min(policy?.uploadConcurrency ?? 3, queue.length || 1);
    let cursor = 0;
    const workers = Array.from({length: Math.min(maxConcurrency, queue.length)}, async () => {
      while (cursor < queue.length) {
        const idx = cursor++;
        const entry = queue[idx]!;
        let uploaded = false;
        for (let attempt = 0; attempt < 3 && !uploaded; attempt++) {
          const authz = await authorizeGuestUpload({
            originalFilename: entry.item.file.name,
            mimeType: entry.item.file.type || "image/jpeg",
            sizeBytes: entry.item.file.size,
          });
          if (!authz.ok) {
            if (
              (authz.error === "GUEST_ACTIVE_JOB_EXISTS" || authz.error === "STORAGE_UNAVAILABLE") &&
              attempt < 2
            ) {
              await delay(300 * (attempt + 1));
              continue;
            }
            setItems((prev) =>
              prev.map((row) => (row.key === entry.item.key ? {...row, status: "failed"} : row)),
            );
            break;
          }
          try {
            await putToPresignedUrl(authz.uploadUrl, entry.item.file, authz.headers);
            const confirmed = await confirmGuestUpload(authz.uploadId);
            if (!confirmed.ok) {
              if (attempt < 2) {
                await delay(300 * (attempt + 1));
                continue;
              }
              setItems((prev) =>
                prev.map((row) => (row.key === entry.item.key ? {...row, status: "failed"} : row)),
              );
              break;
            }
            const attachRes = await fetch(`/api/guest/bulk/${bulkJobId}/attach`, {
              method: "POST",
              credentials: "include",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({itemId: entry.jobItem.itemId, uploadId: authz.uploadId}),
            });
            const attached = await parseJson<PublicBulkJob>(attachRes);
            if (!attached.ok) {
              if (attempt < 2) {
                await delay(300 * (attempt + 1));
                continue;
              }
              setItems((prev) =>
                prev.map((row) => (row.key === entry.item.key ? {...row, status: "failed"} : row)),
              );
              break;
            }
            uploaded = true;
            setItems((prev) =>
              prev.map((row) =>
                row.key === entry.item.key ? {...row, itemId: entry.jobItem.itemId, status: "busy"} : row,
              ),
            );
          } catch {
            if (attempt < 2) {
              await delay(300 * (attempt + 1));
              continue;
            }
            setItems((prev) =>
              prev.map((row) => (row.key === entry.item.key ? {...row, status: "failed"} : row)),
            );
          }
        }
      }
    });
    await Promise.all(workers);

    const processRes = await fetch(`/api/guest/bulk/${bulkJobId}/process`, {
      method: "POST",
      credentials: "include",
    });
    const processed = await parseJson<PublicBulkJob>(processRes);
    if (!processed.ok) {
      setStatus("Processing failed.");
      setBusy(false);
      return;
    }

    setBulkJob(processed);
    setItems((prev) =>
      prev.map((row) => {
        const jobItem = processed.items.find((item) => item.itemId === row.itemId);
        if (!jobItem) return row;
        return {
          ...row,
          childJobId: jobItem.childJobId ?? undefined,
          resultSummary: jobItem.resultSummary ?? null,
          status: jobItem.status === "completed" ? "done" : jobItem.status === "failed" ? "failed" : row.status,
        };
      }),
    );
    setBusy(false);
    setStatus(
      processed.completedItems > 0
        ? activeBulkTool === "compress"
          ? "Compressed. Use Save All to download."
          : "Done. Use Save All to download."
        : "No files were processed.",
    );
  }

  async function startAction() {
    if (!items.length) {
      inputRef.current?.click();
      return;
    }
    if (busy || compressingRef.current) return;
    const useBulk = Boolean(activeBulkTool) && items.length >= 2;
    if (!useBulk) {
      startSingle(items[0]!.file);
      return;
    }
    compressingRef.current = true;
    try {
      await runBulk(items);
    } finally {
      compressingRef.current = false;
    }
  }

  async function saveAll() {
    if (!bulkJob || bulkJob.completedItems <= 0) return;
    setStatus("Preparing download…");
    const res = await fetch(`/api/guest/bulk/${bulkJob.bulkJobId}/zip`, {
      method: "POST",
      credentials: "include",
    });
    const data = await parseJson<{url: string; filename: string}>(res);
    if (!data.ok) {
      setStatus("Download failed.");
      return;
    }
    const a = document.createElement("a");
    a.href = data.url;
    a.download = data.filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(null);
  }

  useEffect(() => {
    return () => revokeAll(itemsRef.current);
  }, []);

  useEffect(() => {
    void (async () => {
      await ensureGuestSession({locale, toolCode: "bulk-image-tools"});
      const res = await fetch("/api/guest/bulk", {credentials: "include"});
      const data = await parseJson<{policy: GuestBulkPublicPolicy}>(res);
      if (data.ok) setPolicy(data.policy);
    })();
  }, [locale]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (mode !== "picker") return;
      const files: File[] = [];
      const list = event.clipboardData?.items;
      if (!list) return;
      for (const item of list) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [mode, activeTab, policy, maxMb, showFormatTabs, accept]);

  const tabs: {id: FormatTab; label: string}[] = [
    {id: "jpeg", label: "JPEG"},
    {id: "png", label: "PNG"},
    {id: "gif", label: "GIF"},
    {id: "exif", label: "EXIF"},
  ];

  function tabClass(id: FormatTab) {
    return activeTab === id
      ? "relative -mb-px border-t-[3px] border-[#e67e22] bg-white px-4 py-2.5 text-sm font-bold text-[#e67e22] sm:px-5"
      : "mb-1 rounded-md bg-[#e4e4e4] px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-[#d8d8d8] sm:px-5";
  }

  const hasFiles = items.length > 0;
  const canSaveAll = Boolean(bulkJob && bulkJob.completedItems > 0 && !busy);

  const selectClearRow = (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToolButton
        label="Select Files"
        colorClass="bg-[#4a90d9] hover:bg-[#3d7fc4]"
        onClick={() => inputRef.current?.click()}
        icon={<IconSelect />}
      />
      <ToolButton
        label="Clear"
        colorClass="bg-[#c4b4e0] hover:bg-[#b5a3d4]"
        onClick={clearAll}
        icon={<IconClear />}
      />
    </div>
  );

  const singleWorkspace = renderSingleWorkspace ? (
    renderSingleWorkspace({workspaceKey, onIdleReset: returnToPicker})
  ) : (
    <ToolLandingWorkspace
      key={`${workspaceKey}-${activeToolId}`}
      toolId={activeToolId}
      presentation={{
        landingChrome: "marketing",
        marketingCompressPresets: activeToolId === "compress",
        showPopularSizes: activeToolId === "resize",
        dropLabel: heading,
        supportLabel: support,
        browseLabel: chooseLabel,
        formatsHint: pasteHint,
        onIdleReset: returnToPicker,
        ...workspacePresentation,
      }}
    />
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
        {showFormatTabs ? (
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 bg-white px-2 pt-2 sm:px-3" dir="ltr">
            <div className="flex min-w-0 items-end gap-1" role="tablist" aria-label="Image format">
              {tabs
                .filter((tab) => tab.id !== "exif")
                .map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={tabClass(tab.id)}
                    onClick={() => selectTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>
            <div className="flex items-end">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "exif"}
                className={tabClass("exif")}
                onClick={() => selectTab("exif")}
              >
                EXIF
              </button>
            </div>
          </div>
        ) : null}

        {mode === "workspace" ? (
          <div className="space-y-4 bg-white px-3 py-4 sm:px-5 sm:py-5">
            {selectClearRow}
            {singleWorkspace}
          </div>
        ) : (
          <div className="space-y-5 bg-white px-4 py-6 sm:px-8 sm:py-7">
            {selectClearRow}

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                className="hidden shrink-0 px-1 text-2xl font-light text-[#c5b4e0] sm:inline"
                aria-label="Previous images"
                onClick={() => scrollStrip(-1)}
              >
                ‹
              </button>
              {hasFiles ? (
                <div
                  ref={stripRef}
                  className="flex min-h-[180px] w-full items-start gap-3 overflow-x-auto sm:min-h-[210px]"
                >
                  {items.map((item) => {
                    const details = item.status === "done" ? bulkItemDetails(item.resultSummary) : null;
                    return (
                    <div key={item.key} className="w-[132px] shrink-0 sm:w-[148px]">
                    <div
                      className="relative h-[132px] w-full overflow-hidden rounded-md border border-slate-300 shadow-sm sm:h-[148px]"
                    >
                      <div className="absolute inset-0" style={CHECKERBOARD} />
                      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                      <img src={item.url} alt="" className="relative h-full w-full object-cover" />
                      <span
                        className="absolute left-1.5 top-1 max-w-[78%] truncate text-[10px] font-medium text-white"
                        style={{textShadow: "0 1px 2px rgba(0,0,0,0.85)"}}
                        dir="ltr"
                      >
                        {item.file.name}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[28px] font-black tracking-wide text-white sm:text-[32px]"
                        style={{textShadow: "0 2px 8px rgba(0,0,0,0.55)"}}
                      >
                        {fileFormatLabel(item.file)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.file.name}`}
                        disabled={busy}
                        onClick={() => removeOne(item.key)}
                        className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow"
                      >
                        ×
                      </button>
                    </div>
                    {details ? (
                      <dl className="mt-1.5 space-y-0.5 text-[10px] leading-snug text-slate-600" dir="ltr">
                        <div className="flex justify-between gap-1">
                          <dt>Original</dt>
                          <dd className="font-medium text-slate-800">{details.original}</dd>
                        </div>
                        <div className="flex justify-between gap-1">
                          <dt>Result</dt>
                          <dd className="font-medium text-slate-800">{details.result}</dd>
                        </div>
                        {details.saved ? (
                          <div className="flex justify-between gap-1">
                            <dt>Saved</dt>
                            <dd className="font-semibold text-emerald-700">{details.saved}</dd>
                          </div>
                        ) : null}
                        {details.dimensions ? (
                          <div className="flex justify-between gap-1">
                            <dt>Size</dt>
                            <dd className="font-medium text-slate-800">{details.dimensions}</dd>
                          </div>
                        ) : null}
                        {details.format ? (
                          <div className="flex justify-between gap-1">
                            <dt>Format</dt>
                            <dd className="font-medium text-slate-800">{details.format}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : item.status === "failed" ? (
                      <p className="mt-1.5 text-[10px] font-medium text-rose-600">Failed</p>
                    ) : item.status === "busy" ? (
                      <p className="mt-1.5 text-[10px] text-slate-500">Processing…</p>
                    ) : null}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={heading}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`flex min-h-[180px] w-full cursor-pointer items-center justify-center rounded-[4px] border-2 border-dashed px-4 py-8 text-center transition sm:min-h-[210px] ${
                    dragging ? "border-[#4a90d9] bg-[#eef6fd]" : "border-[#b7d4ea] bg-white"
                  }`}
                >
                  <p className="text-[22px] font-light tracking-wide text-[#7eb6e0] sm:text-[28px]">
                    Drop Your Files Here
                  </p>
                </div>
              )}
              <button
                type="button"
                className="hidden shrink-0 px-1 text-2xl font-light text-[#c5b4e0] sm:inline"
                aria-label="Next images"
                onClick={() => scrollStrip(1)}
              >
                ›
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <ToolButton
                label={actionLabel}
                colorClass={hasFiles ? "bg-[#3f3f3f] hover:bg-[#2d2d2d]" : "bg-[#9aa3ad] hover:bg-[#8b949e]"}
                disabled={busy}
                onClick={() => void startAction()}
                icon={<IconAction />}
                badge={hasFiles ? items.length : undefined}
              />
              <ToolButton
                label="Save All"
                colorClass="bg-[#8fce8f] hover:bg-[#7dc07d]"
                disabled={!canSaveAll}
                onClick={() => void saveAll()}
                icon={<IconSave />}
              />
            </div>
            {status ? (
              <p className="text-center text-xs text-slate-500" role="status">
                {status}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={inputAccept}
        multiple
        className="sr-only"
        aria-label={chooseLabel}
        onChange={(event) => {
          if (event.target.files?.length) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {showFooter ? (
        <>
          {defaultActionLabel ? (
            <p className="text-center text-sm font-medium text-[var(--accent)]">{defaultActionLabel}</p>
          ) : null}
          {formatLimitLine ? (
            <p className="text-center text-sm text-[var(--body)]" dir="ltr">
              {formatLimitLine}
            </p>
          ) : null}
          {privacyLine ? (
            <p className="text-center text-sm text-[var(--muted-foreground)]">{privacyLine}</p>
          ) : null}
          <p className="sr-only">
            {support}. {pasteHint}. Max {maxMb} MB.
          </p>
        </>
      ) : (
        <p className="sr-only">
          {support}. {pasteHint}. Max {maxMb} MB.
        </p>
      )}
    </div>
  );
}
