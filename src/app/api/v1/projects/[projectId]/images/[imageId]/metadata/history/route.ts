/**
 * Public API v1 — metadata generation history for an image (most recent 20).
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {withApiHandler} from "@/server/api/v1-handlers";
import {listMetadataGenerations} from "@/server/images/ai-metadata-service";
import {imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; imageId: string}>};

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId, imageId: rawImageId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    const imageIdParsed = imageIdSchema.safeParse(rawImageId);
    if (!projectIdParsed.success || !imageIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId and imageId must be valid UUIDs.");
    }
    const projectId = projectIdParsed.data;
    const imageId = imageIdParsed.data;

    await requireProjectAccess(principal, projectId, "metadata:read");

    const generations = await listMetadataGenerations({
      userId: principal.entitlementUserId,
      projectId,
      imageId,
    });

    return successJson(
      {items: generations},
      {count: generations.length},
      200,
      principal.requestId,
    );
  });
}
