import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import {confirmProjectUpload} from "@/server/images/upload-service";
import {imageIdSchema} from "@/server/images/validation";
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

  const result = await confirmProjectUpload({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: imageIdParsed.data,
  });

  if (!result.ok) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error === "PROJECT_NOT_FOUND" || result.error === "IMAGE_NOT_FOUND"
          ? 404
          : result.error === "STORAGE_NOT_CONFIGURED"
            ? 503
            : 400;
    return Response.json(result, {status});
  }

  // Best-effort locale from query or Accept-Language — revalidate both common locales.
  revalidatePath(`/en/dashboard/projects/${projectIdParsed.data}`);
  revalidatePath(`/en/dashboard/projects/${projectIdParsed.data}/images`);
  revalidatePath(`/ur/dashboard/projects/${projectIdParsed.data}`);
  revalidatePath(`/ur/dashboard/projects/${projectIdParsed.data}/images`);
  void request;

  return Response.json(result);
}
