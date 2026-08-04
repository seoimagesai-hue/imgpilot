/**
 * Public API v1 — comment threads on review subjects.
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {withApiHandler} from "@/server/api/v1-handlers";
import {
  addComment,
  listThreadWithComments,
} from "@/server/collaboration/comments";
import {CollaborationError} from "@/server/collaboration/errors";
import {isCommentSubjectType} from "@/server/collaboration/policy";
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

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectId = parseProjectId(rawProjectId);
    await requireProjectAccess(principal, projectId, "projects:read");

    const url = new URL(request.url);
    const subjectType = url.searchParams.get("subjectType") ?? "";
    const subjectId = url.searchParams.get("subjectId") ?? "";
    if (!isCommentSubjectType(subjectType) || !subjectId) {
      throw new ApiError("INVALID_REQUEST", "subjectType and subjectId query params are required.");
    }

    try {
      const thread = await listThreadWithComments({
        userId: principal.entitlementUserId,
        projectId,
        subjectType,
        subjectId,
      });
      return successJson({thread}, undefined, 200, principal.requestId);
    } catch (error) {
      if (error instanceof CollaborationError) {
        throw new ApiError("FORBIDDEN", error.message);
      }
      throw error;
    }
  });
}

export async function POST(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectId = parseProjectId(rawProjectId);
    const project = await requireProjectAccess(principal, projectId, "metadata:write");

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }

    const body = raw as Record<string, unknown>;
    const subjectType = String(body.subjectType ?? "").trim();
    const subjectId = String(body.subjectId ?? "").trim();
    const commentBody = String(body.body ?? "");

    if (!isCommentSubjectType(subjectType) || !subjectId || !commentBody) {
      throw new ApiError("INVALID_REQUEST", "subjectType, subjectId, and body are required.");
    }

    try {
      const thread = await addComment({
        userId: principal.entitlementUserId,
        projectId: project.id,
        subjectType,
        subjectId,
        body: commentBody,
      });
      return successJson({thread}, undefined, 201, principal.requestId);
    } catch (error) {
      if (error instanceof CollaborationError) {
        throw new ApiError("INVALID_REQUEST", error.message);
      }
      throw error;
    }
  });
}
