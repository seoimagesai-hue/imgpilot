"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import type {Workflow, WorkflowTriggerType} from "@/db/schema";
import {
  createWorkflowAction,
  updateWorkflowAction,
  type WorkflowActionState,
} from "@/server/workflows/actions";
import {SCHEDULE_INTERVALS, WORKFLOW_TRIGGER_TYPES} from "@/server/workflows/policy";

const initial: WorkflowActionState = {ok: false};

export type WorkflowFormProjectOption = {
  id: string;
  name: string;
};

type WorkflowFormProps = {
  workspaceType: "personal" | "organization";
  workspaceId: string;
  projects: WorkflowFormProjectOption[];
  workflow?: Workflow;
  canManage: boolean;
};

export function WorkflowForm({workspaceType, workspaceId, projects, workflow, canManage}: WorkflowFormProps) {
  const t = useTranslations("workflows");
  const tErr = useTranslations("workflows.errors");
  const locale = useLocale();
  const isEdit = Boolean(workflow);
  const action = isEdit ? updateWorkflowAction : createWorkflowAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastSuccessId = useRef<string | undefined>(undefined);

  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(
    workflow?.triggerType ?? "image.uploaded",
  );

  useEffect(() => {
    if (state.ok && state.workflow && state.workflow.id !== lastSuccessId.current) {
      lastSuccessId.current = state.workflow.id;
      if (!isEdit) formRef.current?.reset();
    }
  }, [state.ok, state.workflow, isEdit]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INVALID_REQUEST");
    } catch {
      return tErr("INVALID_REQUEST");
    }
  }

  if (!canManage) return null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
      noValidate
    >
      <h2 className="text-lg font-semibold">{isEdit ? t("editTitle") : t("createTitle")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("orchestrationNote")}</p>

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {workflow ? <input type="hidden" name="workflowId" value={workflow.id} /> : null}

      {state.error && !state.fieldErrors ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      {state.ok && state.workflow && !isEdit ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("createdNotice")}{" "}
          <Link
            href={`/dashboard/settings/automation/${state.workflow.id}`}
            className="font-medium underline"
          >
            {t("configureSteps")}
          </Link>
        </div>
      ) : null}

      {state.ok && state.workflow && isEdit ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("updatedNotice")}
        </div>
      ) : null}

      <div>
        <label htmlFor="workflow-name" className="mb-1.5 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="workflow-name"
          name="name"
          required
          maxLength={120}
          disabled={pending || workflow?.status === "enabled"}
          defaultValue={workflow?.name ?? ""}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.name)}</p> : null}
      </div>

      <div>
        <label htmlFor="workflow-description" className="mb-1.5 block text-sm font-medium">
          {t("description")}
        </label>
        <textarea
          id="workflow-description"
          name="description"
          rows={3}
          maxLength={2000}
          disabled={pending || workflow?.status === "enabled"}
          defaultValue={workflow?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="workflow-trigger" className="mb-1.5 block text-sm font-medium">
          {t("triggerType")}
        </label>
        <select
          id="workflow-trigger"
          name="triggerType"
          required
          disabled={pending || workflow?.status === "enabled"}
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value as WorkflowTriggerType)}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          {WORKFLOW_TRIGGER_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`triggerValues.${value}` as "triggerValues.manual")}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">{t(`triggerHints.${triggerType}` as "triggerHints.manual")}</p>
        {state.fieldErrors?.triggerType ? (
          <p className="mt-1 text-sm text-red-700">{msg(state.fieldErrors.triggerType)}</p>
        ) : null}
      </div>

      {triggerType === "scheduled" ? (
        <div>
          <label htmlFor="workflow-schedule" className="mb-1.5 block text-sm font-medium">
            {t("scheduleInterval")}
          </label>
          <select
            id="workflow-schedule"
            name="scheduleInterval"
            required
            disabled={pending || workflow?.status === "enabled"}
            defaultValue={workflow?.scheduleInterval ?? "daily"}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          >
            {SCHEDULE_INTERVALS.map((value) => (
              <option key={value} value={value}>
                {t(`scheduleValues.${value}` as "scheduleValues.daily")}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor="workflow-project" className="mb-1.5 block text-sm font-medium">
          {t("projectId")}
        </label>
        <select
          id="workflow-project"
          name="projectId"
          disabled={pending || workflow?.status === "enabled"}
          defaultValue={workflow?.projectId ?? ""}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
        >
          <option value="">{t("allProjects")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">{t("projectHint")}</p>
      </div>

      {workflow?.status === "enabled" ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t("enabledEditBlocked")}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">{t("r2SourceOfTruthNote")}</p>

      {workflow?.status !== "enabled" ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("saving") : isEdit ? t("saveChanges") : t("createWorkflow")}
        </button>
      ) : null}
    </form>
  );
}
