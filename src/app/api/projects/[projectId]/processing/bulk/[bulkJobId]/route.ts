import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  cancelBulkJob,
  getBulkJob,
  retryFailedBulkItems,
  runBulkJob,
} from "@/server/images/bulk-service";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string; bulkJobId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, bulkJobId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(bulkJobId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const result = await getBulkJob({
    userId: session.user.id,
    projectId,
    bulkJobId,
  });
  if (!result.ok) {
    return Response.json(
      {ok: false, error: result.error},
      {status: result.error === "BULK_JOB_NOT_FOUND" ? 404 : 400},
    );
  }
  return Response.json({ok: true, job: result.job, items: result.items});
}

export async function POST(
  request: Request,
  context: {params: Promise<{projectId: string; bulkJobId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, bulkJobId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(bulkJobId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "run";

  const fn =
    action === "cancel"
      ? cancelBulkJob
      : action === "retry_failed"
        ? retryFailedBulkItems
        : runBulkJob;

  const result = await fn({
    userId: session.user.id,
    projectId,
    bulkJobId,
  });

  if (!result.ok) {
    return Response.json({ok: false, error: result.error}, {status: 400});
  }
  return Response.json({ok: true, job: result.job, items: result.items});
}
