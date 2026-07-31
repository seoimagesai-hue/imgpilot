import {auth} from "@/auth";
import {
  lifecycleErrorHttpStatus,
  revalidateProjectImageLibrary,
} from "@/server/images/lifecycle-routes";
import {promoteOwnedReplacement} from "@/server/images/replace-service";
import {imageIdSchema, replacementIdSchema} from "@/server/images/validation";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {
  params: Promise<{projectId: string; imageId: string; replacementId: string}>;
};

export async function POST(_request: Request, {params}: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId: rawProjectId, imageId: rawImageId, replacementId: rawReplacementId} =
    await params;
  const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
  const imageIdParsed = imageIdSchema.safeParse(rawImageId);
  const replacementIdParsed = replacementIdSchema.safeParse(rawReplacementId);
  if (!projectIdParsed.success || !imageIdParsed.success || !replacementIdParsed.success) {
    return Response.json({ok: false, error: "REPLACEMENT_NOT_FOUND"}, {status: 404});
  }

  const result = await promoteOwnedReplacement({
    userId: session.user.id,
    projectId: projectIdParsed.data,
    imageId: imageIdParsed.data,
    replacementId: replacementIdParsed.data,
  });

  if (!result.ok) {
    return Response.json(result, {status: lifecycleErrorHttpStatus(result.error)});
  }

  revalidateProjectImageLibrary(projectIdParsed.data);
  return Response.json(result);
}
