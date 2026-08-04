"use client";

import {useFormatter, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {WorkflowRun, WorkflowRunStep} from "@/db/schema";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-800",
  waiting: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  skipped: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

type RunDetailProps = {
  workflowId: string;
  run: WorkflowRun;
  steps: WorkflowRunStep[];
};

export function RunDetail({workflowId, run, steps}: RunDetailProps) {
  const t = useTranslations("workflows");
  const format = useFormatter();

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/settings/automation/${workflowId}`} className="text-sm text-[var(--accent)]">
        ← {t("backToWorkflow")}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("runDetailTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("runIdLabel")}: <span className="font-mono text-[var(--foreground)]">{run.id}</span>
        </p>
      </header>

      <dl className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted)]">{t("columnRunStatus")}</dt>
          <dd className="mt-0.5 font-medium">{t(`runStatusValues.${run.status}` as "runStatusValues.queued")}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("columnStarted")}</dt>
          <dd className="mt-0.5 font-medium">
            {run.startedAt
              ? format.dateTime(new Date(run.startedAt), {dateStyle: "medium", timeStyle: "short", timeZone: "UTC"})
              : t("notStarted")}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("columnCompleted")}</dt>
          <dd className="mt-0.5 font-medium">
            {run.completedAt
              ? format.dateTime(new Date(run.completedAt), {dateStyle: "medium", timeStyle: "short", timeZone: "UTC"})
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">{t("columnError")}</dt>
          <dd className="mt-0.5 font-medium">{run.lastErrorCode ?? "—"}</dd>
        </div>
      </dl>

      {run.lastErrorMessage ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {run.lastErrorMessage}
        </p>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <h2 className="border-b border-[var(--border)] p-4 text-lg font-semibold">{t("stepLogTitle")}</h2>
        {steps.length === 0 ? (
          <p className="p-4 text-sm text-[var(--muted)]">{t("stepLogEmpty")}</p>
        ) : (
          <ol className="divide-y divide-[var(--border)]">
            {steps.map((step) => (
              <li key={step.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {t("stepLabel", {number: step.position})}
                    {step.actionType ? (
                      <span className="ms-1 font-normal text-[var(--muted)]">
                        — {t(`actionValues.${step.actionType}` as "actionValues.validate_image")}
                      </span>
                    ) : (
                      <span className="ms-1 font-normal text-[var(--muted)]">— {t("stepKindCondition")}</span>
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[step.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`runStepStatusValues.${step.status}` as "runStepStatusValues.pending")}
                  </span>
                </div>
                {step.errorCode ? (
                  <p className="mt-2 text-sm text-red-700">
                    {t("stepErrorLabel")}: {step.errorCode}
                    {step.errorMessage ? ` — ${step.errorMessage}` : null}
                  </p>
                ) : null}
                {step.log ? (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-gray-50 p-2 text-xs text-[var(--muted)]">
                    {step.log}
                  </pre>
                ) : null}
                {step.durationMs != null ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t("stepDuration", {ms: step.durationMs})}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
