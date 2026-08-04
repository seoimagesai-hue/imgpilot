import {auth} from "@/auth";
import {projectIdSchema} from "@/server/projects/validation";
import {z} from "zod";
import {
  cancelQueuedProcessingJob,
  getProcessingJob,
  retryProcessingJob,
} from "@/server/images/processing-service";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string; jobId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, jobId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(jobId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const result = await getProcessingJob({
    userId: session.user.id,
    projectId,
    jobId,
  });
  if (!result.ok) {
    return Response.json(
      {ok: false, error: result.error},
      {status: result.error === "UNAUTHORIZED" ? 401 : 404},
    );
  }
  return Response.json({ok: true, job: result.job});
}

export async function POST(
  request: Request,
  context: {params: Promise<{projectId: string; jobId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, jobId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(jobId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "execute";

  const fn =
    action === "retry"
      ? retryProcessingJob
      : action === "cancel"
        ? cancelQueuedProcessingJob
        : null;

  // Prompt 16: browser cannot execute — workers claim leased jobs
  if (!fn) {
    return Response.json({ok: false, error: "QUEUE_WORKER_REQUIRED"}, {status: 409});
  }

  const result = await fn({
    userId: session.user.id,
    projectId,
    jobId,
  });

  if (!result.ok) {
    return Response.json({ok: false, error: result.error}, {status: 400});
  }
  return Response.json({ok: true, job: result.job});
}
