"use client";

import {GuestToolWorkspace} from "@/components/guest/guest-tool-workspace";
import type {GuestToolConfig, GuestToolPresentation} from "@/components/guest/tool-config";
import {aiAltToolConfig} from "@/components/guest/tools/ai-alt-tool";
import {blurRegionToolConfig} from "@/components/guest/tools/blur-region-tool";
import {compressToolConfig} from "@/components/guest/tools/compress-tool";
import {convertToolConfig} from "@/components/guest/tools/convert-tool";
import {cropToolConfig} from "@/components/guest/tools/crop-tool";
import {geotagToolConfig} from "@/components/guest/tools/geotag-tool";
import {memeToolConfig} from "@/components/guest/tools/meme-tool";
import {metadataEditorToolConfig} from "@/components/guest/tools/metadata-editor-tool";
import {metadataToolConfig} from "@/components/guest/tools/metadata-tool";
import {resizeToolConfig} from "@/components/guest/tools/resize-tool";
import {rotateToolConfig} from "@/components/guest/tools/rotate-tool";
import {watermarkToolConfig} from "@/components/guest/tools/watermark-tool";

/**
 * Resolves guest tool configs on the client only.
 * Passing full configs (with component/fn fields) from Server → Client strips
 * fields like `messageNamespace` and causes `guest.undefined.*` + crashes.
 */
export type LandingToolId =
  | "compress"
  | "resize"
  | "crop"
  | "convert"
  | "rotate"
  | "watermark"
  | "blur"
  | "meme"
  | "geotag"
  | "metadata"
  | "aiAlt"
  | "metadataEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LANDING_TOOL_CONFIGS: Record<LandingToolId, GuestToolConfig<any>> = {
  compress: compressToolConfig,
  resize: resizeToolConfig,
  crop: cropToolConfig,
  convert: convertToolConfig,
  rotate: rotateToolConfig,
  watermark: watermarkToolConfig,
  blur: blurRegionToolConfig,
  meme: memeToolConfig,
  geotag: geotagToolConfig,
  metadata: metadataToolConfig,
  aiAlt: aiAltToolConfig,
  metadataEditor: metadataEditorToolConfig,
};

export function ToolLandingWorkspace({
  toolId,
  presentation,
}: {
  toolId: LandingToolId;
  presentation?: GuestToolPresentation;
}) {
  const base = LANDING_TOOL_CONFIGS[toolId];
  return (
    <GuestToolWorkspace
      config={{
        ...base,
        hideToolHeader: true,
        presentation,
      }}
    />
  );
}
