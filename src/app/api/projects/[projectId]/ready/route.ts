import {auth} from "@/auth";
import {projectIdSchema} from "@/server/projects/validation";
import {getOwnedProjectReadySummary} from "@/server/images/ready-service";

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId} = await context.params;
  const projectIdParsed = projectIdSchema.safeParse(projectId);
  if (!projectIdParsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const summary = await getOwnedProjectReadySummary(session.user.id, projectIdParsed.data);
  if (!summary) {
    return Response.json({ok: false, error: "PROJECT_NOT_FOUND"}, {status: 404});
  }

  return Response.json({ok: true, summary});
}
