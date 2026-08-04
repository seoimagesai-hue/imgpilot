/**
 * Public API v1 — project activity feed.
 */
import {authenticateApiRequest} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {hasAnyScope} from "@/server/api/scopes";
import {withApiHandler} from "@/server/api/v1-handlers";
import {listProjectActivity} from "@/server/collaboration/activity";
import {CollaborationError} from "@/server/collaboration/errors";
import {getAccessibleProject} from "@/server/organizations/access";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

function parseProjectId(raw: string): string {
  const parsed = projectIdSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
  }
  return parsed.data;
}

async function requireActivityProjectAccess(
  principal: Awaited<ReturnType<typeof authenticateApiRequest>>,
  projectId: string,
) {
  if (!hasAnyScope(principal.scopes, ["projects:read", "analytics:read"])) {
    throw new ApiError(
      "API_KEY_SCOPE_INSUFFICIENT",
      "This API key requires projects:read or analytics:read.",
    );
  }

  const project = await getAccessibleProject(
    principal.entitlementUserId,
    projectId,
    "activity.view",
  );
  if (!project) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Project not found.");
  }

  const boundToWorkspace =
    principal.workspaceType === "personal"
      ? project.workspaceType === "personal" && project.userId === principal.workspaceId
      : project.workspaceType === "organization" &&
        project.organizationId === principal.workspaceId;

  if (!boundToWorkspace) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Project not found.");
  }

  return project;
}

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectId = parseProjectId(rawProjectId);
    await requireActivityProjectAccess(principal, projectId);

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const before = url.searchParams.get("before") ?? url.searchParams.get("cursor") ?? undefined;
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

    try {
      const result = await listProjectActivity({
        userId: principal.entitlementUserId,
        projectId,
        limit: Number.isFinite(limit) ? limit : undefined,
        cursor: before,
      });
      return successJson(result, undefined, 200, principal.requestId);
    } catch (error) {
      if (error instanceof CollaborationError) {
        throw new ApiError("RESOURCE_NOT_FOUND", error.message);
      }
      throw error;
    }
  });
}
