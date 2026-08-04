"use client";

import type {GuestCropOptions} from "@/lib/guest/crop-policy";
import {defaultGuestCropOptions} from "@/lib/guest/crop-policy";
import type {GuestToolConfig} from "@/components/guest/tool-config";
import {CropEditor} from "@/components/guest/tools/crop-editor";

function CropOptionsPanel({
  options,
  imageUrl,
  onChange,
  disabled,
}: {
  options: GuestCropOptions;
  sourceWidth: number | null;
  sourceHeight: number | null;
  imageUrl: string | null;
  sourceMimeType: string | null;
  hasAlpha: boolean | null;
  avifEncodeSupported: boolean;
  onChange: (next: GuestCropOptions) => void;
  disabled?: boolean;
}) {
  return (
    <CropEditor
      imageUrl={imageUrl}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export const cropToolConfig: GuestToolConfig<GuestCropOptions> = {
  toolCode: "crop-image",
  operation: "crop.same_format",
  titleKey: "crop",
  messageNamespace: "crop",
  processingPhase: "cropping",
  downloadFilenamePrefix: "cropped",
  showOptionsWhenDone: true,
  allowReprocess: true,
  defaultOptions: defaultGuestCropOptions(),
  OptionsPanel: CropOptionsPanel,
  buildJobOptions: (options) => ({
    normalizedCrop: options.normalizedCrop,
    aspectRatio: options.aspectRatio,
    // Zoom is UI-only; keep allow-listed for round-trip display, ignored by geometry.
    zoom: options.zoom,
  }),
  mapResultSummary: (summary, {formatBytes, tTool}) => {
    const inputBytes = Number(summary?.inputBytes ?? 0);
    const outputBytes = Number(summary?.outputBytes ?? 0);
    const width = Number(summary?.width ?? 0);
    const height = Number(summary?.height ?? 0);
    const sourceWidth = Number(summary?.sourceWidth ?? 0);
    const sourceHeight = Number(summary?.sourceHeight ?? 0);
    const format = String(summary?.mimeType ?? "image/jpeg").replace("image/", "");
    const aspectRatio = String(summary?.aspectRatio ?? "free");
    const durationMs = summary?.durationMs == null ? null : Number(summary.durationMs);
    const sizeDelta = outputBytes - inputBytes;
    const sizeLabel =
      sizeDelta === 0
        ? tTool("sizeUnchanged")
        : sizeDelta < 0
          ? tTool("sizeSmaller", {saved: formatBytes(-sizeDelta)})
          : tTool("sizeLarger", {extra: formatBytes(sizeDelta)});

    return {
      savedLabel: tTool("changedSize", {
        before: `${sourceWidth}×${sourceHeight}`,
        after: `${width}×${height}`,
        sizeNote: sizeLabel,
      }),
      afterMeta: {width, height, bytes: outputBytes, format},
      rows: [
        {
          label: tTool("result.originalDimensions"),
          value: `${sourceWidth}×${sourceHeight}`,
        },
        {label: tTool("result.croppedDimensions"), value: `${width}×${height}`},
        {label: tTool("result.originalSize"), value: formatBytes(inputBytes)},
        {label: tTool("result.croppedSize"), value: formatBytes(outputBytes)},
        {label: tTool("result.format"), value: format.toUpperCase()},
        {label: tTool("result.aspectRatio"), value: aspectRatio},
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
