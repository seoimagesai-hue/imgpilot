"use server";

/**
 * Prompt 30 — server actions backing the automation / workflows settings UI.
 */
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import type {ApiWorkspaceType, Workflow, WorkflowRun, WorkflowTriggerType} from "@/db/schema";
import {isAppLocale} from "@/server/auth/validation";
import {getOrganizationBySlug, resolveActiveWorkspace} from "@/server/organizations/workspace";
import {WorkflowError} from "@/server/workflows/errors";
import {
  createWorkflow,
  deleteWorkflow,
  disableWorkflow,
  duplicateWorkflow,
  enableWorkflow,
  getWorkflowWithSteps,
  listWorkflows,
  replaceSteps,
  updateWorkflow,
  type WorkflowStepInput,
  type WorkflowWithSteps,
} from "@/server/workflows/definitions";
import {cancelRun, retryRun, startManualRun} from "@/server/workflows/engine";
import {isScheduleInterval, isWorkflowTriggerType} from "@/server/workflows/policy";

export type WorkflowActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  workflow?: WorkflowWithSteps;
  workflows?: Workflow[];
  run?: WorkflowRun;
};

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

function localeFrom(formData: FormData): string {
  const raw = String(formData.get("locale") ?? "en");
  return isAppLocale(raw) ? raw : "en";
}

function workflowErrorCode(error: unknown): string {
  if (error instanceof WorkflowError) return error.code;
  return "INVALID_REQUEST";
}

async function resolveWorkspaceForAction(
  userId: string,
  formData: FormData,
): Promise<{workspaceType: ApiWorkspaceType; workspaceId: string}> {
  const explicitType = String(formData.get("workspaceType") ?? "").trim();
  const explicitId = String(formData.get("workspaceId") ?? "").trim();
  if (explicitType === "organization" && explicitId) {
    return {workspaceType: "organization", workspaceId: explicitId};
  }
  if (explicitType === "personal") {
    return {workspaceType: "personal", workspaceId: userId};
  }

  const slug = String(formData.get("organizationSlug") ?? "").trim().toLowerCase();
  if (slug) {
    const org = await getOrganizationBySlug(slug);
    if (org && org.status !== "archived") {
      return {workspaceType: "organization", workspaceId: org.id};
    }
  }

  const workspace = await resolveActiveWorkspace(userId);
  return workspace.type === "organization"
    ? {workspaceType: "organization", workspaceId: workspace.id}
    : {workspaceType: "personal", workspaceId: userId};
}

function revalidateAutomationPath(locale: string) {
  revalidatePath(`/${locale}/dashboard/settings/automation`);
}

function parseStepsJson(raw: string): WorkflowStepInput[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new WorkflowError("WORKFLOW_INVALID_STEP", "Steps must be a JSON array.");
  return parsed as WorkflowStepInput[];
}

export async function createWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const triggerTypeRaw = String(formData.get("triggerType") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const scheduleIntervalRaw = String(formData.get("scheduleInterval") ?? "").trim();

  if (!isWorkflowTriggerType(triggerTypeRaw)) {
    return {ok: false, error: "WORKFLOW_INVALID_TRIGGER", fieldErrors: {triggerType: "WORKFLOW_INVALID_TRIGGER"}};
  }

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await createWorkflow({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      name,
      description: description || null,
      triggerType: triggerTypeRaw as WorkflowTriggerType,
      projectId: projectId || null,
      scheduleInterval:
        triggerTypeRaw === "scheduled" && isScheduleInterval(scheduleIntervalRaw) ? scheduleIntervalRaw : null,
    });
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function updateWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();
  const name = formData.has("name") ? String(formData.get("name") ?? "").trim() : undefined;
  const description = formData.has("description") ? String(formData.get("description") ?? "").trim() : undefined;
  const triggerTypeRaw = formData.has("triggerType") ? String(formData.get("triggerType") ?? "").trim() : undefined;
  const projectId = formData.has("projectId") ? String(formData.get("projectId") ?? "").trim() : undefined;
  const scheduleIntervalRaw = formData.has("scheduleInterval")
    ? String(formData.get("scheduleInterval") ?? "").trim()
    : undefined;

  if (triggerTypeRaw && !isWorkflowTriggerType(triggerTypeRaw)) {
    return {ok: false, error: "WORKFLOW_INVALID_TRIGGER"};
  }

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await updateWorkflow({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      workflowId,
      name,
      description: description !== undefined ? description || null : undefined,
      triggerType: triggerTypeRaw as WorkflowTriggerType | undefined,
      projectId: projectId !== undefined ? projectId || null : undefined,
      scheduleInterval:
        scheduleIntervalRaw && isScheduleInterval(scheduleIntervalRaw) ? scheduleIntervalRaw : undefined,
    });
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function replaceWorkflowStepsAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();
  const stepsJson = String(formData.get("stepsJson") ?? "").trim();

  try {
    const steps = parseStepsJson(stepsJson);
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await replaceSteps({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      workflowId,
      steps,
    });
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    if (error instanceof SyntaxError) return {ok: false, error: "INVALID_REQUEST", fieldErrors: {stepsJson: "INVALID_REQUEST"}};
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function listWorkflowsAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const rows = await listWorkflows({actorUserId: user.id, workspaceType, workspaceId});
    return {ok: true, workflows: rows};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function getWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const workflowId = String(formData.get("workflowId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await getWorkflowWithSteps({actorUserId: user.id, workspaceType, workspaceId, workflowId});
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function enableWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await enableWorkflow({actorUserId: user.id, workspaceType, workspaceId, workflowId});
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function disableWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await disableWorkflow({actorUserId: user.id, workspaceType, workspaceId, workflowId});
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function duplicateWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const workflow = await duplicateWorkflow({actorUserId: user.id, workspaceType, workspaceId, workflowId});
    revalidateAutomationPath(locale);
    return {ok: true, workflow};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function deleteWorkflowAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    await deleteWorkflow({actorUserId: user.id, workspaceType, workspaceId, workflowId});
    revalidateAutomationPath(locale);
    return {ok: true};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function runWorkflowManuallyAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const workflowId = String(formData.get("workflowId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const imageId = String(formData.get("imageId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const run = await startManualRun({
      actorUserId: user.id,
      workspaceType,
      workspaceId,
      workflowId,
      projectId: projectId || null,
      imageId: imageId || null,
    });
    revalidateAutomationPath(locale);
    return {ok: true, run};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function cancelWorkflowRunAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const runId = String(formData.get("runId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const run = await cancelRun({actorUserId: user.id, workspaceType, workspaceId, runId});
    revalidateAutomationPath(locale);
    return {ok: true, run};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}

export async function retryWorkflowRunAction(
  _prev: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const user = await requireSessionUser();
  if (!user?.id) return {ok: false, error: "UNAUTHORIZED"};
  const locale = localeFrom(formData);
  const runId = String(formData.get("runId") ?? "").trim();

  try {
    const {workspaceType, workspaceId} = await resolveWorkspaceForAction(user.id, formData);
    const run = await retryRun({actorUserId: user.id, workspaceType, workspaceId, runId});
    revalidateAutomationPath(locale);
    return {ok: true, run};
  } catch (error) {
    return {ok: false, error: workflowErrorCode(error)};
  }
}
