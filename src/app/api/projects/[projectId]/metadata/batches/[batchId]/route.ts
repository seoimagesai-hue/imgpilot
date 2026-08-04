import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  cancelAiMetadataBatch,
  getAiMetadataBatchWithItems,
  retryFailedAiMetadataBatchItems,
  runAiMetadataBatch,
} from "@/server/images/ai-metadata-batch-service";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
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
  return Response.json({ok: true, batch: result.batch, items: result.items});
}

export async function POST(
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
  const action = url.searchParams.get("action") ?? "run";
  const fn =
    action === "cancel"
      ? cancelAiMetadataBatch
      : action === "retry_failed" || action === "retry-failed"
        ? retryFailedAiMetadataBatchItems
        : runAiMetadataBatch;

  const result = await fn({userId: session.user.id, projectId, batchId});
  if (!result.ok) {
    return Response.json({ok: false, error: result.error}, {status: 400});
  }
  return Response.json({ok: true, batch: result.batch, items: result.items});
}
