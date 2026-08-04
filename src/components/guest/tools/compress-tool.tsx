"use client";

import {useTranslations} from "next-intl";
import {
  GUEST_COMPRESS_PRESET_QUALITY,
  type GuestCompressPreset,
  guestCompressPresetForQuality,
} from "@/lib/guest/compress-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";

export type CompressToolOptions = {
  quality: number;
  preset: GuestCompressPreset | "custom";
};

const PRESET_ORDER: GuestCompressPreset[] = ["high", "balanced", "low"];

function strengthFromQuality(quality: number): number {
  return Math.min(5, Math.max(1, Math.round(quality / 20)));
}

function qualityFromStrength(strength: number): number {
  const s = Math.min(5, Math.max(1, Math.round(strength)));
  return s * 20;
}

function CompressOptionsPanel({
  options,
  onChange,
  disabled,
  presentation,
}: GuestToolOptionsPanelProps<CompressToolOptions>) {
  const t = useTranslations("guest.compress");
  const marketing = Boolean(presentation?.marketingCompressPresets);
  const activePreset = guestCompressPresetForQuality(options.quality);
  const strength = strengthFromQuality(options.quality);
  const order = marketing ? PRESET_ORDER : (["low", "balanced", "high"] as GuestCompressPreset[]);

  function presetLabel(preset: GuestCompressPreset) {
    if (!marketing) return t(`preset.${preset}`);
    if (preset === "high") return t("marketingPreset.high");
    if (preset === "balanced") return t("marketingPreset.balanced");
    return t("marketingPreset.low");
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
      aria-labelledby="compress-options-title"
    >
      <div>
        <h2 id="compress-options-title" className="text-sm font-semibold text-[var(--foreground)]">
          {t("optionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("presetsAria")}>
        {order.map((preset) => {
          const selected = activePreset === preset;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() =>
                onChange({quality: GUEST_COMPRESS_PRESET_QUALITY[preset], preset})
              }
              className={`rounded-lg px-3 py-2 text-sm font-medium transition motion-safe:duration-150 ${
                selected
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)]/20 text-[var(--foreground)] hover:bg-[var(--muted)]/35"
              } disabled:opacity-50`}
            >
              {presetLabel(preset)}
            </button>
          );
        })}
        {marketing ? (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={activePreset === "custom"}
            onClick={() => onChange({...options, preset: "custom"})}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition motion-safe:duration-150 ${
              activePreset === "custom"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--muted)]/20 text-[var(--foreground)] hover:bg-[var(--muted)]/35"
            } disabled:opacity-50`}
          >
            {t("marketingPreset.custom")}
          </button>
        ) : null}
      </div>

      <label className="block space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t(marketing ? "qualityLabel" : "strengthLabel")}</span>
          <span className="text-[var(--muted-foreground)]">
            {marketing
              ? t("qualityValue", {quality: options.quality})
              : t("strengthValue", {level: strength})}
          </span>
        </div>
        <input
          type="range"
          min={marketing ? 1 : 1}
          max={marketing ? 100 : 5}
          step={1}
          value={marketing ? options.quality : strength}
          disabled={disabled}
          aria-valuetext={
            marketing
              ? t("qualityValue", {quality: options.quality})
              : t("strengthValue", {level: strength})
          }
          onChange={(event) => {
            const raw = Number(event.target.value);
            const nextQ = marketing ? raw : qualityFromStrength(raw);
            onChange({quality: nextQ, preset: guestCompressPresetForQuality(nextQ)});
          }}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>{t("qualityLow")}</span>
          <span>{t("qualityHigh")}</span>
        </div>
      </label>
    </section>
  );
}

export const compressToolConfig: GuestToolConfig<CompressToolOptions> = {
  toolCode: "compress-image",
  operation: "compress.same_format",
  titleKey: "compress",
  messageNamespace: "compress",
  processingPhase: "compressing",
  defaultOptions: {
    quality: GUEST_COMPRESS_PRESET_QUALITY.balanced,
    preset: "balanced",
  },
  OptionsPanel: CompressOptionsPanel,
  buildJobOptions: (options) => ({
    quality: options.quality,
    preset: options.preset,
  }),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const inputBytes = Number(summary?.inputBytes ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    const savedBytes = Number(summary?.savedBytes ?? Math.max(0, inputBytes - outputBytes));
    const savedPercent = Number(
      summary?.savedPercent ?? (inputBytes > 0 ? Math.round((savedBytes / inputBytes) * 100) : 0),
    );
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const format = String(summary?.mimeType ?? "image/jpeg").replace("image/", "");
    const durationMs =
      summary?.durationMs == null ? null : Number(summary.durationMs);

    return {
      savedLabel: tTool("saved", {
        saved: formatBytes(savedBytes),
        percent: savedPercent,
        before: formatBytes(inputBytes),
        after: formatBytes(outputBytes),
      }),
      afterMeta: {
        width,
        height,
        bytes: outputBytes,
        format,
      },
      rows: [
        {label: tTool("result.originalSize"), value: formatBytes(inputBytes)},
        {label: tTool("result.compressedSize"), value: formatBytes(outputBytes)},
        {
          label: tTool("result.reduction"),
          value: `${savedPercent}% (${formatBytes(savedBytes)})`,
        },
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.format"), value: format.toUpperCase()},
        {
          label: tTool("result.processingTime"),
          value:
            durationMs != null
              ? tTool("result.processingTimeValue", {seconds: (durationMs / 1000).toFixed(1)})
              : "—",
        },
      ],
    };
  },
};
