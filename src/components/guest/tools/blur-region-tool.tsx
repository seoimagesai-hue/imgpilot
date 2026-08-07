"use client";

import {useTranslations} from "next-intl";
import {
  defaultGuestBlurRegionOptions,
  type GuestBlurRegionOptions,
} from "@/lib/guest/blur-region-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";

function BlurOptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: GuestBlurRegionOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestBlurRegionOptions) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("guest.blur");
  const pct = {
    x: Math.round(options.region.x * 100),
    y: Math.round(options.region.y * 100),
    width: Math.round(options.region.width * 100),
    height: Math.round(options.region.height * 100),
  };

  function setRegion(key: keyof typeof pct, value: number) {
    const next = {...pct, [key]: Math.max(0, Math.min(100, value))};
    if (next.x + next.width > 100) next.width = 100 - next.x;
    if (next.y + next.height > 100) next.height = 100 - next.y;
    onChange({
      ...options,
      region: {
        x: next.x / 100,
        y: next.y / 100,
        width: Math.max(2, next.width) / 100,
        height: Math.max(2, next.height) / 100,
      },
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{t("optionsTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["x", t("regionX")],
            ["y", t("regionY")],
            ["width", t("regionWidth")],
            ["height", t("regionHeight")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block space-y-1 text-sm">
            <span className="font-medium">
              {label}: {pct[key]}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              disabled={disabled}
              value={pct[key]}
              onChange={(e) => setRegion(key, Number(e.target.value))}
              className="w-full"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("strengthLabel")}>
        {(["light", "medium", "strong"] as const).map((strength) => (
          <button
            key={strength}
            type="button"
            disabled={disabled}
            aria-pressed={options.strength === strength}
            onClick={() => onChange({...options, strength})}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              options.strength === strength
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
            }`}
          >
            {t(`strength.${strength}`)}
          </button>
        ))}
      </div>
    </section>
  );
}

export const blurRegionToolConfig: GuestToolConfig<GuestBlurRegionOptions> = {
  toolCode: "blur-region",
  operation: "blur.region",
  titleKey: "blur",
  messageNamespace: "blur",
  processingPhase: "processing",
  downloadFilenamePrefix: "blurred",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestBlurRegionOptions(),
  OptionsPanel: BlurOptionsPanel,
  buildJobOptions: (options) => ({...options}),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    return {
      afterMeta: {width, height, bytes: outputBytes, format: String(summary?.mimeType ?? "")},
      rows: [
        {label: tTool("result.strength"), value: String(summary?.strength ?? "—")},
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.size"), value: formatBytes(outputBytes)},
      ],
    };
  },
};
