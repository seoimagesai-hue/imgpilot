/**
 * Public API v1 — authorize direct-to-storage uploads.
 * Returns short-lived signed upload targets; never returns a storage key.
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {authorizeUploadBodySchema} from "@/server/storage/errors";
import {mapDomainError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import {authorizeProjectUploads} from "@/server/images/upload-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

export async function POST(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    if (!projectIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
    }
    const projectId = projectIdParsed.data;

    await requireProjectAccess(principal, projectId, "images:upload");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }
    const parsed = authorizeUploadBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid upload authorization payload.");
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/uploads/authorize",
      requestBody: rawBody,
      run: async () => {
        const result = await authorizeProjectUploads({
          userId: principal.entitlementUserId,
          projectId,
          files: parsed.data.files,
        });

        if (!result.ok) {
          throw mapDomainError(result.error);
        }

        // Per-file results already omit storageKey — only uploadUrl/headers/expiresAt.
        return {status: 200, data: {results: result.results}};
      },
    });
  });
}
