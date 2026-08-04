"use client";

import {useActionState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {runWorkflowManuallyAction, type WorkflowActionState} from "@/server/workflows/actions";

const initial: WorkflowActionState = {ok: false};

type ManualRunPanelProps = {
  workflowId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  defaultProjectId?: string | null;
};

export function ManualRunPanel({workflowId, workspaceType, workspaceId, defaultProjectId}: ManualRunPanelProps) {
  const t = useTranslations("workflows");
  const tErr = useTranslations("workflows.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(runWorkflowManuallyAction, initial);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INVALID_REQUEST");
    } catch {
      return tErr("INVALID_REQUEST");
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">{t("manualRunTitle")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("manualRunHint")}</p>

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="workflowId" value={workflowId} />

      {state.error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      {state.ok && state.run ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("runQueuedNotice")} ({state.run.id})
        </div>
      ) : null}

      <div>
        <label htmlFor="manual-project-id" className="mb-1.5 block text-sm font-medium">
          {t("manualProjectId")}
        </label>
        <input
          id="manual-project-id"
          name="projectId"
          defaultValue={defaultProjectId ?? ""}
          placeholder={t("manualProjectIdPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 font-mono text-sm"
        />
      </div>

      <div>
        <label htmlFor="manual-image-id" className="mb-1.5 block text-sm font-medium">
          {t("manualImageId")}
        </label>
        <input
          id="manual-image-id"
          name="imageId"
          placeholder={t("manualImageIdPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("manualImageIdHint")}</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? t("running") : t("runNow")}
      </button>
    </form>
  );
}
