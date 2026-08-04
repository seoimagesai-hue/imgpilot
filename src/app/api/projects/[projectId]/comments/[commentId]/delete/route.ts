import {auth} from "@/auth";
import {z} from "zod";
import {softDeleteComment} from "@/server/collaboration/comments";
import {CollaborationError, httpStatusForCollaborationError} from "@/server/collaboration/errors";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {params: Promise<{projectId: string; commentId: string}>};

export async function POST(_request: Request, {params}: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId: rawProjectId, commentId} = await params;
  const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
  if (!projectIdParsed.success || !z.string().uuid().safeParse(commentId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  try {
    await softDeleteComment({
      userId: session.user.id,
      projectId: projectIdParsed.data,
      commentId,
    });
    return Response.json({ok: true});
  } catch (error) {
    if (error instanceof CollaborationError) {
      return Response.json(
        {ok: false, error: error.code},
        {status: httpStatusForCollaborationError(error.code)},
      );
    }
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
}
