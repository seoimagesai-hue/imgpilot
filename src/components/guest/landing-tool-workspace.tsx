"use client";

import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import type {GuestToolConfig, GuestToolPresentation} from "@/components/guest/tool-config";
import {compressToolConfig} from "@/components/guest/tools/compress-tool";
import {convertToolConfig} from "@/components/guest/tools/convert-tool";
import {cropToolConfig} from "@/components/guest/tools/crop-tool";
import {resizeToolConfig} from "@/components/guest/tools/resize-tool";
import {
  defaultGuestConvertOptions,
  type GuestConvertOptions,
  type GuestConvertTargetFormat,
} from "@/lib/guest/convert-policy";
import {defaultGuestCropOptions, type GuestCropOptions} from "@/lib/guest/crop-policy";
import {
  mimesForSourceFormat,
  type ToolLandingDefinition,
} from "@/lib/marketing/tool-landing-registry";

function withMime<T>(
  base: GuestToolConfig<T>,
  landing: ToolLandingDefinition,
  toolCode: string,
  presentation?: GuestToolPresentation,
): GuestToolConfig<T> {
  const mimes = mimesForSourceFormat(landing.sourceFormat);
  return {
    ...base,
    toolCode,
    allowedMimeTypes: mimes,
    hideToolHeader: true,
    presentation,
  };
}

export function LandingToolWorkspace({
  landing,
  presentation,
}: {
  landing: ToolLandingDefinition;
  presentation?: GuestToolPresentation;
}) {
  if (landing.operation === "compress") {
    return (
      <GuestToolWorkspace
        config={withMime(compressToolConfig, landing, `landing-${landing.slug}`, presentation)}
      />
    );
  }
  if (landing.operation === "resize") {
    return (
      <GuestToolWorkspace
        config={withMime(resizeToolConfig, landing, `landing-${landing.slug}`, presentation)}
      />
    );
  }
  if (landing.operation === "crop") {
    const defaults: GuestCropOptions = {
      ...defaultGuestCropOptions(),
      aspectRatio: landing.cropAspect ?? "free",
    };
    const config: GuestToolConfig<GuestCropOptions> = {
      ...withMime(cropToolConfig, landing, `landing-${landing.slug}`, presentation),
      defaultOptions: defaults,
    };
    return <GuestToolWorkspace config={config} />;
  }

  const target = (landing.targetFormat ?? "webp") as GuestConvertTargetFormat;
  const defaults: GuestConvertOptions = {
    ...defaultGuestConvertOptions(landing.sourceFormat ?? null, target === "avif"),
    targetFormat: target === "avif" ? "avif" : target,
    jpegBackground: target === "jpeg" ? "white" : null,
  };
  const config: GuestToolConfig<GuestConvertOptions> = {
    ...withMime(convertToolConfig, landing, `landing-${landing.slug}`, presentation),
    defaultOptions: defaults,
  };
  return <GuestToolWorkspace config={config} />;
}
