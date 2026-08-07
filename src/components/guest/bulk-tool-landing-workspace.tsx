"use client";

import {BulkToolWorkspace} from "@/components/guest/bulk-tool-workspace";

export function BulkToolLandingWorkspace({initialTool}: {initialTool?: string}) {
  return (
    <BulkToolWorkspace
      initialTool={initialTool}
      presentation={{
        hideToolHeader: true,
        hideSingleOnlyNote: true,
        embedded: true,
        dropTitle: "Drop images here or click to upload",
        dropHint: "Upload JPG, PNG or WebP images for bulk processing.",
        browseLabel: "Choose Images",
        formatsHint: "Supported: JPG, PNG, WebP · Auto-delete after guest session",
      }}
    />
  );
}
