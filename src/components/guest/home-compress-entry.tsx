"use client";

import {useEffect, useRef, useState, type ReactNode} from "react";
import {setPendingGuestFile} from "@/components/guest/guest-file-handoff";
import {ToolLandingWorkspace} from "@/components/marketing/tool-landing-workspace";

type FormatTab = "jpeg" | "png" | "gif" | "exif";

type Props = {
  heading: string;
  support: string;
  chooseLabel: string;
  pasteHint: string;
  formatLimitLine: string;
  privacyLine: string;
  defaultActionLabel: string;
  maxMb: number;
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
    return mime === "image/gif" || mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
  }
  return mime.startsWith("image/");
}

function toolIdForTab(tab: FormatTab): "compress" | "metadata" {
  return tab === "exif" ? "metadata" : "compress";
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

function IconCompress() {
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
      <path d="M12 8v8M8.8 12.8 12 16l3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function tabFromFile(file: File): FormatTab {
  if (file.type.includes("png")) return "png";
  if (file.type.includes("gif")) return "gif";
  return "jpeg";
}

export function HomeCompressEntry({
  heading,
  support,
  chooseLabel,
  pasteHint,
  formatLimitLine,
  privacyLine,
  defaultActionLabel,
  maxMb,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<FormatTab>("jpeg");
  const [mode, setMode] = useState<"picker" | "workspace">("picker");
  const [workspaceKey, setWorkspaceKey] = useState(0);

  function revokeThumb() {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
  }

  function stageFile(next: File | undefined) {
    if (!next || !next.type.startsWith("image/")) return;
    if (next.type.toLowerCase() === "image/gif") return;
    revokeThumb();
    const url = URL.createObjectURL(next);
    previewUrl.current = url;
    setFile(next);
    setThumbUrl(url);
    setActiveTab(tabFromFile(next));
  }

  function clearFile() {
    revokeThumb();
    setFile(null);
    setThumbUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearAll() {
    clearFile();
    setMode("picker");
  }

  function startCompress(next?: File | null) {
    const chosen = next ?? file;
    if (!chosen) {
      inputRef.current?.click();
      return;
    }
    setPendingGuestFile(chosen);
    setWorkspaceKey((key) => key + 1);
    setMode("workspace");
  }

  function returnToPicker() {
    setMode("picker");
  }

  function selectTab(id: FormatTab) {
    setActiveTab(id);
    setMode("picker");
    setFile((current) => {
      if (current && !fileMatchesTab(current, id)) {
        revokeThumb();
        setThumbUrl(null);
        if (inputRef.current) inputRef.current.value = "";
        return null;
      }
      return current;
    });
  }

  useEffect(() => {
    return () => revokeThumb();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke object URL on unmount only
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (mode !== "picker") return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const pasted = item.getAsFile();
          if (pasted) {
            event.preventDefault();
            stageFile(pasted);
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [mode]);

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

  const hasFile = Boolean(file && thumbUrl);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
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

        {mode === "workspace" ? (
          <div className="space-y-4 bg-white px-3 py-4 sm:px-5 sm:py-5">
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
            <ToolLandingWorkspace
              key={`${workspaceKey}-${activeTab}`}
              toolId={toolIdForTab(activeTab)}
              presentation={{
                landingChrome: "marketing",
                marketingCompressPresets: activeTab !== "exif",
                dropLabel: heading,
                supportLabel: support,
                browseLabel: chooseLabel,
                formatsHint: pasteHint,
                onIdleReset: returnToPicker,
              }}
            />
          </div>
        ) : (
          <div className="space-y-5 bg-white px-4 py-6 sm:px-8 sm:py-7">
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

            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden shrink-0 text-2xl font-light text-[#c5b4e0] sm:inline" aria-hidden>
                ‹
              </span>
              {hasFile && file && thumbUrl ? (
                <div className="relative flex min-h-[180px] w-full items-center sm:min-h-[210px]">
                  <div className="relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-md border border-slate-300 shadow-sm sm:h-[148px] sm:w-[148px]">
                    <div className="absolute inset-0" style={CHECKERBOARD} />
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                    <img src={thumbUrl} alt="" className="relative h-full w-full object-cover" />
                    <span
                      className="absolute left-1.5 top-1 max-w-[78%] truncate text-[10px] font-medium text-white"
                      style={{textShadow: "0 1px 2px rgba(0,0,0,0.85)"}}
                      dir="ltr"
                    >
                      {file.name}
                    </span>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[28px] font-black tracking-wide text-white sm:text-[32px]"
                      style={{textShadow: "0 2px 8px rgba(0,0,0,0.55)"}}
                    >
                      {fileFormatLabel(file)}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={(event) => {
                        event.stopPropagation();
                        clearFile();
                      }}
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-sm text-sm font-bold text-white"
                      style={{textShadow: "0 1px 2px rgba(0,0,0,0.85)"}}
                    >
                      ×
                    </button>
                  </div>
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
                    stageFile(event.dataTransfer.files?.[0]);
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
              <span className="hidden shrink-0 text-2xl font-light text-[#c5b4e0] sm:inline" aria-hidden>
                ›
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <ToolButton
                label="Compress"
                colorClass={hasFile ? "bg-[#3f3f3f] hover:bg-[#2d2d2d]" : "bg-[#9aa3ad] hover:bg-[#8b949e]"}
                onClick={() => startCompress()}
                icon={<IconCompress />}
                badge={hasFile ? 1 : undefined}
              />
              <ToolButton
                label="Save All"
                colorClass="bg-[#8fce8f] hover:bg-[#7dc07d]"
                disabled
                icon={<IconSave />}
              />
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptForTab(activeTab)}
        className="sr-only"
        aria-label={chooseLabel}
        onChange={(event) => {
          stageFile(event.target.files?.[0]);
          setMode("picker");
          event.target.value = "";
        }}
      />

      {defaultActionLabel ? (
        <p className="text-center text-sm font-medium text-[var(--accent)]">{defaultActionLabel}</p>
      ) : null}
      <p className="text-center text-sm text-[var(--body)]" dir="ltr">
        {formatLimitLine}
      </p>
      <p className="text-center text-sm text-[var(--muted-foreground)]">{privacyLine}</p>
      <p className="sr-only">
        {support}. {pasteHint}. Max {maxMb} MB.
      </p>
    </div>
  );
}
