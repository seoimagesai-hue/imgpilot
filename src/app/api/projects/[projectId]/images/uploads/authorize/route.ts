import {auth} from "@/auth";
import {authorizeUploadBodySchema} from "@/server/storage/errors";
import {authorizeProjectUploads} from "@/server/images/upload-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_UPLOAD_REQUEST"}, {status: 400});
  }

  const parsed = authorizeUploadBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_UPLOAD_REQUEST"}, {status: 400});
  }

  const result = await authorizeProjectUploads({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    files: parsed.data.files,
  });

  if (!result.ok) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error === "PROJECT_NOT_FOUND"
          ? 404
          : result.error === "STORAGE_NOT_CONFIGURED"
            ? 503
            : 400;
    return Response.json(result, {status});
  }

  return Response.json(result);
}
