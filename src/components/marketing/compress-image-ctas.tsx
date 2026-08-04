"use client";

import {dispatchGuestToolReset} from "@/components/marketing/guest-tool-events";

export function CompressImageResetCta({label}: {label: string}) {
  return (
    <button
      type="button"
      className="btn-primary min-h-11 px-6 text-sm"
      onClick={() => {
        document.getElementById("tool-workspace")?.scrollIntoView({behavior: "smooth", block: "start"});
        dispatchGuestToolReset("compress-image");
      }}
    >
      {label}
    </button>
  );
}

export function CompressImageHeroUploadCta({label}: {label: string}) {
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

export function CompressImageLearnMoreCta({label}: {label: string}) {
  return (
    <a
      href="#why-compress"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
    >
      {label}
    </a>
  );
}
