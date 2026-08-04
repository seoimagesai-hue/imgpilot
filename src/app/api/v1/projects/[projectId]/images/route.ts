/**
 * Public API v1 — project image library listing (cursor-paginated wrapper
 * around the existing page/pageSize library query).
 */
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {
  decodePageCursor,
  encodePageCursor,
  toPublicImage,
  withApiHandler,
} from "@/server/api/v1-handlers";
import {listLibraryImagesForOwnedProject} from "@/server/images/library-queries";
import {parseLibraryQuery} from "@/server/images/library-query";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    if (!projectIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
    }
    const projectId = projectIdParsed.data;

    await requireProjectAccess(principal, projectId, "images:read");

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const query = parseLibraryQuery({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      view: url.searchParams.get("view") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (cursor) {
      query.page = decodePageCursor(cursor, principal);
    }

    const result = await listLibraryImagesForOwnedProject(
      principal.entitlementUserId,
      projectId,
      query,
    );

    const nextCursor =
      result.page < result.totalPages ? encodePageCursor(result.page + 1, principal) : undefined;

    return successJson(
      {items: result.items.map(toPublicImage)},
      {
        nextCursor,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      },
      200,
      principal.requestId,
    );
  });
}
