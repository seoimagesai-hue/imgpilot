/**
 * Public API v1 — read an export job. `?download=1` returns a short-lived
 * signed download URL as JSON (never a redirect, never a raw storage key).
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapDomainError, withApiHandler} from "@/server/api/v1-handlers";
import {
  createExportDownloadUrl,
  exportJobToDto,
  getOwnedExportJob,
} from "@/server/images/export-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; exportId: string}>};

const exportIdSchema = z.string().uuid("exportIdInvalid");

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId, exportId: rawExportId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    const exportIdParsed = exportIdSchema.safeParse(rawExportId);
    if (!projectIdParsed.success || !exportIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId and exportId must be valid UUIDs.");
    }
    const projectId = projectIdParsed.data;
    const exportId = exportIdParsed.data;

    await requireProjectAccess(principal, projectId, "exports:read");

    const url = new URL(request.url);
    const wantsDownload = url.searchParams.get("download") === "1";

    if (wantsDownload) {
      const result = await createExportDownloadUrl({
        userId: principal.entitlementUserId,
        projectId,
        exportId,
      });
      if (!result.ok) {
        throw mapDomainError(result.error);
      }
      return successJson(
        {
          url: result.url,
          expiresInSeconds: result.expiresInSeconds,
          contentType: result.contentType,
        },
        undefined,
        200,
        principal.requestId,
      );
    }

    const job = await getOwnedExportJob(principal.entitlementUserId, projectId, exportId);
    if (!job) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Export job not found.");
    }

    return successJson(exportJobToDto(job), undefined, 200, principal.requestId);
  });
}
