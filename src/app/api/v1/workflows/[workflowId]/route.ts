/**
 * Public API v1 — single workflow.
 * GET    returns the workflow with steps.
 * PATCH  updates workflow metadata (must be disabled).
 * DELETE removes the workflow.
 */
import {z} from "zod";
import {authenticateApiRequest, requireWorkflowAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapThrownError, withApiHandler} from "@/server/api/v1-handlers";
import type {WorkflowTriggerType} from "@/db/schema";
import {toPublicWorkflow} from "@/server/workflows/api-dto";
import {deleteWorkflow, updateWorkflow} from "@/server/workflows/definitions";
import {isScheduleInterval, isWorkflowTriggerType, WORKFLOW_TRIGGER_TYPES} from "@/server/workflows/policy";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{workflowId: string}>};

const workflowIdSchema = z.string().uuid();

const updateWorkflowBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    triggerType: z.enum(WORKFLOW_TRIGGER_TYPES as unknown as [string, ...string[]]).optional(),
    projectId: z.string().uuid().optional().nullable(),
    scheduleInterval: z.enum(["hourly", "daily", "weekly"]).optional().nullable(),
  })
  .refine((body) => Object.keys(body).length > 0, {message: "At least one field is required."});

function parseWorkflowId(raw: string): string {
  const parsed = workflowIdSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("INVALID_REQUEST", "workflowId must be a valid UUID.");
  }
  return parsed.data;
}

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {workflowId: rawWorkflowId} = await params;
    const workflowId = parseWorkflowId(rawWorkflowId);

    const workflow = await requireWorkflowAccess(principal, workflowId, "workflows:read");
    return successJson(toPublicWorkflow(workflow), undefined, 200, principal.requestId);
  });
}

export async function PATCH(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {workflowId: rawWorkflowId} = await params;
    const workflowId = parseWorkflowId(rawWorkflowId);

    await requireWorkflowAccess(principal, workflowId, "workflows:write");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }

    const parsed = updateWorkflowBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid workflow payload.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (parsed.data.triggerType && !isWorkflowTriggerType(parsed.data.triggerType)) {
      throw new ApiError("INVALID_REQUEST", "Invalid trigger type.");
    }

    const scheduleInterval =
      parsed.data.scheduleInterval && isScheduleInterval(parsed.data.scheduleInterval)
        ? parsed.data.scheduleInterval
        : parsed.data.scheduleInterval === null
          ? null
          : undefined;

    let updated;
    try {
      updated = await updateWorkflow({
        actorUserId: principal.entitlementUserId,
        workspaceType: principal.workspaceType,
        workspaceId: principal.workspaceId,
        workflowId,
        name: parsed.data.name,
        description: parsed.data.description,
        triggerType: parsed.data.triggerType as WorkflowTriggerType | undefined,
        projectId: parsed.data.projectId,
        scheduleInterval,
      });
    } catch (error) {
      throw mapThrownError(error);
    }

    return successJson(toPublicWorkflow(updated), undefined, 200, principal.requestId);
  });
}

export async function DELETE(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {workflowId: rawWorkflowId} = await params;
    const workflowId = parseWorkflowId(rawWorkflowId);

    await requireWorkflowAccess(principal, workflowId, "workflows:write");

    try {
      await deleteWorkflow({
        actorUserId: principal.entitlementUserId,
        workspaceType: principal.workspaceType,
        workspaceId: principal.workspaceId,
        workflowId,
      });
    } catch (error) {
      throw mapThrownError(error);
    }

    return successJson({deleted: true, workflowId}, undefined, 200, principal.requestId);
  });
}
