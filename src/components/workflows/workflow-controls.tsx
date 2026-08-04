"use client";

import {useActionState} from "react";
import {useLocale, useTranslations} from "next-intl";
import type {Workflow} from "@/db/schema";
import {
  disableWorkflowAction,
  enableWorkflowAction,
  type WorkflowActionState,
} from "@/server/workflows/actions";

const initial: WorkflowActionState = {ok: false};

type WorkflowControlsProps = {
  workflow: Workflow;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  canManage: boolean;
  canRun: boolean;
};

export function WorkflowControls({workflow, workspaceType, workspaceId, canManage}: WorkflowControlsProps) {
  const t = useTranslations("workflows");
  const tErr = useTranslations("workflows.errors");
  const locale = useLocale();
  const [enableState, enableAction, enablePending] = useActionState(enableWorkflowAction, initial);
  const [disableState, disableAction, disablePending] = useActionState(disableWorkflowAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INVALID_REQUEST");
    } catch {
      return tErr("INVALID_REQUEST");
    }
  }

  const error = enableState.error || disableState.error;
  const ok = enableState.ok || disableState.ok;

  if (!canManage) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{t("controlsTitle")}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {t("statusLabel")}: {t(`statusValues.${workflow.status}` as "statusValues.draft")}
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {msg(error)}
        </p>
      ) : null}

      {ok && !error ? (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {enableState.ok ? t("enabledNotice") : t("disabledNotice")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {workflow.status !== "enabled" ? (
          <form action={enableAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="workspaceType" value={workspaceType} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="workflowId" value={workflow.id} />
            <button
              type="submit"
              disabled={enablePending}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {enablePending ? t("enabling") : t("enable")}
            </button>
          </form>
        ) : (
          <form action={disableAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="workspaceType" value={workspaceType} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="workflowId" value={workflow.id} />
            <button
              type="submit"
              disabled={disablePending}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 disabled:opacity-60"
            >
              {disablePending ? t("disabling") : t("disable")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
