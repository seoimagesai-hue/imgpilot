"use client";

import {useFormatter, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {WorkflowRun} from "@/db/schema";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-gray-100 text-gray-700",
  leased: "bg-blue-100 text-blue-800",
  running: "bg-blue-100 text-blue-800",
  waiting: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  timed_out: "bg-red-100 text-red-800",
};

type RunHistoryProps = {
  workflowId: string;
  runs: WorkflowRun[];
};

export function RunHistory({workflowId, runs}: RunHistoryProps) {
  const t = useTranslations("workflows");
  const format = useFormatter();

  if (runs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm">
        <h3 className="font-semibold">{t("runsEmptyTitle")}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("runsEmptyText")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <h2 className="border-b border-[var(--border)] p-4 text-lg font-semibold">{t("runsTitle")}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3">{t("columnRunStatus")}</th>
              <th className="px-4 py-3">{t("columnStarted")}</th>
              <th className="px-4 py-3">{t("columnCompleted")}</th>
              <th className="px-4 py-3">{t("columnError")}</th>
              <th className="px-4 py-3">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[run.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`runStatusValues.${run.status}` as "runStatusValues.queued")}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {run.startedAt
                    ? format.dateTime(new Date(run.startedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })
                    : t("notStarted")}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {run.completedAt
                    ? format.dateTime(new Date(run.completedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })
                    : "—"}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-[var(--muted)]">
                  {run.lastErrorCode ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/settings/automation/${workflowId}/runs/${run.id}`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
                  >
                    {t("viewRun")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
