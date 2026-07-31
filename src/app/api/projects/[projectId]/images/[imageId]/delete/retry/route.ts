import {auth} from "@/auth";
import {retryDeletionCleanup} from "@/server/images/delete-service";
import {
  lifecycleErrorHttpStatus,
  revalidateProjectImageLibrary,
} from "@/server/images/lifecycle-routes";
import {imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {params: Promise<{projectId: string; imageId: string}>};

export async function POST(_request: Request, {params}: Params) {
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

  const result = await retryDeletionCleanup({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: imageIdParsed.data,
  });

  if (!result.ok) {
    return Response.json(result, {status: lifecycleErrorHttpStatus(result.error)});
  }

  revalidateProjectImageLibrary(projectIdParsed.data);
  return Response.json(result);
}
