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
};

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
}: Props) {
  const t = useTranslations("guest.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

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
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition motion-safe:duration-200 ${
          large ? "min-h-64 py-12 sm:min-h-72" : "min-h-48 py-10"
        } ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-[var(--muted)]/30"
        } ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"}`}
      >
        <p
          className={`font-semibold text-[var(--foreground)] ${large ? "text-lg sm:text-xl" : "text-base"}`}
        >
          {dropLabel ?? t("drop")}
        </p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{supportLabel ?? t("or")}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)] bg-[var(--accent)] font-semibold text-white disabled:opacity-50 ${
            large ? "w-full px-8 py-3 text-base sm:w-auto" : "px-5 py-2 text-sm"
          }`}
          style={{backgroundImage: "var(--gradient-brand)"}}
        >
          {browseLabel ?? t("browseButton")}
        </button>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">{pasteLabel ?? t("pasteHint")}</p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </div>
      {showHints ? (
        <ul className="space-y-1 text-center text-sm text-[var(--muted-foreground)]">
          <li>{t("formats")}</li>
          <li>{t("maxSize", {maxMb})}</li>
          <li>{t("privacy")}</li>
        </ul>
      ) : null}
    </div>
  );
}
