"use client";

export type ToolResultRow = {label: string; value: string};

type Props = {
  title: string;
  rows: ToolResultRow[];
};

/** Shared result grid used by Compress, Resize, and future tools. */
export function ToolResultPanel({title, rows}: Props) {
  return (
    <section
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      aria-labelledby="tool-results-title"
    >
      <h2 id="tool-results-title" className="text-sm font-semibold">
        {title}
      </h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-[var(--muted)]/10 px-3 py-2">
            <dt className="text-xs text-[var(--muted-foreground)]">{row.label}</dt>
            <dd className="text-sm font-medium" dir="ltr">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
