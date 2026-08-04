import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {getAiMetadataBatchWithItems} from "@/server/images/ai-metadata-batch-service";
import {listBatchReviewRows} from "@/server/images/ai-metadata-batch-review";

const idSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: {params: Promise<{projectId: string; batchId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, batchId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(batchId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const url = new URL(request.url);
  if (url.searchParams.get("view") === "review") {
    const review = await listBatchReviewRows({userId: session.user.id, projectId, batchId});
    if (!review.ok) {
      return Response.json(
        {ok: false, error: review.error},
        {status: review.error === "AI_BATCH_NOT_FOUND" ? 404 : 400},
      );
    }
    return Response.json({ok: true, rows: review.rows});
  }

  const result = await getAiMetadataBatchWithItems({
    userId: session.user.id,
    projectId,
    batchId,
  });
  if (!result.ok) {
    return Response.json(
      {ok: false, error: result.error},
      {status: result.error === "AI_BATCH_NOT_FOUND" ? 404 : 400},
    );
  }
  return Response.json({ok: true, items: result.items});
}
