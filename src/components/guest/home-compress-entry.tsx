"use client";

import {HomeStyleToolEntry} from "@/components/guest/home-style-tool-entry";

export function HomeCompressEntry({
  heading,
  support,
  chooseLabel,
  pasteHint,
  formatLimitLine,
  privacyLine,
  defaultActionLabel,
  maxMb,
}: {
  heading: string;
  support: string;
  chooseLabel: string;
  pasteHint: string;
  formatLimitLine: string;
  privacyLine: string;
  defaultActionLabel: string;
  maxMb: number;
}) {
  return (
    <HomeStyleToolEntry
      heading={heading}
      support={support}
      chooseLabel={chooseLabel}
      pasteHint={pasteHint}
      formatLimitLine={formatLimitLine}
      privacyLine={privacyLine}
      defaultActionLabel={defaultActionLabel}
      maxMb={maxMb}
      showFormatTabs
      toolId="compress"
      actionLabel="Compress"
      bulkTool="compress"
      bulkOptions={{quality: 80, preset: "custom"}}
      showFooter
    />
  );
}
