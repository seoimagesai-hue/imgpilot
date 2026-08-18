"use client";

import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import {HomeStyleToolEntry} from "@/components/guest/home-style-tool-entry";
import {
  actionLabelForTool,
  bulkOptionsForTool,
  bulkToolForLanding,
} from "@/components/guest/landing-home-style-workspace";
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
import type {LandingToolId} from "@/components/marketing/tool-landing-workspace";

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

function operationToolId(landing: ToolLandingDefinition): LandingToolId {
  return landing.operation;
}

function matchesLandingFile(landing: ToolLandingDefinition, file: File): boolean {
  const mimes = mimesForSourceFormat(landing.sourceFormat);
  if (!mimes?.length) {
    const mime = file.type.toLowerCase();
    return mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png" || mime === "image/webp";
  }
  return mimes.includes(file.type.toLowerCase()) || (file.type === "image/jpg" && mimes.includes("image/jpeg"));
}

export function LandingToolWorkspace({
  landing,
  presentation,
}: {
  landing: ToolLandingDefinition;
  presentation?: GuestToolPresentation;
}) {
  const toolId = operationToolId(landing);
  const mimes = mimesForSourceFormat(landing.sourceFormat);
  const accept = mimes?.join(",") ?? "image/jpeg,image/png,image/webp";
  const marketingPresentation: GuestToolPresentation = {
    landingChrome: "marketing",
    onIdleReset: undefined,
    ...presentation,
  };

  const convertDefaults: GuestConvertOptions = {
    ...defaultGuestConvertOptions(landing.sourceFormat ?? null, landing.targetFormat === "avif"),
    targetFormat: ((landing.targetFormat ?? "webp") === "avif" ? "avif" : (landing.targetFormat ?? "webp")) as GuestConvertTargetFormat,
    jpegBackground: landing.targetFormat === "jpeg" ? "white" : null,
  };

  const cropDefaults: GuestCropOptions = {
    ...defaultGuestCropOptions(),
    aspectRatio: landing.cropAspect ?? "free",
  };

  return (
    <HomeStyleToolEntry
      heading="Drop Your Files Here"
      support=""
      chooseLabel="Select Files"
      pasteHint="You can also paste an image with Ctrl + V"
      maxMb={10}
      showFormatTabs={false}
      toolId={toolId}
      actionLabel={actionLabelForTool(toolId)}
      bulkTool={bulkToolForLanding(toolId)}
      bulkOptions={
        landing.operation === "convert"
          ? bulkOptionsForTool("convert", {
              targetFormat: convertDefaults.targetFormat,
              jpegBackground: convertDefaults.jpegBackground ?? "white",
            })
          : bulkOptionsForTool(toolId)
      }
      accept={accept}
      matchesFile={(file) => matchesLandingFile(landing, file)}
      showFooter={false}
      renderSingleWorkspace={({workspaceKey, onIdleReset}) => {
        const chrome: GuestToolPresentation = {
          ...marketingPresentation,
          onIdleReset,
        };
        if (landing.operation === "compress") {
          return (
            <GuestToolWorkspace
              key={workspaceKey}
              config={withMime(compressToolConfig, landing, `landing-${landing.slug}`, chrome)}
            />
          );
        }
        if (landing.operation === "resize") {
          return (
            <GuestToolWorkspace
              key={workspaceKey}
              config={withMime(resizeToolConfig, landing, `landing-${landing.slug}`, chrome)}
            />
          );
        }
        if (landing.operation === "crop") {
          const config: GuestToolConfig<GuestCropOptions> = {
            ...withMime(cropToolConfig, landing, `landing-${landing.slug}`, chrome),
            defaultOptions: cropDefaults,
          };
          return <GuestToolWorkspace key={workspaceKey} config={config} />;
        }
        const config: GuestToolConfig<GuestConvertOptions> = {
          ...withMime(convertToolConfig, landing, `landing-${landing.slug}`, chrome),
          defaultOptions: convertDefaults,
        };
        return <GuestToolWorkspace key={workspaceKey} config={config} />;
      }}
    />
  );
}
