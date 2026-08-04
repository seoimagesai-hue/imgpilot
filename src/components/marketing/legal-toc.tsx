"use client";

import {useEffect, useState} from "react";

export type LegalTocItem = {id: string; label: string};

export function LegalStickyToc({
  items,
  ariaLabel,
  heading = "On this page",
}: {
  items: LegalTocItem[];
  ariaLabel: string;
  heading?: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target?.id;
        if (top) setActiveId(top);
      },
      {rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5]},
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className="rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] lg:sticky lg:top-24"
    >
      <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
        {heading}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block rounded-lg px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  active
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[#f8fafc] hover:text-[var(--foreground)]"
                }`}
                aria-current={active ? "location" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
