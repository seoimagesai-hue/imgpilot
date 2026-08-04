/**
 * Public API v1 — create a processing job for an image (optimize/resize/convert).
 * Execution happens asynchronously via the existing worker — responds 202.
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {mapDomainError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import {CONVERT_OPERATION} from "@/server/images/conversion-policy";
import {imageIdSchema} from "@/server/images/validation";
import {PROCESSING_OPERATION} from "@/server/images/processing-policy";
import {createProcessingJob} from "@/server/images/processing-service";
import {RESIZE_OPERATION} from "@/server/images/resize-policy";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; imageId: string}>};

const createProcessingJobBodySchema = z.object({
  operation: z.enum([PROCESSING_OPERATION, RESIZE_OPERATION, CONVERT_OPERATION]).optional(),
  preset: z.string().trim().min(1).max(64).nullable().optional(),
});

export async function POST(request: Request, {params}: RouteContext) {
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

    await requireProjectAccess(principal, projectId, "images:process");

    let rawBody: unknown = {};
    const rawText = await request.text();
    if (rawText.trim().length > 0) {
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
      }
    }
    const parsed = createProcessingJobBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid processing job payload.");
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/images/:imageId/processing-jobs",
      requestBody: rawBody,
      run: async (idempotencyKey) => {
        const result = await createProcessingJob({
          userId: principal.entitlementUserId,
          projectId,
          imageId,
          operation: parsed.data.operation,
          preset: parsed.data.preset,
          idempotencyKey,
        });

        if (!result.ok) {
          throw mapDomainError(result.error);
        }

        return {status: 202, data: result.job};
      },
    });
  });
}
