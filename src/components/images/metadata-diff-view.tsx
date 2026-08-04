"use client";

type DiffOp = {type: "equal" | "added" | "removed"; text: string};

type DiffRow = {
  field: string;
  before: string;
  after: string;
  changed: boolean;
  ops: DiffOp[];
};

type MetadataDiffViewProps = {
  diffs: DiffRow[];
  rtl?: boolean;
  labels?: Record<string, string>;
};

/** Minimal diff view stub for Phase 1 typecheck. */
export function MetadataDiffView({diffs, rtl, labels}: MetadataDiffViewProps) {
  if (!diffs.length) return null;
  return (
    <div dir={rtl ? "rtl" : undefined} className="space-y-3 text-sm">
      {diffs.map((row) => (
        <div key={row.field} className="rounded border border-[var(--border)] p-2">
          <p className="font-medium">{labels?.[row.field] ?? row.field}</p>
          {row.changed ? (
            <p className="text-[var(--muted)]">
              {row.before} → {row.after}
            </p>
          ) : (
            <p>{row.after || row.before}</p>
          )}
        </div>
      ))}
    </div>
  );
}
