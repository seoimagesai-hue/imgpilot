/**
 * Public API v1 — single project.
 * GET   returns the project.
 * PATCH updates the project (full replace of the editable fields).
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapThrownError, toPublicProject, withApiHandler} from "@/server/api/v1-handlers";
import {updateOwnedProject} from "@/server/projects/queries";
import {projectIdSchema, updateProjectSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

function parseProjectId(raw: string): string {
  const parsed = projectIdSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
  }
  return parsed.data;
}

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectId = parseProjectId(rawProjectId);

    const project = await requireProjectAccess(principal, projectId, "projects:read");
    return successJson(toPublicProject(project), undefined, 200, principal.requestId);
  });
}

export async function PATCH(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectId = parseProjectId(rawProjectId);

    await requireProjectAccess(principal, projectId, "projects:write");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }
    const parsed = updateProjectSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid project payload.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    let updated;
    try {
      updated = await updateOwnedProject(principal.entitlementUserId, projectId, parsed.data);
    } catch (error) {
      throw mapThrownError(error);
    }
    if (!updated) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Project not found.");
    }

    return successJson(toPublicProject(updated), undefined, 200, principal.requestId);
  });
}
