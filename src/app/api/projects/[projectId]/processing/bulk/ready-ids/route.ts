import {auth} from "@/auth";
import {projectIdSchema} from "@/server/projects/validation";
import {listFilteredReadyImageIds} from "@/server/images/library-queries";
import {parseLibraryQuery} from "@/server/images/library-query";
import {BULK_MAX_IMAGES} from "@/server/images/bulk-policy";

export async function GET(
  request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const url = new URL(request.url);
  const libraryQuery = parseLibraryQuery({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });

  const imageIds = await listFilteredReadyImageIds(
    session.user.id,
    projectId,
    libraryQuery,
    BULK_MAX_IMAGES,
  );

  return Response.json({ok: true, imageIds, maxImages: BULK_MAX_IMAGES});
}
