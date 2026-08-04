type IconName =
  | "compress"
  | "resize"
  | "crop"
  | "convert"
  | "geotag"
  | "metadata"
  | "ai"
  | "editor"
  | "bulk"
  | "user"
  | "shield"
  | "clock"
  | "check"
  | "arrow";

const tones: Record<string, string> = {
  compress: "bg-[#EFF6FF] text-[#2563EB]",
  resize: "bg-[#F5F3FF] text-[#7C3AED]",
  crop: "bg-[#ECFEFF] text-[#0891B2]",
  convert: "bg-[#EEF2FF] text-[#4F46E5]",
  geotag: "bg-[#FEF3C7] text-[#D97706]",
  metadata: "bg-[#F1F5F9] text-[#334155]",
  ai: "bg-[#F5F3FF] text-[#7C3AED]",
  editor: "bg-[#EFF6FF] text-[#2563EB]",
  bulk: "bg-[#F5F3FF] text-[#6D28D9]",
  user: "bg-[#EFF6FF] text-[#2563EB]",
  shield: "bg-[#ECFDF5] text-[#16A34A]",
  clock: "bg-[#FFF7ED] text-[#D97706]",
  check: "bg-[#EFF6FF] text-[#2563EB]",
};

export function HomeIcon({name, className = ""}: {name: IconName; className?: string}) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tones[name] ?? tones.compress} ${className}`}
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {name === "compress" ? (
          <>
            <rect x="5" y="6" width="14" height="12" rx="2" />
            <path d="M9 12h6M10 9l-2 3 2 3M14 9l2 3-2 3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
        {name === "resize" ? (
          <>
            <rect x="5" y="7" width="10" height="10" rx="1.5" />
            <path d="M14 5h5v5M19 5l-6 6" strokeLinecap="round" />
          </>
        ) : null}
        {name === "crop" ? (
          <path d="M7 3v12h12M17 21V9H5" strokeLinecap="round" />
        ) : null}
        {name === "convert" ? (
          <>
            <circle cx="8" cy="12" r="3.5" />
            <circle cx="16" cy="12" r="3.5" />
            <path d="M11 12h2" strokeLinecap="round" />
          </>
        ) : null}
        {name === "geotag" ? (
          <>
            <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
            <circle cx="12" cy="11" r="2" />
          </>
        ) : null}
        {name === "metadata" ? (
          <>
            <circle cx="11" cy="11" r="5.5" />
            <path d="M16 16l4 4" strokeLinecap="round" />
            <path d="M9 11h4M9 9h2" strokeLinecap="round" />
          </>
        ) : null}
        {name === "ai" ? (
          <>
            <rect x="4" y="6" width="12" height="12" rx="2" />
            <path d="M18 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" stroke="none" />
            <path d="M7 14h6" strokeLinecap="round" />
          </>
        ) : null}
        {name === "editor" ? (
          <>
            <rect x="4" y="5" width="10" height="14" rx="2" />
            <path d="M16 8h4M16 12h4M16 16h3" strokeLinecap="round" />
          </>
        ) : null}
        {name === "bulk" ? (
          <>
            <rect x="4" y="8" width="10" height="8" rx="1.5" />
            <rect x="8" y="5" width="10" height="8" rx="1.5" />
            <rect x="14" y="14" width="6" height="5" rx="1" />
          </>
        ) : null}
        {name === "user" ? (
          <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
            <path d="M16 11l2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
        {name === "shield" ? (
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        ) : null}
        {name === "clock" ? (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v5l3 2" strokeLinecap="round" />
          </>
        ) : null}
        {name === "check" ? (
          <>
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
        {name === "arrow" ? <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
    </span>
  );
}
