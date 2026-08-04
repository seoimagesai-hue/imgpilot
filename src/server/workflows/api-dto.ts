/**
 * Prompt 30 — public API shapes for workflows (no internal ids beyond resource ids).
 */
import type {Workflow, WorkflowRun, WorkflowRunStep, WorkflowStep} from "@/db/schema";
import type {WorkflowWithSteps} from "@/server/workflows/definitions";

export function toPublicWorkflowStep(step: WorkflowStep) {
  return {
    position: step.position,
    kind: step.kind,
    actionType: step.actionType,
    config: step.config,
    conditionConfig: step.conditionConfig,
    onFailure: step.onFailure,
  };
}

export function toPublicWorkflow(wf: WorkflowWithSteps | Workflow) {
  const steps = "steps" in wf ? wf.steps.map(toPublicWorkflowStep) : undefined;
  return {
    id: wf.id,
    name: wf.name,
    description: wf.description,
    status: wf.status,
    triggerType: wf.triggerType,
    projectId: wf.projectId,
    scheduleInterval: wf.scheduleInterval,
    definitionVersion: wf.definitionVersion,
    maxRetries: wf.maxRetries,
    stepTimeoutSeconds: wf.stepTimeoutSeconds,
    createdAt: wf.createdAt.toISOString(),
    updatedAt: wf.updatedAt.toISOString(),
    ...(steps ? {steps} : {}),
  };
}

export function toPublicWorkflowRunStep(step: WorkflowRunStep) {
  return {
    position: step.position,
    kind: step.kind,
    actionType: step.actionType,
    status: step.status,
    errorCode: step.errorCode,
    errorMessage: step.errorMessage,
    log: step.log,
    startedAt: step.startedAt?.toISOString() ?? null,
    completedAt: step.completedAt?.toISOString() ?? null,
    durationMs: step.durationMs,
  };
}

export function toPublicWorkflowRun(run: WorkflowRun, steps?: WorkflowRunStep[]) {
  return {
    id: run.id,
    workflowId: run.workflowId,
    projectId: run.projectId,
    imageId: run.imageId,
    triggerType: run.triggerType,
    status: run.status,
    lastErrorCode: run.lastErrorCode,
    lastErrorMessage: run.lastErrorMessage,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    ...(steps ? {steps: steps.map(toPublicWorkflowRunStep)} : {}),
  };
}
