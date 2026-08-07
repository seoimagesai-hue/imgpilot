"use client";

import {useTranslations} from "next-intl";
import {
  GUEST_ROTATE_ANGLES,
  defaultGuestRotateOptions,
  type GuestRotateOptions,
} from "@/lib/guest/rotate-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";

function RotateOptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: GuestRotateOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestRotateOptions) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("guest.rotate");
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{t("optionsTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("angleLabel")}>
        {GUEST_ROTATE_ANGLES.map((angle) => (
          <button
            key={angle}
            type="button"
            disabled={disabled}
            aria-pressed={options.angle === angle}
            onClick={() => onChange({...options, angle})}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              options.angle === angle
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
            }`}
          >
            {angle}°
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.flipHorizontal}
            disabled={disabled}
            onChange={(e) => onChange({...options, flipHorizontal: e.target.checked})}
          />
          {t("flipHorizontal")}
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.flipVertical}
            disabled={disabled}
            onChange={(e) => onChange({...options, flipVertical: e.target.checked})}
          />
          {t("flipVertical")}
        </label>
      </div>
    </section>
  );
}

export const rotateToolConfig: GuestToolConfig<GuestRotateOptions> = {
  toolCode: "rotate-image",
  operation: "rotate.same_format",
  titleKey: "rotate",
  messageNamespace: "rotate",
  processingPhase: "processing",
  downloadFilenamePrefix: "rotated",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestRotateOptions(),
  OptionsPanel: RotateOptionsPanel,
  buildJobOptions: (options) => ({...options}),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    return {
      afterMeta: {width, height, bytes: outputBytes, format: String(summary?.mimeType ?? "")},
      rows: [
        {label: tTool("result.angle"), value: `${Number(summary?.angle ?? 0)}°`},
        {
          label: tTool("result.flip"),
          value: [
            summary?.flipHorizontal ? tTool("flipHorizontal") : null,
            summary?.flipVertical ? tTool("flipVertical") : null,
          ]
            .filter(Boolean)
            .join(", ") || tTool("result.noFlip"),
        },
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.size"), value: formatBytes(outputBytes)},
      ],
    };
  },
};
