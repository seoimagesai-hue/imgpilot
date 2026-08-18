"use client";

import {HomeStyleToolEntry} from "@/components/guest/home-style-tool-entry";
import {
  actionLabelForTool,
  bulkOptionsForTool,
} from "@/components/guest/landing-home-style-workspace";
import type {LandingToolId} from "@/components/marketing/tool-landing-workspace";
import {isGuestBulkToolCode, type GuestBulkToolCode} from "@/lib/guest/bulk-policy";

export function BulkToolLandingWorkspace({initialTool}: {initialTool?: string}) {
  const tool: GuestBulkToolCode = isGuestBulkToolCode(initialTool || "")
    ? (initialTool as GuestBulkToolCode)
    : "compress";
  const toolId = tool as LandingToolId;

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
      bulkTool={tool}
      bulkOptions={bulkOptionsForTool(toolId)}
      showFooter={false}
    />
  );
}
