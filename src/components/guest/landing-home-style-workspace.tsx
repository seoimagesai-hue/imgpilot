"use client";

import {HomeStyleToolEntry} from "@/components/guest/home-style-tool-entry";
import type {GuestToolPresentation} from "@/components/guest/tool-config";
import type {LandingToolId} from "@/components/marketing/tool-landing-workspace";
import type {GuestBulkToolCode} from "@/lib/guest/bulk-policy";
import {defaultGuestResizeOptions} from "@/lib/guest/resize-policy";

const ACTION_LABEL: Record<LandingToolId, string> = {
  compress: "Compress",
  resize: "Resize",
  crop: "Crop",
  convert: "Convert",
  rotate: "Rotate",
  watermark: "Watermark",
  blur: "Blur",
  meme: "Create",
  geotag: "Geotag",
  metadata: "Inspect",
  aiAlt: "Generate",
  metadataEditor: "Edit",
};

const BULK_TOOL: Partial<Record<LandingToolId, GuestBulkToolCode>> = {
  compress: "compress",
  resize: "resize",
  convert: "convert",
};

export function bulkOptionsForTool(
  toolId: LandingToolId,
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  if (toolId === "compress") return {quality: 80, preset: "custom", ...extras};
  if (toolId === "resize") return {...defaultGuestResizeOptions(), ...extras};
  if (toolId === "convert") {
    return {
      targetFormat: "webp",
      qualityPreset: "balanced",
      jpegBackground: "white",
      ...extras,
    };
  }
  return extras ?? {};
}

export function actionLabelForTool(toolId: LandingToolId): string {
  return ACTION_LABEL[toolId];
}

export function bulkToolForLanding(toolId: LandingToolId): GuestBulkToolCode | null {
  return BULK_TOOL[toolId] ?? null;
}

export function LandingHomeStyleWorkspace({
  toolId,
  presentation,
}: {
  toolId: LandingToolId;
  presentation?: GuestToolPresentation;
}) {
  return (
    <HomeStyleToolEntry
      heading="Drop Your Files Here"
      support=""
      chooseLabel="Select Files"
      pasteHint="You can also paste an image with Ctrl + V"
      maxMb={10}
      showFormatTabs={false}
      toolId={toolId}
      actionLabel={ACTION_LABEL[toolId]}
      bulkTool={BULK_TOOL[toolId] ?? null}
      bulkOptions={bulkOptionsForTool(toolId)}
      workspacePresentation={presentation}
      showFooter={false}
    />
  );
}
