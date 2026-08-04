import type {LandingOperation} from "@/lib/marketing/tool-landing-registry";

/** Lightweight CSS/SVG motif — no stock photography. */
export function LandingMotif({operation}: {operation: LandingOperation}) {
  return (
    <div
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"
      aria-hidden
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {operation === "compress" ? (
          <>
            <rect x="6" y="8" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 18h12M14 14l-2 4 2 4M22 14l2 4-2 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        ) : null}
        {operation === "resize" ? (
          <>
            <rect x="8" y="10" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M20 8h8v8M28 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : null}
        {operation === "crop" ? (
          <>
            <path d="M10 6v16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M26 30V14H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : null}
        {operation === "convert" ? (
          <>
            <circle cx="12" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M16 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
