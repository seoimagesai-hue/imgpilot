/**
 * Prompt 30 — workflow run queries for dashboard UI and public API.
 */
import {and, desc, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  workflowRunSteps,
  workflowRuns,
  type ApiWorkspaceType,
  type WorkflowRun,
  type WorkflowRunStep,
} from "@/db/schema";
import {WorkflowError} from "@/server/workflows/errors";
import {canViewWorkflows} from "@/server/workflows/permissions";

export type WorkflowRunWithSteps = WorkflowRun & {steps: WorkflowRunStep[]};

export async function listWorkflowRuns(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
  limit?: number;
}): Promise<WorkflowRun[]> {
  if (!(await canViewWorkflows(params.actorUserId, params.workspaceType, params.workspaceId))) {
    throw new WorkflowError("WORKFLOW_PERMISSION_DENIED", "You do not have permission to view workflow runs.");
  }

  const db = getDb();
  return db
    .select()
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.workflowId, params.workflowId),
        eq(workflowRuns.workspaceType, params.workspaceType),
        eq(workflowRuns.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(desc(workflowRuns.createdAt))
    .limit(params.limit ?? 50);
}

export async function getWorkflowRunWithSteps(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  runId: string;
}): Promise<WorkflowRunWithSteps> {
  if (!(await canViewWorkflows(params.actorUserId, params.workspaceType, params.workspaceId))) {
    throw new WorkflowError("WORKFLOW_PERMISSION_DENIED", "You do not have permission to view workflow runs.");
  }

  const db = getDb();
  const [run] = await db
    .select()
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.id, params.runId),
        eq(workflowRuns.workspaceType, params.workspaceType),
        eq(workflowRuns.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);
  if (!run) throw new WorkflowError("WORKFLOW_RUN_NOT_FOUND", "Workflow run not found.");

  const steps = await db
    .select()
    .from(workflowRunSteps)
    .where(eq(workflowRunSteps.runId, run.id))
    .orderBy(workflowRunSteps.position);

  return {...run, steps};
}
