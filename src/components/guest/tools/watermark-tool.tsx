"use client";

import {useTranslations} from "next-intl";
import {
  GUEST_WATERMARK_POSITIONS,
  defaultGuestWatermarkOptions,
  type GuestWatermarkOptions,
} from "@/lib/guest/watermark-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";

function WatermarkOptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: GuestWatermarkOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestWatermarkOptions) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("guest.watermark");
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{t("optionsTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">{t("textLabel")}</span>
        <input
          type="text"
          maxLength={48}
          disabled={disabled}
          value={options.text}
          onChange={(e) => onChange({...options, text: e.target.value})}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("positionLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {GUEST_WATERMARK_POSITIONS.map((position) => (
            <button
              key={position}
              type="button"
              disabled={disabled}
              aria-pressed={options.position === position}
              onClick={() => onChange({...options, position})}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                options.position === position
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
              }`}
            >
              {t(`position.${position}`)}
            </button>
          ))}
        </div>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">
          {t("opacityLabel")}: {Math.round(options.opacity * 100)}%
        </span>
        <input
          type="range"
          min={15}
          max={85}
          step={1}
          disabled={disabled}
          value={Math.round(options.opacity * 100)}
          onChange={(e) => onChange({...options, opacity: Number(e.target.value) / 100})}
          className="w-full"
        />
      </label>
    </section>
  );
}

export const watermarkToolConfig: GuestToolConfig<GuestWatermarkOptions> = {
  toolCode: "watermark-image",
  operation: "watermark.same_format",
  titleKey: "watermark",
  messageNamespace: "watermark",
  processingPhase: "processing",
  downloadFilenamePrefix: "watermarked",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestWatermarkOptions(),
  OptionsPanel: WatermarkOptionsPanel,
  buildJobOptions: (options) => ({...options}),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    return {
      afterMeta: {width, height, bytes: outputBytes, format: String(summary?.mimeType ?? "")},
      rows: [
        {label: tTool("result.position"), value: String(summary?.position ?? "—")},
        {
          label: tTool("result.opacity"),
          value: `${Math.round(Number(summary?.opacity ?? 0) * 100)}%`,
        },
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.size"), value: formatBytes(outputBytes)},
      ],
    };
  },
};
