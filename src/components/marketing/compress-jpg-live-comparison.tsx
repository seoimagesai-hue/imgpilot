"use client";

import {useEffect, useState} from "react";
import Image from "next/image";
import {
  GUEST_TOOL_CLEAR_RESULT_EVENT,
  GUEST_TOOL_RESULT_EVENT,
  type GuestToolResultDetail,
} from "@/components/marketing/guest-tool-events";
import type {CompressJpgCopy} from "@/lib/marketing/compress-jpg-landing-content";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function CompressJpgLiveComparison({
  copy,
  placeholderSrc,
  placeholderAlt,
}: {
  copy: CompressJpgCopy["comparison"];
  placeholderSrc: string;
  placeholderAlt: string;
}) {
  const [result, setResult] = useState<GuestToolResultDetail | null>(null);

  useEffect(() => {
    function onResult(event: Event) {
      const detail = (event as CustomEvent<GuestToolResultDetail>).detail;
      if (!detail || detail.tool !== "compress-jpg") return;
      setResult(detail);
    }
    function onClear(event: Event) {
      const detail = (event as CustomEvent<{tool?: string}>).detail;
      if (detail?.tool && detail.tool !== "compress-jpg") return;
      setResult(null);
    }
    window.addEventListener(GUEST_TOOL_RESULT_EVENT, onResult);
    window.addEventListener(GUEST_TOOL_CLEAR_RESULT_EVENT, onClear);
    return () => {
      window.removeEventListener(GUEST_TOOL_RESULT_EVENT, onResult);
      window.removeEventListener(GUEST_TOOL_CLEAR_RESULT_EVENT, onClear);
    };
  }, []);

  if (!result) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[var(--border)]">
          <Image
            src={placeholderSrc}
            alt={placeholderAlt}
            width={1600}
            height={1000}
            sizes="(min-width: 1200px) 1200px, 100vw"
            className="h-auto w-full bg-white object-cover"
          />
        </div>
        <p className="text-center text-sm text-[var(--muted-foreground)]">{copy.placeholderHint}</p>
      </div>
    );
  }

  const before = result.before;
  const after = result.after;
  const percent = result.savedPercent ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <article className="rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold">{copy.originalLabel}</h3>
          {before.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL from guest workspace
            <img
              src={before.url}
              alt=""
              className="mt-4 aspect-[4/3] w-full rounded-xl object-contain bg-[var(--muted)]/20"
            />
          ) : null}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.dimensionsLabel}</dt>
              <dd className="font-medium tabular-nums">
                {before.width && before.height ? `${before.width} × ${before.height}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.formatLabel}</dt>
              <dd className="font-medium">{(before.format ?? "JPG").toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.sizeLabel}</dt>
              <dd className="font-medium tabular-nums">
                {before.bytes != null ? formatBytes(before.bytes) : "—"}
              </dd>
            </div>
          </dl>
        </article>

        <div className="flex items-center justify-center">
          <p className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-center text-sm font-semibold text-[var(--accent)]">
            {copy.reducedBy.replace("{percent}", String(percent))}
          </p>
        </div>

        <article className="rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold">{copy.compressedLabel}</h3>
          {after.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed/object URL from guest workspace
            <img
              src={after.url}
              alt=""
              className="mt-4 aspect-[4/3] w-full rounded-xl object-contain bg-[var(--muted)]/20"
            />
          ) : null}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.dimensionsLabel}</dt>
              <dd className="font-medium tabular-nums">
                {after.width && after.height ? `${after.width} × ${after.height}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.formatLabel}</dt>
              <dd className="font-medium">{(after.format ?? "JPG").toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{copy.sizeLabel}</dt>
              <dd className="font-medium tabular-nums">
                {after.bytes != null ? formatBytes(after.bytes) : "—"}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </div>
  );
}
