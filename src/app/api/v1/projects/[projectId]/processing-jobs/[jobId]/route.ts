/**
 * Public API v1 — read a processing job's status. Allowed with either
 * `images:process` (the scope that created it) or `images:read`.
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {hasAnyScope, hasScope} from "@/server/api/scopes";
import {mapDomainError, withApiHandler} from "@/server/api/v1-handlers";
import {getProcessingJob} from "@/server/images/processing-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string; jobId: string}>};

const jobIdSchema = z.string().uuid("jobIdInvalid");

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    if (!hasAnyScope(principal.scopes, ["images:read", "images:process"])) {
      throw new ApiError(
        "API_KEY_SCOPE_INSUFFICIENT",
        "This API key is missing the required scope: images:read or images:process.",
      );
    }

    const {projectId: rawProjectId, jobId: rawJobId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    const jobIdParsed = jobIdSchema.safeParse(rawJobId);
    if (!projectIdParsed.success || !jobIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId and jobId must be valid UUIDs.");
    }
    const projectId = projectIdParsed.data;
    const jobId = jobIdParsed.data;

    // Prefer the read scope's (weaker) permission when both are present.
    const scope = hasScope(principal.scopes, "images:read") ? "images:read" : "images:process";
    await requireProjectAccess(principal, projectId, scope);

    const result = await getProcessingJob({userId: principal.entitlementUserId, projectId, jobId});
    if (!result.ok) {
      throw mapDomainError(result.error);
    }

    return successJson(result.job, undefined, 200, principal.requestId);
  });
}
