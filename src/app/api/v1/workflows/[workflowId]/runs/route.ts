/**
 * Public API v1 — list runs for a workflow.
 */
import {z} from "zod";
import {authenticateApiRequest, requireWorkflowAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapThrownError, withApiHandler} from "@/server/api/v1-handlers";
import {toPublicWorkflowRun} from "@/server/workflows/api-dto";
import {listWorkflowRuns} from "@/server/workflows/runs";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{workflowId: string}>};

const workflowIdSchema = z.string().uuid();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).catch(20),
});

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

    await requireWorkflowAccess(principal, workflowId, "workflows:read");

    const url = new URL(request.url);
    const parsedQuery = listQuerySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsedQuery.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid query parameters.");
    }

    let runs;
    try {
      runs = await listWorkflowRuns({
        actorUserId: principal.entitlementUserId,
        workspaceType: principal.workspaceType,
        workspaceId: principal.workspaceId,
        workflowId,
        limit: parsedQuery.data.limit,
      });
    } catch (error) {
      throw mapThrownError(error);
    }

    return successJson(
      {items: runs.map((run) => toPublicWorkflowRun(run))},
      {count: runs.length},
      200,
      principal.requestId,
    );
  });
}
