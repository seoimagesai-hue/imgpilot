/**
 * Public API v1 — create an AI metadata generation job for an image.
 * Execution happens asynchronously via the existing worker — responds 202.
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {mapDomainError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import {createMetadataGeneration} from "@/server/images/ai-metadata-service";
import {imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; imageId: string}>};

const createMetadataGenerationBodySchema = z.object({
  language: z.string().trim().min(2).max(10).optional(),
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

    await requireProjectAccess(principal, projectId, "metadata:generate");

    let rawBody: unknown = {};
    const rawText = await request.text();
    if (rawText.trim().length > 0) {
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
      }
    }
    const parsed = createMetadataGenerationBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid metadata generation payload.");
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/images/:imageId/metadata-generations",
      requestBody: rawBody,
      run: async (idempotencyKey) => {
        const result = await createMetadataGeneration({
          userId: principal.entitlementUserId,
          projectId,
          imageId,
          language: parsed.data.language,
          idempotencyKey,
        });

        if (!result.ok) {
          throw mapDomainError(result.error);
        }

        return {status: 202, data: result.generation};
      },
    });
  });
}
