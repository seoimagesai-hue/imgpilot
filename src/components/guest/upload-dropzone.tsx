"use client";

import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";

type Props = {
  disabled?: boolean;
  onFileSelected?: (file: File) => void;
  accept?: string;
  large?: boolean;
  /** Show formats / size / privacy under the zone. */
  showHints?: boolean;
  maxMb?: number;
  dropLabel?: string;
  supportLabel?: string;
  browseLabel?: string;
  pasteLabel?: string;
  /** Marketing landings — cloud upload card matching Compress mockup. */
  variant?: "default" | "marketing";
};

function CloudIcon() {
  return (
    <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[var(--accent)]" aria-hidden>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path
          d="M7.5 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.6-1.2A4 4 0 1 1 18 18H7.5z"
          strokeLinejoin="round"
        />
        <path d="M12 15V9M9.5 11.5 12 9l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function UploadDropzone({
  disabled,
  onFileSelected,
  accept = "image/jpeg,image/png,image/webp",
  large = false,
  showHints = false,
  maxMb = 10,
  dropLabel,
  supportLabel,
  browseLabel,
  pasteLabel,
  variant = "default",
}: Props) {
  const t = useTranslations("guest.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const marketing = variant === "marketing";

  function pick(file: File | undefined) {
    if (file) onFileSelected?.(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    if (disabled) return;
    function onPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            pick(file);
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pick stable enough for paste window
  }, [disabled, onFileSelected]);

  return (
    <div className="space-y-3">
      <div
        ref={rootRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t("dropAria")}
        aria-disabled={disabled || undefined}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center text-center transition motion-safe:duration-200 ${
          marketing
            ? `min-h-[300px] rounded-[20px] border-2 border-dashed px-6 py-12 sm:min-h-[340px] sm:px-10 ${
                dragging
                  ? "border-[var(--accent)] bg-blue-50/80"
                  : "border-slate-300/90 bg-[#f4f7fb]"
              }`
            : `rounded-2xl border border-dashed px-6 ${
                large ? "min-h-56 py-10 sm:min-h-64 sm:py-12" : "min-h-48 py-10"
              } ${
                dragging
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--muted)]/30"
              }`
        } ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"}`}
      >
        {marketing ? <CloudIcon /> : null}
        <p
          className={`font-semibold text-slate-900 ${
            marketing ? "text-lg sm:text-xl" : large ? "text-lg sm:text-xl" : "text-base"
          }`}
        >
          {dropLabel ?? (marketing ? "Drop an image here or click to upload" : t("drop"))}
        </p>
        {marketing ? (
          supportLabel && supportLabel.trim() ? (
            <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-slate-500">{supportLabel}</p>
          ) : null
        ) : (
          <p className="mt-2 max-w-sm text-sm text-slate-500">{supportLabel ?? t("or")}</p>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-xl font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.85)] disabled:opacity-50 ${
            marketing
              ? "w-full max-w-[240px] px-8 py-3.5 text-[0.95rem]"
              : large
                ? "w-full px-8 py-3 text-base sm:w-auto"
                : "px-5 py-2 text-sm"
          }`}
          style={{backgroundImage: "var(--gradient-brand)"}}
        >
          {browseLabel ?? (marketing ? "Choose an Image" : t("browseButton"))}
        </button>
        {marketing ? (
          <p className="mt-5 text-xs leading-relaxed text-slate-500" dir="ltr">
            {pasteLabel ?? "You can also paste an image with Ctrl + V"}
          </p>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">{pasteLabel ?? t("pasteHint")}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </div>
      {!marketing && showHints ? (
        <ul className="space-y-1 text-center text-sm text-[var(--muted-foreground)]">
          <li>{t("formats")}</li>
          <li>{t("maxSize", {maxMb})}</li>
          <li>{t("privacy")}</li>
        </ul>
      ) : null}
    </div>
  );
}
