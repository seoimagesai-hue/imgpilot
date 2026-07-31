import {auth} from "@/auth";
import {getQuotaPolicy} from "@/server/images/quota-policy";
import {getOwnedProjectQuotaUsage} from "@/server/images/quota-service";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type Params = {params: Promise<{projectId: string}>};

export async function GET(_request: Request, {params}: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }

  const {projectId: rawProjectId} = await params;
  const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
  if (!projectIdParsed.success) {
    return Response.json({ok: false, error: "PROJECT_NOT_FOUND"}, {status: 404});
  }

  const usage = await getOwnedProjectQuotaUsage(session.user.id, projectIdParsed.data);
  if (!usage) {
    return Response.json({ok: false, error: "PROJECT_NOT_FOUND"}, {status: 404});
  }

  const policy = getQuotaPolicy();

  return Response.json({
    ok: true,
    usage,
    policy: {
      maxImagesPerProject: policy.maxImagesPerProject,
      maxProjectStorageBytes: policy.maxProjectStorageBytes,
      maxBytesPerImage: policy.maxBytesPerImage,
      maxFilesPerBatch: policy.maxFilesPerBatch,
      nearLimitRatio: policy.nearLimitRatio,
    },
  });
}
