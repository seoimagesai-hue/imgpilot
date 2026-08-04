"use client";

import {useEffect, useMemo} from "react";
import {useLocale, useTranslations} from "next-intl";
import {
  defaultGuestConvertOptions,
  listGuestConvertTargets,
  sourceFormatFromMime,
  type GuestConvertOptions,
  type GuestConvertQualityPreset,
  type GuestConvertTargetFormat,
  type GuestJpegBackground,
} from "@/lib/guest/convert-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";

const PRESETS: GuestConvertQualityPreset[] = ["smaller", "balanced", "higher"];

function ConvertOptionsPanel({
  options,
  sourceMimeType,
  hasAlpha,
  avifEncodeSupported,
  onChange,
  disabled,
}: {
  options: GuestConvertOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestConvertOptions) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("guest.convert");
  const locale = useLocale();
  const sourceFormat = sourceFormatFromMime(sourceMimeType);
  const targets = useMemo(
    () => (sourceFormat ? listGuestConvertTargets(sourceFormat, avifEncodeSupported) : []),
    [sourceFormat, avifEncodeSupported],
  );

  useEffect(() => {
    if (!sourceFormat || targets.length === 0) return;
    if (!targets.includes(options.targetFormat)) {
      onChange({
        ...options,
        targetFormat: targets[0]!,
        jpegBackground:
          targets[0] === "jpeg" && hasAlpha ? options.jpegBackground ?? "white" : null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync targets only
  }, [sourceFormat, targets.join(","), hasAlpha]);

  const needsJpegBackground = options.targetFormat === "jpeg" && Boolean(hasAlpha);
  const showQualityPresets = options.targetFormat !== "png";

  function setTarget(targetFormat: GuestConvertTargetFormat) {
    onChange({
      ...options,
      targetFormat,
      jpegBackground:
        targetFormat === "jpeg" && hasAlpha ? options.jpegBackground ?? "white" : null,
    });
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
      aria-labelledby="convert-options-title"
    >
      <div>
        <h2 id="convert-options-title" className="text-sm font-semibold">
          {t("optionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>

      <p className="text-sm" aria-live="polite">
        <span className="font-medium">{t("sourceFormat")}: </span>
        <span className="uppercase" dir="ltr">
          {sourceFormat ?? t("sourceUnknown")}
        </span>
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium" id="convert-target-label">
          {t("targetFormat")}
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="convert-target-label"
        >
          {targets.map((target) => {
            const selected = options.targetFormat === target;
            return (
              <button
                key={target}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => setTarget(target)}
                className={`rounded-lg px-3 py-2 text-sm font-medium uppercase ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                } disabled:opacity-50`}
                dir="ltr"
              >
                {target}
              </button>
            );
          })}
        </div>
        {avifEncodeSupported ? (
          <p className="text-xs text-[var(--muted-foreground)]">{t("avifNote")}</p>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">{t("avifUnavailable")}</p>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">
          {t("sameFormatHint")}{" "}
          <a href={`/${locale}/compress-image`} className="underline">
            {t("openCompress")}
          </a>
        </p>
      </div>

      {showQualityPresets ? (
        <div className="space-y-2">
          <p className="text-sm font-medium" id="convert-quality-label">
            {t("qualityTitle")}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby="convert-quality-label"
          >
            {PRESETS.map((preset) => {
              const selected = options.qualityPreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onChange({...options, qualityPreset: preset})}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                  } disabled:opacity-50`}
                >
                  {t(`preset.${preset}`)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">{t("pngLosslessNote")}</p>
      )}

      {needsJpegBackground ? (
        <div
          className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"
          role="alert"
        >
          <p className="text-sm font-medium">{t("alphaWarningTitle")}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{t("alphaWarningBody")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("backgroundTitle")}>
            {(["white", "black"] as GuestJpegBackground[]).map((bg) => {
              const selected = options.jpegBackground === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onChange({...options, jpegBackground: bg})}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    selected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                  } disabled:opacity-50`}
                >
                  {t(`background.${bg}`)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-[var(--muted-foreground)]">{t("metadataNotice")}</p>
    </section>
  );
}

export const convertToolConfig: GuestToolConfig<GuestConvertOptions> = {
  toolCode: "convert-image",
  operation: "convert.format",
  titleKey: "convert",
  messageNamespace: "convert",
  processingPhase: "converting",
  downloadFilenamePrefix: "converted",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestConvertOptions(null, false),
  OptionsPanel: ConvertOptionsPanel,
  buildJobOptions: (options) => ({
    targetFormat: options.targetFormat,
    qualityPreset: options.qualityPreset,
    jpegBackground: options.jpegBackground,
  }),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const inputBytes = Number(summary?.inputBytes ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const sourceFormat = String(summary?.sourceFormat ?? "—");
    const targetFormat = String(summary?.targetFormat ?? "—");
    const qualityPreset = String(summary?.qualityPreset ?? "balanced");
    const transparency = String(summary?.transparency ?? "none");
    const durationMs = summary?.durationMs == null ? null : Number(summary.durationMs);
    const delta = outputBytes - inputBytes;
    const sizeNote =
      delta === 0
        ? tTool("sizeUnchanged")
        : delta < 0
          ? tTool("sizeSmaller", {saved: formatBytes(-delta)})
          : tTool("sizeLarger", {extra: formatBytes(delta)});

    const transparencyLabel =
      transparency === "preserved"
        ? tTool("transparencyPreserved")
        : transparency === "flattened"
          ? tTool("transparencyFlattened")
          : tTool("transparencyNone");

    return {
      savedLabel: tTool("changedSummary", {
        before: sourceFormat.toUpperCase(),
        after: targetFormat.toUpperCase(),
        sizeNote,
      }),
      afterMeta: {
        width,
        height,
        bytes: outputBytes,
        format: targetFormat,
      },
      rows: [
        {label: tTool("result.originalFormat"), value: sourceFormat.toUpperCase()},
        {label: tTool("result.convertedFormat"), value: targetFormat.toUpperCase()},
        {label: tTool("result.originalSize"), value: formatBytes(inputBytes)},
        {label: tTool("result.convertedSize"), value: formatBytes(outputBytes)},
        {label: tTool("result.sizeDifference"), value: sizeNote},
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.transparency"), value: transparencyLabel},
        {
          label: tTool("result.qualityPreset"),
          value: tTool(`preset.${qualityPreset}` as "preset.balanced"),
        },
        {
          label: tTool("result.processingTime"),
          value:
            durationMs != null
              ? tTool("result.processingTimeValue", {seconds: (durationMs / 1000).toFixed(1)})
              : "—",
        },
        {label: tTool("result.metadata"), value: tTool("metadataNotice")},
      ],
    };
  },
};
