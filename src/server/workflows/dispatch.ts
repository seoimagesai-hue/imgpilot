/**
 * Prompt 30 — domain event dispatch into workflow triggers + waiting resume.
 */
import type {ApiWorkspaceType} from "@/db/schema";
import {WorkflowError} from "@/server/workflows/errors";
import {startRunsForTrigger, resumeWaitingRuns} from "@/server/workflows/engine";
import {mapDomainEventToTrigger, type WorkflowRunContext} from "@/server/workflows/policy";

export type DomainEventInput = {
  eventType: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  projectId?: string | null;
  imageId?: string | null;
  entityId: string;
  payload: Record<string, unknown>;
  actorUserId?: string | null;
  deduplicationKey?: string | null;
};

export type DomainEventResult = {
  triggerType: string | null;
  runsStarted: number;
  runsResumed: number;
};

function systemActorId(workspaceType: ApiWorkspaceType, workspaceId: string, actorUserId?: string | null): string {
  if (actorUserId) return actorUserId;
  return workspaceType === "personal" ? workspaceId : workspaceId;
}

export async function onDomainEvent(input: DomainEventInput): Promise<DomainEventResult> {
  const trigger = mapDomainEventToTrigger(input.eventType);
  let runsStarted = 0;

  if (trigger) {
    const context: WorkflowRunContext = {
      ...(input.payload as WorkflowRunContext),
      projectId: input.projectId,
      imageId: input.imageId,
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
    };
    const runs = await startRunsForTrigger({
      triggerType: trigger,
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      imageId: input.imageId,
      context,
      actorUserId: systemActorId(input.workspaceType, input.workspaceId, input.actorUserId),
      dedupeKey: input.deduplicationKey ?? `${input.eventType}:${input.entityId}`,
    });
    runsStarted = runs.length;
  }

  const runsResumed = await resumeWaitingRuns({
    eventType: input.eventType,
    imageId: input.imageId,
    projectId: input.projectId,
    childJobId: input.entityId,
  });

  return {triggerType: trigger, runsStarted, runsResumed};
}

/** Best-effort wrapper — callers must not fail their primary operation on workflow errors. */
export async function safeInvokeDomainEvent(input: DomainEventInput): Promise<DomainEventResult | null> {
  try {
    return await onDomainEvent(input);
  } catch (error) {
    const code = error instanceof WorkflowError ? error.code : "UNKNOWN";
    console.error("[workflows] domain event dispatch failed", code, input.eventType, input.entityId);
    return null;
  }
}
