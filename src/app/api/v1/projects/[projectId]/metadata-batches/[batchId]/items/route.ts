/**
 * Public API v1 — list items for an AI metadata batch.
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapDomainError, withApiHandler} from "@/server/api/v1-handlers";
import {getAiMetadataBatchWithItems} from "@/server/images/ai-metadata-batch-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; batchId: string}>};

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId, batchId: rawBatchId} = await params;
    if (!projectIdSchema.safeParse(rawProjectId).success || !z.string().uuid().safeParse(rawBatchId).success) {
      throw new ApiError("INVALID_REQUEST", "projectId and batchId must be valid UUIDs.");
    }
    await requireProjectAccess(principal, rawProjectId, "metadata:generate");
    const result = await getAiMetadataBatchWithItems({
      userId: principal.entitlementUserId,
      projectId: rawProjectId,
      batchId: rawBatchId,
    });
    if (!result.ok) throw mapDomainError(result.error);
    return successJson({items: result.items}, undefined, 200, principal.requestId);
  });
}
