/**
 * Minimal workflow engine stubs — Phase 1 typecheck restore.
 * Full workflow execution remains outside Consumer Redesign Phase 1.
 */
import type {ApiWorkspaceType, WorkflowRun, WorkflowTriggerType} from "@/db/schema";

export async function startRunsForTrigger(_params: {
  triggerType: WorkflowTriggerType;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  projectId?: string | null;
  imageId?: string | null;
  context: unknown;
  actorUserId: string;
  dedupeKey: string;
}): Promise<WorkflowRun[]> {
  return [];
}

export async function resumeWaitingRuns(_params: {
  eventType: string;
  imageId?: string | null;
  projectId?: string | null;
  childJobId: string;
}): Promise<number> {
  return 0;
}

export async function recoverExpiredWorkflowLeases(_params?: {
  limit?: number;
}): Promise<number> {
  return 0;
}

export async function startManualRun(_params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  workflowId: string;
  projectId?: string | null;
  imageId?: string | null;
}): Promise<WorkflowRun> {
  throw new Error("WORKFLOWS_UNAVAILABLE");
}

export async function cancelRun(_params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  runId: string;
}): Promise<WorkflowRun> {
  throw new Error("WORKFLOWS_UNAVAILABLE");
}

export async function retryRun(_params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  runId: string;
}): Promise<WorkflowRun> {
  throw new Error("WORKFLOWS_UNAVAILABLE");
}
