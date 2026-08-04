"use client";

import {useTranslations} from "next-intl";

export type GuestProgressPhase =
  | "idle"
  | "uploading"
  | "validating"
  | "preparing_editor"
  | "reading_format"
  | "reading_gps"
  | "reading_metadata"
  | "generating_metadata"
  | "analyzing_image"
  | "compressing"
  | "resizing"
  | "cropping"
  | "converting"
  | "writing_gps"
  | "verifying_gps"
  | "verifying_output"
  | "processing"
  | "preparing_download"
  | "complete"
  | "failed";

type Props = {
  phase: GuestProgressPhase;
  detail?: string;
};

export function ProgressCard({phase, detail}: Props) {
  const t = useTranslations("guest.progress");
  if (phase === "idle") return null;

  const label =
    phase === "uploading"
      ? t("uploading")
      : phase === "validating"
        ? t("validating")
        : phase === "preparing_editor"
          ? t("preparingEditor")
          : phase === "reading_format"
            ? t("readingFormat")
            : phase === "reading_gps"
              ? t("readingGps")
              : phase === "reading_metadata"
                ? t("readingMetadata")
                : phase === "analyzing_image"
                  ? t("analyzingImage")
                  : phase === "generating_metadata"
                    ? t("generatingMetadata")
                    : phase === "compressing"
                ? t("compressing")
                : phase === "resizing"
                  ? t("resizing")
                  : phase === "cropping"
                    ? t("cropping")
                    : phase === "converting"
                      ? t("converting")
                      : phase === "writing_gps"
                        ? t("writingGps")
                        : phase === "verifying_gps"
                          ? t("verifyingGps")
                          : phase === "verifying_output"
                            ? t("verifyingOutput")
                            : phase === "processing"
                              ? t("processing")
                              : phase === "preparing_download"
                                ? t("preparingDownload")
                                : phase === "complete"
                                  ? t("complete")
                                  : t("failed");

  return (
    <section
      className="rounded-xl border border-[var(--border)] p-4"
      aria-live="polite"
      aria-busy={phase !== "complete" && phase !== "failed"}
    >
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {label}
        {detail ? ` — ${detail}` : null}
      </p>
    </section>
  );
}
