import {auth} from "@/auth";
import {projectIdSchema} from "@/server/projects/validation";
import {z} from "zod";
import {createDerivativePreviewUrl} from "@/server/images/processing-service";

const idSchema = z.string().uuid();

export async function POST(
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

  const result = await createDerivativePreviewUrl({
    userId: session.user.id,
    projectId,
    jobId,
  });

  if (!result.ok) {
    return Response.json({ok: false, error: result.error}, {status: 404});
  }
  return Response.json({ok: true, url: result.url, expiresAt: result.expiresAt});
}
