import {auth} from "@/auth";
import {createOwnedImageReadUrl} from "@/server/images/upload-service";
import {imageIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {params: Promise<{projectId: string; imageId: string}>};

export async function GET(_request: Request, {params}: Params) {
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

  const result = await createOwnedImageReadUrl({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: imageIdParsed.data,
  });

  if (!result.ok) {
    const status =
      result.error === "IMAGE_NOT_FOUND" || result.error === "PROJECT_NOT_FOUND" ? 404 : 503;
    return Response.json(result, {status});
  }

  return Response.json(result);
}
