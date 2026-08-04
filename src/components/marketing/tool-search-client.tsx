"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {Link} from "@/i18n/navigation";
import {
  DISCOVER_TOOLS,
  filterDiscoverTools,
  POPULAR_DISCOVER_HREFS,
  type DiscoverTool,
} from "@/lib/marketing/tool-discovery-catalog";

const RECENT_KEY = "seoimages_recent_tools";
const CATEGORIES = ["All", "Hub", "Convert", "Compress", "Resize", "Crop", "Bulk"] as const;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(href: string) {
  try {
    const next = [href, ...readRecent().filter((item) => item !== href)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function ToolSearchClient({
  labels,
}: {
  labels: {
    placeholder: string;
    popular: string;
    recent: string;
    categories: string;
    results: string;
    empty: string;
    shortcuts: string;
    slash: string;
    esc: string;
  };
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [recent, setRecent] = useState<DiscoverTool[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hrefs = readRecent();
    setRecent(
      hrefs
        .map((href) => DISCOVER_TOOLS.find((tool) => tool.href === href))
        .filter((tool): tool is DiscoverTool => Boolean(tool)),
    );
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => filterDiscoverTools(query, category), [query, category]);
  const popular = POPULAR_DISCOVER_HREFS.map((href) =>
    DISCOVER_TOOLS.find((tool) => tool.href === href),
  ).filter((tool): tool is DiscoverTool => Boolean(tool));

  return (
    <div className="space-y-8">
      <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-6">
        <label className="sr-only" htmlFor="tool-search-input">
          {labels.placeholder}
        </label>
        <div className="relative">
          <input
            id="tool-search-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.placeholder}
            className="min-h-14 w-full rounded-2xl border border-[var(--border)] bg-[#f8fafc] px-4 pe-28 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <kbd className="rounded-md border border-[var(--border)] bg-white px-1.5 py-0.5">/</kbd>
            <span>or</span>
            <kbd className="rounded-md border border-[var(--border)] bg-white px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          {labels.shortcuts}: {labels.slash} · {labels.esc}
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          {labels.categories}
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const active = item === category;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`min-h-10 rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[#f8fafc]"
                }`}
                aria-pressed={active}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {!query && recent.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{labels.recent}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((tool) => (
              <li key={`recent-${tool.href}`}>
                <ToolCard tool={tool} onNavigate={() => pushRecent(tool.href)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!query ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{labels.popular}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => (
              <li key={`popular-${tool.href}`}>
                <ToolCard tool={tool} onNavigate={() => pushRecent(tool.href)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {labels.results}{" "}
          <span className="text-sm font-normal text-[var(--muted-foreground)]">({results.length})</span>
        </h2>
        {results.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[var(--border)] bg-[#f8fafc] px-5 py-8 text-[15px] text-[var(--muted-foreground)]">
            {labels.empty}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((tool) => (
              <li key={tool.href}>
                <ToolCard tool={tool} onNavigate={() => pushRecent(tool.href)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ToolCard({tool, onNavigate}: {tool: DiscoverTool; onNavigate: () => void}) {
  return (
    <Link
      href={tool.href}
      onClick={onNavigate}
      className="flex h-full flex-col rounded-[18px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
        {tool.category}
      </span>
      <h3 className="text-base font-semibold">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{tool.description}</p>
    </Link>
  );
}
