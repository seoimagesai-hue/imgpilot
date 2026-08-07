"use client";

import {useTranslations} from "next-intl";
import {defaultGuestMemeOptions, type GuestMemeOptions} from "@/lib/guest/meme-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";

function MemeOptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: GuestMemeOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestMemeOptions) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("guest.meme");
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{t("optionsTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("optionsHint")}</p>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">{t("topLabel")}</span>
        <input
          type="text"
          maxLength={80}
          disabled={disabled}
          value={options.topText}
          onChange={(e) => onChange({...options, topText: e.target.value})}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 uppercase"
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">{t("bottomLabel")}</span>
        <input
          type="text"
          maxLength={80}
          disabled={disabled}
          value={options.bottomText}
          onChange={(e) => onChange({...options, bottomText: e.target.value})}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 uppercase"
        />
      </label>
    </section>
  );
}

export const memeToolConfig: GuestToolConfig<GuestMemeOptions> = {
  toolCode: "meme-generator",
  operation: "meme.caption",
  titleKey: "meme",
  messageNamespace: "meme",
  processingPhase: "processing",
  downloadFilenamePrefix: "meme",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestMemeOptions(),
  OptionsPanel: MemeOptionsPanel,
  buildJobOptions: (options) => ({...options}),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    return {
      afterMeta: {width, height, bytes: outputBytes, format: String(summary?.mimeType ?? "")},
      rows: [
        {label: tTool("result.dimensions"), value: `${width}×${height}`},
        {label: tTool("result.size"), value: formatBytes(outputBytes)},
      ],
    };
  },
};
