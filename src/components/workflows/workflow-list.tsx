"use client";

import {useActionState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {Workflow} from "@/db/schema";
import {
  deleteWorkflowAction,
  disableWorkflowAction,
  duplicateWorkflowAction,
  enableWorkflowAction,
  runWorkflowManuallyAction,
  type WorkflowActionState,
} from "@/server/workflows/actions";

const initial: WorkflowActionState = {ok: false};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  enabled: "bg-emerald-100 text-emerald-800",
  disabled: "bg-amber-100 text-amber-800",
};

type WorkflowListProps = {
  workflows: Workflow[];
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
  canRun: boolean;
};

function HiddenWorkspaceFields({
  locale,
  workspaceType,
  workspaceId,
  workflowId,
}: {
  locale: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  workflowId: string;
}) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="workflowId" value={workflowId} />
    </>
  );
}

export function WorkflowList({workflows, workspaceType, workspaceId, canManage, canRun}: WorkflowListProps) {
  const t = useTranslations("workflows");
  const locale = useLocale();

  if (workflows.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm">
        <h3 className="font-semibold">{t("emptyTitle")}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("emptyText")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("listTitle")}</h2>
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          workspaceType={workspaceType}
          workspaceId={workspaceId}
          locale={locale}
          canManage={canManage}
          canRun={canRun}
        />
      ))}
    </div>
  );
}

function WorkflowCard({
  workflow,
  workspaceType,
  workspaceId,
  locale,
  canManage,
  canRun,
}: {
  workflow: Workflow;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  locale: string;
  canManage: boolean;
  canRun: boolean;
}) {
  const t = useTranslations("workflows");
  const tErr = useTranslations("workflows.errors");
  const [enableState, enableAction, enablePending] = useActionState(enableWorkflowAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableWorkflowAction, initial);
  const [duplicateState, duplicateAction, duplicatePending] = useActionState(duplicateWorkflowAction, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteWorkflowAction, initial);
  const [runState, runAction, runPending] = useActionState(runWorkflowManuallyAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INVALID_REQUEST");
    } catch {
      return tErr("INVALID_REQUEST");
    }
  }

  const actionError =
    enableState.error || disableState.error || duplicateState.error || deleteState.error || runState.error;

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{workflow.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[workflow.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {t(`statusValues.${workflow.status}` as "statusValues.draft")}
            </span>
          </div>
          {workflow.description ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{workflow.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--muted)]">
            {t("triggerLabel")}:{" "}
            {t(
              `triggerValues.${workflow.triggerType.replace(/\./g, "_")}` as "triggerValues.manual",
            )}
            {workflow.scheduleInterval
              ? ` · ${t(`scheduleValues.${workflow.scheduleInterval}` as "scheduleValues.daily")}`
              : null}
          </p>
        </div>
        <Link
          href={`/dashboard/settings/automation/${workflow.id}`}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
        >
          {t("viewDetails")}
        </Link>
      </div>

      {actionError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {msg(actionError)}
        </p>
      ) : null}

      {(enableState.ok || disableState.ok || duplicateState.ok || deleteState.ok || runState.ok) && !actionError ? (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {enableState.ok
            ? t("enabledNotice")
            : disableState.ok
              ? t("disabledNotice")
              : duplicateState.ok
                ? t("duplicatedNotice")
                : deleteState.ok
                  ? t("deletedNotice")
                  : t("runQueuedNotice")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canManage && workflow.status !== "enabled" ? (
          <form action={enableAction}>
            <HiddenWorkspaceFields
              locale={locale}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              workflowId={workflow.id}
            />
            <button
              type="submit"
              disabled={enablePending}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-60"
            >
              {enablePending ? t("enabling") : t("enable")}
            </button>
          </form>
        ) : null}

        {canManage && workflow.status === "enabled" ? (
          <form action={disableAction}>
            <HiddenWorkspaceFields
              locale={locale}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              workflowId={workflow.id}
            />
            <button
              type="submit"
              disabled={disablePending}
              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 disabled:opacity-60"
            >
              {disablePending ? t("disabling") : t("disable")}
            </button>
          </form>
        ) : null}

        {canRun && workflow.status === "enabled" ? (
          <form action={runAction}>
            <HiddenWorkspaceFields
              locale={locale}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              workflowId={workflow.id}
            />
            <button
              type="submit"
              disabled={runPending}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {runPending ? t("running") : t("runNow")}
            </button>
          </form>
        ) : null}

        {canManage ? (
          <form action={duplicateAction}>
            <HiddenWorkspaceFields
              locale={locale}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              workflowId={workflow.id}
            />
            <button
              type="submit"
              disabled={duplicatePending}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {duplicatePending ? t("duplicating") : t("duplicate")}
            </button>
          </form>
        ) : null}

        {canManage ? (
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(t("confirmDelete"))) e.preventDefault();
            }}
          >
            <HiddenWorkspaceFields
              locale={locale}
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              workflowId={workflow.id}
            />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {deletePending ? t("deleting") : t("delete")}
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
