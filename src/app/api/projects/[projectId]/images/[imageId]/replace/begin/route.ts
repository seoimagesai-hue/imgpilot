import {auth} from "@/auth";
import {
  lifecycleErrorHttpStatus,
  revalidateProjectImageLibrary,
} from "@/server/images/lifecycle-routes";
import {beginOwnedImageReplacement} from "@/server/images/replace-service";
import {fileDescriptorSchema, imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {params: Promise<{projectId: string; imageId: string}>};

export async function POST(request: Request, {params}: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId: rawProjectId, imageId: rawImageId} = await params;
  const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
  const imageIdParsed = imageIdSchema.safeParse(rawImageId);
  if (!projectIdParsed.success || !imageIdParsed.success) {
    return Response.json({ok: false, error: "IMAGE_NOT_FOUND"}, {status: 404});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const parsed = fileDescriptorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const result = await beginOwnedImageReplacement({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: imageIdParsed.data,
    originalFilename: parsed.data.originalFilename,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });

  if (!result.ok) {
    return Response.json(result, {status: lifecycleErrorHttpStatus(result.error)});
  }

  revalidateProjectImageLibrary(projectIdParsed.data);
  return Response.json(result);
}
