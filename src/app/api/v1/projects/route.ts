/**
 * Public API v1 — projects collection.
 * GET  lists projects accessible to the caller's workspace (cursor-paginated).
 * POST creates a project owned by the caller's workspace.
 */
import {z} from "zod";
import {authenticateApiRequest, requireScope} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {
  decodePageCursor,
  encodePageCursor,
  mapThrownError,
  safeEmitWebhookEvent,
  toPublicProject,
  withApiHandler,
  withIdempotentWrite,
} from "@/server/api/v1-handlers";
import {createOwnedProject, listAccessibleProjectsForUser} from "@/server/projects/queries";
import {createProjectSchema, projectFilterValues} from "@/server/projects/validation";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const listQuerySchema = z.object({
  status: z.enum(projectFilterValues).catch("active"),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).catch(DEFAULT_LIMIT),
  cursor: z.string().trim().min(1).optional(),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    requireScope(principal, "projects:read");

    const url = new URL(request.url);
    const parsedQuery = listQuerySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    if (!parsedQuery.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid query parameters.");
    }
    const {status, limit, cursor} = parsedQuery.data;
    const page = cursor ? decodePageCursor(cursor, principal) : 1;

    // listAccessibleProjectsForUser is keyed off the entitlement (billing-owner)
    // user; scope down to exactly the workspace this API key belongs to.
    const accessible = await listAccessibleProjectsForUser(principal.entitlementUserId, status);
    const scoped = accessible.filter((project) =>
      principal.workspaceType === "personal"
        ? project.workspaceType === "personal" && project.userId === principal.workspaceId
        : project.workspaceType === "organization" &&
          project.organizationId === principal.workspaceId,
    );

    const start = (page - 1) * limit;
    const pageItems = scoped.slice(start, start + limit);
    const nextCursor =
      start + limit < scoped.length ? encodePageCursor(page + 1, principal) : undefined;

    return successJson(
      {items: pageItems.map(toPublicProject)},
      {nextCursor, count: pageItems.length, totalCount: scoped.length},
      200,
      principal.requestId,
    );
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    requireScope(principal, "projects:write");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
    }
    const parsed = createProjectSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid project payload.", {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects",
      requestBody: rawBody,
      run: async () => {
        const organizationId =
          principal.workspaceType === "organization" ? principal.workspaceId : undefined;

        let created;
        try {
          created = await createOwnedProject(principal.entitlementUserId, parsed.data, {
            organizationId,
          });
        } catch (error) {
          throw mapThrownError(error);
        }

        await safeEmitWebhookEvent({
          workspaceType: principal.workspaceType,
          workspaceId: principal.workspaceId,
          eventType: "project.created",
          entityType: "project",
          entityId: created.id,
          payload: toPublicProject(created),
          deduplicationKey: `project.created:${created.id}`,
        });

        return {status: 201, data: toPublicProject(created)};
      },
    });
  });
}
