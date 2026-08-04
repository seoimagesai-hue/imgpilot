"use client";

import {dispatchGuestToolReset, GUEST_TOOL_RESET_EVENT} from "@/components/marketing/guest-tool-events";

export {GUEST_TOOL_RESET_EVENT};

export function ResizeJpgResetCta({label}: {label: string}) {
  return (
    <button
      type="button"
      className="btn-primary min-h-11 px-6 text-sm"
      onClick={() => {
        document.getElementById("tool-workspace")?.scrollIntoView({behavior: "smooth", block: "start"});
        dispatchGuestToolReset("resize-jpg");
      }}
    >
      {label}
    </button>
  );
}
