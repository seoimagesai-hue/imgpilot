"use client";

import {useLocale, useTranslations} from "next-intl";
import {
  defaultGuestResizeOptions,
  GUEST_RESIZE_PRESET_BOX,
  type GuestResizeMethod,
  type GuestResizeOptions,
  type GuestResizePreset,
} from "@/lib/guest/resize-policy";
import type {GuestToolConfig, GuestToolOptionsPanelProps} from "@/components/guest/tool-config";

const METHODS: {id: GuestResizeMethod; locked?: boolean}[] = [
  {id: "by_width"},
  {id: "by_height"},
  {id: "fit_inside"},
  {id: "exact_size", locked: true},
];

const PRESETS: GuestResizePreset[] = ["social", "website", "thumbnail", "custom"];

const POPULAR_SIZES = [
  {id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080},
  {id: "instagram-portrait", label: "Instagram Portrait", width: 1080, height: 1350},
  {id: "facebook-post", label: "Facebook Post", width: 1200, height: 630},
  {id: "website-hero", label: "Website Hero", width: 1920, height: 1080},
  {id: "blog-image", label: "Blog Image", width: 1200, height: 800},
  {id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720},
] as const;

function ResizeOptionsPanel({
  options,
  sourceWidth,
  sourceHeight,
  onChange,
  disabled,
  presentation,
}: GuestToolOptionsPanelProps<GuestResizeOptions>) {
  const t = useTranslations("guest.resize");
  const locale = useLocale();
  const showPopular = Boolean(presentation?.showPopularSizes);
  const popularSizes = presentation?.popularSizes?.length
    ? presentation.popularSizes
    : POPULAR_SIZES;

  function applyPreset(preset: GuestResizePreset) {
    if (preset === "custom") {
      onChange({...options, preset: "custom"});
      return;
    }
    const box = GUEST_RESIZE_PRESET_BOX[preset];
    onChange({
      ...options,
      preset,
      method: "fit_inside",
      width: box.width,
      height: box.height,
    });
  }

  function applyPopularSize(width: number, height: number) {
    onChange({
      ...options,
      preset: "custom",
      method: "fit_inside",
      width,
      height,
      maintainAspectRatio: true,
    });
  }

  const activePopularId =
    options.preset === "custom"
      ? popularSizes.find((s) => s.width === options.width && s.height === options.height)?.id
      : undefined;

  return (
    <section
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
      aria-labelledby="resize-options-title"
    >
      <div>
        <h2 id="resize-options-title" className="text-sm font-semibold">
          {t("optionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
        {sourceWidth && sourceHeight ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {t("sourceSize", {width: sourceWidth, height: sourceHeight})}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("methodTitle")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("methodTitle")}>
          {METHODS.map((m) => {
            const selected = options.method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled || m.locked}
                aria-pressed={selected}
                title={m.locked ? t("exactLocked") : undefined}
                onClick={() =>
                  onChange({
                    ...options,
                    method: m.id,
                    preset: "custom",
                  })
                }
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {t(`method.${m.id}`)}
              </button>
            );
          })}
        </div>
      </div>

      {showPopular ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("popularSizesTitle")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("popularSizesTitle")}>
            {popularSizes.map((size) => {
              const selected = activePopularId === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => applyPopularSize(size.width, size.height)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    selected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
                  } disabled:opacity-50`}
                >
                  <span className="block">{size.label}</span>
                  <span
                    className={`block text-xs ${selected ? "text-white/85" : "text-[var(--muted-foreground)]"}`}
                  >
                    {size.width} × {size.height}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              disabled={disabled}
              aria-pressed={options.preset === "custom" && !activePopularId}
              onClick={() => applyPreset("custom")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                options.preset === "custom" && !activePopularId
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)]/20 hover:bg-[var(--muted)]/35"
              } disabled:opacity-50`}
            >
              {t("preset.custom")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("presetTitle")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("presetTitle")}>
            {PRESETS.map((preset) => {
              const selected = options.preset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => applyPreset(preset)}
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
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("widthPx")}</span>
          <input
            type="number"
            min={1}
            max={8192}
            inputMode="numeric"
            disabled={disabled || options.method === "by_height"}
            value={options.width ?? ""}
            onChange={(e) =>
              onChange({
                ...options,
                preset: "custom",
                width: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("heightPx")}</span>
          <input
            type="number"
            min={1}
            max={8192}
            inputMode="numeric"
            disabled={disabled || options.method === "by_width"}
            value={options.height ?? ""}
            onChange={(e) =>
              onChange({
                ...options,
                preset: "custom",
                height: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.maintainAspectRatio}
            disabled={disabled}
            onChange={(e) =>
              onChange({...options, maintainAspectRatio: e.target.checked, preset: "custom"})
            }
          />
          {t("maintainAspect")}
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.preventUpscale}
            disabled={disabled}
            onChange={(e) =>
              onChange({...options, preventUpscale: e.target.checked, preset: "custom"})
            }
          />
          {t("preventUpscale")}
        </label>
      </div>

      {presentation?.showQualityNote ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
          {presentation.qualityNoteBefore ?? t("qualityNoteBefore")}{" "}
          <a
            href={`/${locale}${presentation.qualityNoteHref ?? "/compress-jpg"}`}
            className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
          >
            {presentation.qualityNoteLink ?? t("qualityNoteLink")}
          </a>{" "}
          {presentation.qualityNoteAfter ?? t("qualityNoteAfter")}
        </p>
      ) : null}
    </section>
  );
}

export const resizeToolConfig: GuestToolConfig<GuestResizeOptions> = {
  toolCode: "resize-image",
  operation: "resize.same_format",
  titleKey: "resize",
  messageNamespace: "resize",
  processingPhase: "resizing",
  defaultOptions: defaultGuestResizeOptions(),
  OptionsPanel: ResizeOptionsPanel,
  buildJobOptions: (options) => ({...options}),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const inputBytes = Number(summary?.inputBytes ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const sourceWidth = Number(summary?.sourceWidth ?? 0);
    const sourceHeight = Number(summary?.sourceHeight ?? 0);
    const format = String(summary?.mimeType ?? "image/jpeg").replace("image/", "");
    const durationMs =
      summary?.durationMs == null ? null : Number(summary.durationMs);

    return {
      savedLabel: tTool("changedSize", {
        before: `${sourceWidth}×${sourceHeight}`,
        after: `${width}×${height}`,
      }),
      afterMeta: {width, height, bytes: outputBytes, format},
      rows: [
        {label: tTool("result.originalSize"), value: formatBytes(inputBytes)},
        {label: tTool("result.outputSize"), value: formatBytes(outputBytes)},
        {
          label: tTool("result.originalDimensions"),
          value: `${sourceWidth}×${sourceHeight}`,
        },
        {label: tTool("result.outputDimensions"), value: `${width}×${height}`},
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
