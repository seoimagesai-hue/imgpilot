/**
 * Prompt 30 — workflow definition CRUD (workflows + steps).
 * Server-owned status; never trust browser for run state.
 */
import {and, asc, count, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  workflowRuns,
  workflowSteps,
  workflows,
  type ApiWorkspaceType,
  type Workflow,
  type WorkflowActionType,
  type WorkflowOnFailure,
  type WorkflowStep,
  type WorkflowStepKind,
  type WorkflowTriggerType,
} from "@/db/schema";
import {resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {WorkflowError} from "@/server/workflows/errors";
import {
  assertActionConfig,
  isScheduleInterval,
  isWorkflowActionType,
  isWorkflowTriggerType,
  nextScheduleDate,
  WORKFLOW_MAX_STEPS,
  WORKFLOW_NAME_MAX,
  type ConditionConfig,
  type ScheduleInterval,
} from "@/server/workflows/policy";
import {canManageWorkflows, canViewWorkflows} from "@/server/workflows/permissions";

export type WorkflowStepInput = {
  position: number;
  kind: WorkflowStepKind;
  actionType?: WorkflowActionType | null;
  config?: Record<string, unknown> | null;
  conditionConfig?: ConditionConfig | null;
  onFailure?: WorkflowOnFailure;
};

export type WorkflowWithSteps = Workflow & {steps: WorkflowStep[]};

async function requireManage(
  actorUserId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  if (!(await canManageWorkflows(actorUserId, workspaceType, workspaceId))) {
    throw new WorkflowError("WORKFLOW_PERMISSION_DENIED", "You do not have permission to manage workflows.");
  }
}

async function requireView(
  actorUserId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  if (!(await canViewWorkflows(actorUserId, workspaceType, workspaceId))) {
    throw new WorkflowError("WORKFLOW_PERMISSION_DENIED", "You do not have permission to view workflows.");
  }
}

async function assertWorkflowEntitlement(workspaceType: ApiWorkspaceType, workspaceId: string) {
  const entitlementUserId = await resolveWorkspaceEntitlementUserId(workspaceType, workspaceId);
  if (!entitlementUserId) {
    throw new WorkflowError("INVALID_REQUEST", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.workflowsEnabled) {
    throw new WorkflowError("WORKFLOWS_NOT_ENABLED", "This plan does not include workflow automation.");
  }
  if (!entitlement.writesAllowed) {
    throw new WorkflowError("WORKFLOW_PERMISSION_DENIED", "Writes are currently restricted for this subscription.");
  }
  return {entitlementUserId, entitlement};
}

async function countWorkspaceWorkflows(workspaceType: ApiWorkspaceType, workspaceId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({total: count()})
    .from(workflows)
    .where(and(eq(workflows.workspaceType, workspaceType), eq(workflows.workspaceId, workspaceId)));
  return Number(row?.total ?? 0);
}

async function getWorkflowRow(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  workflowId: string,
): Promise<Workflow> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.id, workflowId),
        eq(workflows.workspaceType, workspaceType),
        eq(workflows.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) throw new WorkflowError("WORKFLOW_NOT_FOUND", "Workflow not found.");
  return row;
}

function validateTrigger(triggerType: string, scheduleInterval?: string | null) {
  if (!isWorkflowTriggerType(triggerType)) {
    throw new WorkflowError("WORKFLOW_INVALID_TRIGGER", "Invalid workflow trigger type.");
  }
  if (triggerType === "scheduled") {
    if (!scheduleInterval || !isScheduleInterval(scheduleInterval)) {
      throw new WorkflowError("WORKFLOW_SCHEDULE_INVALID", "Scheduled workflows require hourly, daily, or weekly interval.");
    }
  }
}

function validateSteps(steps: WorkflowStepInput[]) {
  if (steps.length === 0) {
    throw new WorkflowError("WORKFLOW_INVALID_STEP", "At least one step is required.");
  }
  if (steps.length > WORKFLOW_MAX_STEPS) {
    throw new WorkflowError("WORKFLOW_INVALID_STEP", `Workflows may have at most ${WORKFLOW_MAX_STEPS} steps.`);
  }
  const positions = new Set<number>();
  for (const step of steps) {
    if (positions.has(step.position)) {
      throw new WorkflowError("WORKFLOW_INVALID_STEP", "Duplicate step positions are not allowed.");
    }
    positions.add(step.position);
    if (step.kind === "action") {
      if (!step.actionType || !isWorkflowActionType(step.actionType)) {
        throw new WorkflowError("WORKFLOW_INVALID_ACTION", "Action steps require a valid action type.");
      }
      assertActionConfig(step.actionType, step.config ?? undefined);
    } else if (step.kind === "condition") {
      if (!step.conditionConfig || Object.keys(step.conditionConfig).length === 0) {
        throw new WorkflowError("WORKFLOW_INVALID_CONDITION", "Condition steps require at least one filter.");
      }
    } else {
      throw new WorkflowError("WORKFLOW_INVALID_STEP", "Invalid step kind.");
    }
  }
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > WORKFLOW_NAME_MAX) {
    throw new WorkflowError("INVALID_REQUEST", `Name must be 1-${WORKFLOW_NAME_MAX} characters.`);
  }
  return trimmed;
}

async function loadSteps(workflowId: string): Promise<WorkflowStep[]> {
  const db = getDb();
  return db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.workflowId, workflowId))
    .orderBy(asc(workflowSteps.position));
}

export async function createWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  description?: string | null;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown> | null;
  projectId?: string | null;
  scheduleInterval?: ScheduleInterval | null;
  maxRetries?: number;
  stepTimeoutSeconds?: number;
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  const {entitlement} = await assertWorkflowEntitlement(params.workspaceType, params.workspaceId);
  const occupied = await countWorkspaceWorkflows(params.workspaceType, params.workspaceId);
  if (occupied >= entitlement.plan.maxWorkflows) {
    throw new WorkflowError(
      "WORKFLOW_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxWorkflows} workflows.`,
    );
  }

  validateTrigger(params.triggerType, params.scheduleInterval ?? null);
  const name = normalizeName(params.name);
  const db = getDb();
  const [row] = await db
    .insert(workflows)
    .values({
      workspaceType: params.workspaceType,
      workspaceId: params.workspaceId,
      createdByUserId: params.actorUserId,
      name,
      description: params.description?.trim() || null,
      status: "draft",
      triggerType: params.triggerType,
      triggerConfig: params.triggerConfig ?? null,
      projectId: params.projectId ?? null,
      scheduleInterval: params.triggerType === "scheduled" ? params.scheduleInterval ?? null : null,
      maxRetries: params.maxRetries ?? 3,
      stepTimeoutSeconds: params.stepTimeoutSeconds ?? 3600,
    })
    .returning();
  if (!row) throw new WorkflowError("INVALID_REQUEST", "Failed to create workflow.");

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.created",
    targetEntityType: "workflow",
    targetEntityId: row.id,
    afterSummary: `name=${name} trigger=${params.triggerType}`,
  });

  return {...row, steps: []};
}

export async function updateWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
  name?: string;
  description?: string | null;
  triggerType?: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown> | null;
  projectId?: string | null;
  scheduleInterval?: ScheduleInterval | null;
  maxRetries?: number;
  stepTimeoutSeconds?: number;
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  await assertWorkflowEntitlement(params.workspaceType, params.workspaceId);
  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  if (existing.status === "enabled") {
    throw new WorkflowError("WORKFLOW_RUN_CONFLICT", "Disable the workflow before editing its definition.");
  }

  const triggerType = params.triggerType ?? existing.triggerType;
  const scheduleInterval =
    params.scheduleInterval !== undefined
      ? params.scheduleInterval
      : existing.scheduleInterval;
  validateTrigger(triggerType, scheduleInterval);

  const db = getDb();
  const [updated] = await db
    .update(workflows)
    .set({
      name: params.name != null ? normalizeName(params.name) : existing.name,
      description: params.description !== undefined ? params.description?.trim() || null : existing.description,
      triggerType,
      triggerConfig: params.triggerConfig !== undefined ? params.triggerConfig : existing.triggerConfig,
      projectId: params.projectId !== undefined ? params.projectId : existing.projectId,
      scheduleInterval: triggerType === "scheduled" ? scheduleInterval : null,
      maxRetries: params.maxRetries ?? existing.maxRetries,
      stepTimeoutSeconds: params.stepTimeoutSeconds ?? existing.stepTimeoutSeconds,
      definitionVersion: existing.definitionVersion + 1,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, existing.id))
    .returning();
  if (!updated) throw new WorkflowError("INVALID_REQUEST", "Failed to update workflow.");

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.updated",
    targetEntityType: "workflow",
    targetEntityId: updated.id,
  });

  const steps = await loadSteps(updated.id);
  return {...updated, steps};
}

export async function replaceSteps(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
  steps: WorkflowStepInput[];
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  await assertWorkflowEntitlement(params.workspaceType, params.workspaceId);
  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  if (existing.status === "enabled") {
    throw new WorkflowError("WORKFLOW_RUN_CONFLICT", "Disable the workflow before replacing steps.");
  }
  validateSteps(params.steps);

  const db = getDb();
  await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, existing.id));
  if (params.steps.length > 0) {
    await db.insert(workflowSteps).values(
      params.steps.map((step) => ({
        workflowId: existing.id,
        position: step.position,
        kind: step.kind,
        actionType: step.kind === "action" ? step.actionType! : null,
        config: step.config ?? null,
        conditionConfig: step.kind === "condition" ? step.conditionConfig ?? null : null,
        onFailure: step.onFailure ?? "fail",
      })),
    );
  }

  const [updated] = await db
    .update(workflows)
    .set({definitionVersion: existing.definitionVersion + 1, updatedAt: new Date()})
    .where(eq(workflows.id, existing.id))
    .returning();
  if (!updated) throw new WorkflowError("INVALID_REQUEST", "Failed to update workflow steps.");

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.updated",
    targetEntityType: "workflow",
    targetEntityId: updated.id,
    afterSummary: `steps=${params.steps.length}`,
  });

  const steps = await loadSteps(updated.id);
  return {...updated, steps};
}

export async function listWorkflows(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<Workflow[]> {
  await requireView(params.actorUserId, params.workspaceType, params.workspaceId);
  const db = getDb();
  return db
    .select()
    .from(workflows)
    .where(and(eq(workflows.workspaceType, params.workspaceType), eq(workflows.workspaceId, params.workspaceId)))
    .orderBy(asc(workflows.name));
}

export async function getWorkflowWithSteps(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
}): Promise<WorkflowWithSteps> {
  await requireView(params.actorUserId, params.workspaceType, params.workspaceId);
  const row = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  const steps = await loadSteps(row.id);
  return {...row, steps};
}

export async function enableWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  await assertWorkflowEntitlement(params.workspaceType, params.workspaceId);
  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  const steps = await loadSteps(existing.id);
  if (steps.length === 0) {
    throw new WorkflowError("WORKFLOW_INVALID_STEP", "Cannot enable a workflow without steps.");
  }

  validateTrigger(existing.triggerType, existing.scheduleInterval);
  const now = new Date();
  let nextScheduledAt: Date | null = null;
  if (existing.triggerType === "scheduled") {
    const interval = existing.scheduleInterval;
    if (!interval || !isScheduleInterval(interval)) {
      throw new WorkflowError("WORKFLOW_SCHEDULE_INVALID", "Scheduled workflows require a valid interval.");
    }
    nextScheduledAt = nextScheduleDate(interval, now);
  }

  const db = getDb();
  const [updated] = await db
    .update(workflows)
    .set({
      status: "enabled",
      enabledAt: now,
      disabledAt: null,
      nextScheduledAt,
      updatedAt: now,
    })
    .where(eq(workflows.id, existing.id))
    .returning();
  if (!updated) throw new WorkflowError("INVALID_REQUEST", "Failed to enable workflow.");

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.enabled",
    targetEntityType: "workflow",
    targetEntityId: updated.id,
  });

  return {...updated, steps};
}

export async function disableWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(workflows)
    .set({status: "disabled", disabledAt: now, nextScheduledAt: null, updatedAt: now})
    .where(eq(workflows.id, existing.id))
    .returning();
  if (!updated) throw new WorkflowError("INVALID_REQUEST", "Failed to disable workflow.");

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.disabled",
    targetEntityType: "workflow",
    targetEntityId: updated.id,
  });

  const steps = await loadSteps(updated.id);
  return {...updated, steps};
}

export async function duplicateWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
}): Promise<WorkflowWithSteps> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  const {entitlement} = await assertWorkflowEntitlement(params.workspaceType, params.workspaceId);
  const occupied = await countWorkspaceWorkflows(params.workspaceType, params.workspaceId);
  if (occupied >= entitlement.plan.maxWorkflows) {
    throw new WorkflowError("WORKFLOW_LIMIT_REACHED", "Workflow limit reached for this workspace.");
  }

  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  const sourceSteps = await loadSteps(existing.id);
  const db = getDb();
  const copyName = normalizeName(`${existing.name.slice(0, WORKFLOW_NAME_MAX - 8)} (copy)`);

  const [copy] = await db
    .insert(workflows)
    .values({
      workspaceType: existing.workspaceType,
      workspaceId: existing.workspaceId,
      createdByUserId: params.actorUserId,
      name: copyName,
      description: existing.description,
      status: "draft",
      triggerType: existing.triggerType,
      triggerConfig: existing.triggerConfig,
      projectId: existing.projectId,
      scheduleInterval: existing.scheduleInterval,
      maxRetries: existing.maxRetries,
      stepTimeoutSeconds: existing.stepTimeoutSeconds,
    })
    .returning();
  if (!copy) throw new WorkflowError("INVALID_REQUEST", "Failed to duplicate workflow.");

  if (sourceSteps.length > 0) {
    await db.insert(workflowSteps).values(
      sourceSteps.map((step) => ({
        workflowId: copy.id,
        position: step.position,
        kind: step.kind,
        actionType: step.actionType,
        config: step.config,
        conditionConfig: step.conditionConfig,
        onFailure: step.onFailure,
      })),
    );
  }

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.duplicated",
    targetEntityType: "workflow",
    targetEntityId: copy.id,
    afterSummary: `source=${existing.id}`,
  });

  const steps = await loadSteps(copy.id);
  return {...copy, steps};
}

export async function deleteWorkflow(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
}): Promise<void> {
  await requireManage(params.actorUserId, params.workspaceType, params.workspaceId);
  const existing = await getWorkflowRow(params.workspaceType, params.workspaceId, params.workflowId);
  const db = getDb();

  const [activeRun] = await db
    .select({id: workflowRuns.id})
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.workflowId, existing.id),
        inArray(workflowRuns.status, ["queued", "leased", "running", "waiting"]),
      ),
    )
    .limit(1);
  if (activeRun) {
    throw new WorkflowError("WORKFLOW_RUN_CONFLICT", "Cannot delete a workflow with an active run.");
  }

  await db.delete(workflows).where(eq(workflows.id, existing.id));

  await writeIntegrationAudit({
    workspaceType: params.workspaceType,
    workspaceId: params.workspaceId,
    actorUserId: params.actorUserId,
    action: "workflow.deleted",
    targetEntityType: "workflow",
    targetEntityId: existing.id,
    beforeSummary: existing.name,
  });
}

/** Internal helper — load definition steps for engine (no permission gate). */
export async function getWorkflowDefinitionSteps(workflowId: string): Promise<WorkflowStep[]> {
  return loadSteps(workflowId);
}

/** Cancel pending run steps when deleting is not needed — exported for engine. */
export {getWorkflowRow as getWorkflowForEngine};
