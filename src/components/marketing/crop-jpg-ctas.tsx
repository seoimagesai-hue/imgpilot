"use client";

import {dispatchGuestToolReset} from "@/components/marketing/guest-tool-events";

export function CropJpgResetCta({label}: {label: string}) {
  return (
    <button
      type="button"
      className="btn-primary min-h-11 px-6 text-sm"
      onClick={() => {
        document.getElementById("tool-workspace")?.scrollIntoView({behavior: "smooth", block: "start"});
        dispatchGuestToolReset("crop-jpg");
      }}
    >
      {label}
    </button>
  );
}

export function CropJpgHeroUploadCta({label}: {label: string}) {
  return (
    <button
      type="button"
      className="btn-primary min-h-11 w-full px-6 text-sm sm:w-auto"
      onClick={() => {
        const target = document.getElementById("tool-workspace");
        target?.scrollIntoView({behavior: "smooth", block: "start"});
        window.setTimeout(() => {
          target?.querySelector<HTMLElement>('[role="button"][aria-label]')?.focus();
        }, 350);
      }}
    >
      {label}
    </button>
  );
}
