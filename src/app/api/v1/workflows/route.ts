/**
 * Public API v1 — workflows collection.
 * GET  lists workflows for the caller's workspace.
 * POST creates a workflow (draft).
 */
import {z} from "zod";
import {authenticateApiRequest, requireScope} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapThrownError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import type {WorkflowTriggerType} from "@/db/schema";
import {toPublicWorkflow} from "@/server/workflows/api-dto";
import {createWorkflow, listWorkflows} from "@/server/workflows/definitions";
import {isScheduleInterval, isWorkflowTriggerType, WORKFLOW_TRIGGER_TYPES} from "@/server/workflows/policy";

export const runtime = "nodejs";

const createWorkflowBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  triggerType: z.enum(WORKFLOW_TRIGGER_TYPES as unknown as [string, ...string[]]),
  projectId: z.string().uuid().optional().nullable(),
  scheduleInterval: z.enum(["hourly", "daily", "weekly"]).optional().nullable(),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    requireScope(principal, "workflows:read");

    let rows;
    try {
      rows = await listWorkflows({
        actorUserId: principal.entitlementUserId,
        workspaceType: principal.workspaceType,
        workspaceId: principal.workspaceId,
      });
    } catch (error) {
      throw mapThrownError(error);
    }

    return successJson(
      {items: rows.map((row) => toPublicWorkflow(row))},
      {count: rows.length},
      200,
      principal.requestId,
    );
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    requireScope(principal, "workflows:write");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }

    const parsed = createWorkflowBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid workflow payload.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (!isWorkflowTriggerType(parsed.data.triggerType)) {
      throw new ApiError("INVALID_REQUEST", "Invalid trigger type.");
    }

    const scheduleInterval =
      parsed.data.triggerType === "scheduled" && parsed.data.scheduleInterval && isScheduleInterval(parsed.data.scheduleInterval)
        ? parsed.data.scheduleInterval
        : null;

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/workflows",
      requestBody: rawBody,
      run: async () => {
        let created;
        try {
          created = await createWorkflow({
            actorUserId: principal.entitlementUserId,
            workspaceType: principal.workspaceType,
            workspaceId: principal.workspaceId,
            name: parsed.data.name,
            description: parsed.data.description ?? null,
            triggerType: parsed.data.triggerType as WorkflowTriggerType,
            projectId: parsed.data.projectId ?? null,
            scheduleInterval,
          });
        } catch (error) {
          throw mapThrownError(error);
        }

        return {status: 201, data: toPublicWorkflow(created)};
      },
    });
  });
}
