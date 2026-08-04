import {auth} from "@/auth";
import {z} from "zod";
import {reopenThread, resolveThread} from "@/server/collaboration/comments";
import {CollaborationError, httpStatusForCollaborationError} from "@/server/collaboration/errors";
import {COMMENT_SUBJECT_TYPES} from "@/server/collaboration/policy";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

const bodySchema = z.object({
  subjectType: z.enum(COMMENT_SUBJECT_TYPES),
  subjectId: z.string().min(1).max(128),
  action: z.enum(["resolve", "reopen"]).default("resolve"),
});

type Params = {params: Promise<{projectId: string}>};

export async function POST(request: Request, {params}: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId: rawProjectId} = await params;
  const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
  if (!projectIdParsed.success) {
    return Response.json({ok: false, error: "PROJECT_NOT_FOUND"}, {status: 404});
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  try {
    if (parsed.data.action === "reopen") {
      await reopenThread({
        userId: session.user.id,
        projectId: projectIdParsed.data,
        subjectType: parsed.data.subjectType,
        subjectId: parsed.data.subjectId,
      });
    } else {
      await resolveThread({
        userId: session.user.id,
        projectId: projectIdParsed.data,
        subjectType: parsed.data.subjectType,
        subjectId: parsed.data.subjectId,
      });
    }
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
