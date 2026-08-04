"use client";

import {useActionState, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import type {WorkflowActionType, WorkflowOnFailure, WorkflowStep, WorkflowStepKind} from "@/db/schema";
import {CONVERSION_TARGET_FORMATS} from "@/lib/conversion-formats";
import {RESIZE_PRESET_IDS} from "@/lib/resize-presets";
import {replaceWorkflowStepsAction, type WorkflowActionState} from "@/server/workflows/actions";
import {WORKFLOW_ACTION_TYPES, type ConditionConfig} from "@/server/workflows/policy";

const initial: WorkflowActionState = {ok: false};

type StepDraft = {
  position: number;
  kind: WorkflowStepKind;
  actionType?: WorkflowActionType | null;
  config?: Record<string, unknown> | null;
  conditionConfig?: ConditionConfig | null;
  onFailure?: WorkflowOnFailure;
};

type StepBuilderProps = {
  workflowId: string;
  workspaceType: "personal" | "organization";
  workspaceId: string;
  initialSteps: WorkflowStep[];
  canManage: boolean;
  workflowEnabled: boolean;
};

function stepsFromInitial(initialSteps: WorkflowStep[]): StepDraft[] {
  return [...initialSteps]
    .sort((a, b) => a.position - b.position)
    .map((step) => ({
      position: step.position,
      kind: step.kind,
      actionType: step.actionType,
      config: (step.config as Record<string, unknown> | null) ?? null,
      conditionConfig: (step.conditionConfig as ConditionConfig | null) ?? null,
      onFailure: step.onFailure,
    }));
}

function reindex(steps: StepDraft[]): StepDraft[] {
  return steps.map((step, index) => ({...step, position: index + 1}));
}

export function StepBuilder({
  workflowId,
  workspaceType,
  workspaceId,
  initialSteps,
  canManage,
  workflowEnabled,
}: StepBuilderProps) {
  const t = useTranslations("workflows");
  const tErr = useTranslations("workflows.errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(replaceWorkflowStepsAction, initial);
  const [steps, setSteps] = useState<StepDraft[]>(() => stepsFromInitial(initialSteps));

  const stepsJson = useMemo(() => JSON.stringify(steps), [steps]);

  function msg(code?: string) {
    if (!code) return null;
    try {
      return tErr(code as "INVALID_REQUEST");
    } catch {
      return tErr("INVALID_REQUEST");
    }
  }

  function addStep(kind: WorkflowStepKind) {
    setSteps((prev) =>
      reindex([
        ...prev,
        {
          position: prev.length + 1,
          kind,
          actionType: kind === "action" ? "validate_image" : null,
          config: kind === "action" ? {} : null,
          conditionConfig: kind === "condition" ? {} : null,
          onFailure: "fail",
        },
      ]),
    );
  }

  function removeStep(index: number) {
    setSteps((prev) => reindex(prev.filter((_, i) => i !== index)));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return reindex(next);
    });
  }

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((step, i) => (i === index ? {...step, ...patch} : step)));
  }

  function updateCondition(index: number, key: keyof ConditionConfig, value: string | boolean) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) return step;
        const conditionConfig = {...(step.conditionConfig ?? {})};
        if (value === "" || value === false && key !== "metadataApproved" && key !== "published") {
          delete conditionConfig[key];
        } else if (key === "metadataApproved" || key === "published") {
          conditionConfig[key] = value === true || value === "true";
        } else if (key === "minWidth" || key === "maxWidth" || key === "minHeight" || key === "maxHeight" || key === "maxBytes") {
          const num = Number(value);
          if (Number.isFinite(num) && num > 0) conditionConfig[key] = num;
          else delete conditionConfig[key];
        } else {
          conditionConfig[key] = String(value);
        }
        return {...step, conditionConfig};
      }),
    );
  }

  function updateConfig(index: number, key: string, value: string) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) return step;
        const config = {...(step.config ?? {})};
        if (!value.trim()) delete config[key];
        else config[key] = value.trim();
        return {...step, config};
      }),
    );
  }

  if (!canManage) return null;

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("stepsTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("stepsHint")}</p>
        </div>
        {!workflowEnabled ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addStep("action")}
              disabled={pending}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              {t("addAction")}
            </button>
            <button
              type="button"
              onClick={() => addStep("condition")}
              disabled={pending}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              {t("addCondition")}
            </button>
          </div>
        ) : null}
      </div>

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspaceType" value={workspaceType} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="workflowId" value={workflowId} />
      <input type="hidden" name="stepsJson" value={stepsJson} />

      {state.error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {msg(state.error)}
        </div>
      ) : null}

      {state.fieldErrors?.stepsJson ? (
        <p role="alert" className="text-sm text-red-700">
          {msg(state.fieldErrors.stepsJson)}
        </p>
      ) : null}

      {state.ok ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("stepsSaved")}
        </div>
      ) : null}

      {workflowEnabled ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t("enabledStepsBlocked")}
        </p>
      ) : null}

      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
          {t("stepsEmpty")}
        </p>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={`${step.position}-${index}`}
              className="rounded-xl border border-[var(--border)] bg-gray-50/50 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {t("stepLabel", {number: step.position})}{" "}
                  <span className="font-normal text-[var(--muted)]">
                    — {step.kind === "action" ? t("stepKindAction") : t("stepKindCondition")}
                  </span>
                </span>
                {!workflowEnabled ? (
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={pending || index === 0}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-white disabled:opacity-40"
                      aria-label={t("moveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={pending || index === steps.length - 1}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs hover:bg-white disabled:opacity-40"
                      aria-label={t("moveDown")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={pending}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      {t("removeStep")}
                    </button>
                  </div>
                ) : null}
              </div>

              {step.kind === "action" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("actionType")}</label>
                    <select
                      value={step.actionType ?? "validate_image"}
                      disabled={workflowEnabled || pending}
                      onChange={(e) =>
                        updateStep(index, {
                          actionType: e.target.value as WorkflowActionType,
                          config: {},
                        })
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    >
                      {WORKFLOW_ACTION_TYPES.map((actionType) => (
                        <option key={actionType} value={actionType}>
                          {t(`actionValues.${actionType}` as "actionValues.validate_image")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {step.actionType === "resize" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("resizePreset")}</label>
                      <select
                        value={String(step.config?.preset ?? "px_512")}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateConfig(index, "preset", e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      >
                        {RESIZE_PRESET_IDS.map((preset) => (
                          <option key={preset} value={preset}>
                            {t(`resizePresetValues.${preset}` as "resizePresetValues.px_512")}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {step.actionType === "convert_format" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("convertFormat")}</label>
                      <select
                        value={String(step.config?.format ?? "webp")}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateConfig(index, "format", e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      >
                        {CONVERSION_TARGET_FORMATS.map((format) => (
                          <option key={format} value={format}>
                            {format.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {step.actionType === "publish_cloudinary" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("cloudinaryConnectionId")}</label>
                      <input
                        type="text"
                        value={String(step.config?.connectionId ?? "")}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateConfig(index, "connectionId", e.target.value)}
                        placeholder={t("cloudinaryConnectionIdPlaceholder")}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  ) : null}

                  {step.actionType === "generate_metadata" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("metadataLanguage")}</label>
                      <input
                        type="text"
                        value={String(step.config?.language ?? "")}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateConfig(index, "language", e.target.value)}
                        placeholder={t("metadataLanguagePlaceholder")}
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  ) : null}

                  {step.actionType === "generate_metadata_batch" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("batchTemplate")}</label>
                        <select
                          value={String(step.config?.templateCode ?? "seo")}
                          disabled={workflowEnabled || pending}
                          onChange={(e) => updateConfig(index, "templateCode", e.target.value)}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                        >
                          <option value="seo">{t("batchTemplateValues.seo")}</option>
                          <option value="accessibility">{t("batchTemplateValues.accessibility")}</option>
                          <option value="ecommerce">{t("batchTemplateValues.ecommerce")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("batchLanguage")}</label>
                        <select
                          value={String(step.config?.language ?? "en")}
                          disabled={workflowEnabled || pending}
                          onChange={(e) => updateConfig(index, "language", e.target.value)}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                        >
                          <option value="en">{t("batchLanguageValues.en")}</option>
                          <option value="ur">{t("batchLanguageValues.ur")}</option>
                        </select>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("onFailure")}</label>
                    <select
                      value={step.onFailure ?? "fail"}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateStep(index, {onFailure: e.target.value as WorkflowOnFailure})}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    >
                      <option value="fail">{t("onFailureValues.fail")}</option>
                      <option value="skip">{t("onFailureValues.skip")}</option>
                      <option value="retry">{t("onFailureValues.retry")}</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionFormat")}</label>
                    <input
                      type="text"
                      value={step.conditionConfig?.format ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "format", e.target.value)}
                      placeholder="jpeg"
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionLanguage")}</label>
                    <input
                      type="text"
                      value={step.conditionConfig?.language ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "language", e.target.value)}
                      placeholder="en"
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionMinWidth")}</label>
                    <input
                      type="number"
                      min={1}
                      value={step.conditionConfig?.minWidth ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "minWidth", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionMaxWidth")}</label>
                    <input
                      type="number"
                      min={1}
                      value={step.conditionConfig?.maxWidth ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "maxWidth", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionMinHeight")}</label>
                    <input
                      type="number"
                      min={1}
                      value={step.conditionConfig?.minHeight ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "minHeight", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionMaxHeight")}</label>
                    <input
                      type="number"
                      min={1}
                      value={step.conditionConfig?.maxHeight ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "maxHeight", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("conditionMaxBytes")}</label>
                    <input
                      type="number"
                      min={1}
                      value={step.conditionConfig?.maxBytes ?? ""}
                      disabled={workflowEnabled || pending}
                      onChange={(e) => updateCondition(index, "maxBytes", e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={step.conditionConfig?.metadataApproved === true}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateCondition(index, "metadataApproved", e.target.checked)}
                      />
                      {t("conditionMetadataApproved")}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={step.conditionConfig?.published === true}
                        disabled={workflowEnabled || pending}
                        onChange={(e) => updateCondition(index, "published", e.target.checked)}
                      />
                      {t("conditionPublished")}
                    </label>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {!workflowEnabled && steps.length > 0 ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t("savingSteps") : t("saveSteps")}
        </button>
      ) : null}
    </form>
  );
}
