/**
 * Public API v1 — single image detail. Never returns a storage key.
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {toPublicImage, withApiHandler} from "@/server/api/v1-handlers";
import {getLibraryImageDetail} from "@/server/images/library-queries";
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

    await requireProjectAccess(principal, projectId, "images:read");

    const detail = await getLibraryImageDetail(principal.entitlementUserId, projectId, imageId);
    if (!detail) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Image not found.");
    }

    return successJson(toPublicImage(detail), undefined, 200, principal.requestId);
  });
}
