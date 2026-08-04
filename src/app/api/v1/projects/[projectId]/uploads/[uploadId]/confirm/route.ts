/**
 * Public API v1 — confirm a direct-to-storage upload finished successfully.
 * `uploadId` is the image id returned from the authorize step.
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {
  mapDomainError,
  safeEmitWebhookEvent,
  withApiHandler,
  withIdempotentWrite,
} from "@/server/api/v1-handlers";
import {confirmProjectUpload} from "@/server/images/upload-service";
import {imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; uploadId: string}>};

export async function POST(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId, uploadId: rawUploadId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    const uploadIdParsed = imageIdSchema.safeParse(rawUploadId);
    if (!projectIdParsed.success || !uploadIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId and uploadId must be valid UUIDs.");
    }
    const projectId = projectIdParsed.data;
    const imageId = uploadIdParsed.data;

    await requireProjectAccess(principal, projectId, "images:upload");

    // No request body is required to confirm — fingerprint on the target ids.
    const requestBody = {projectId, imageId};

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/uploads/:uploadId/confirm",
      requestBody,
      run: async () => {
        const result = await confirmProjectUpload({
          userId: principal.entitlementUserId,
          projectId,
          imageId,
        });

        if (!result.ok) {
          throw mapDomainError(result.error);
        }

        await safeEmitWebhookEvent({
          workspaceType: principal.workspaceType,
          workspaceId: principal.workspaceId,
          eventType: "image.uploaded",
          entityType: "image",
          entityId: result.imageId,
          payload: {imageId: result.imageId, projectId, status: result.status},
          deduplicationKey: `image.uploaded:${result.imageId}`,
        });

        return {
          status: 200,
          data: {imageId: result.imageId, status: result.status, idempotent: Boolean(result.idempotent)},
        };
      },
    });
  });
}
