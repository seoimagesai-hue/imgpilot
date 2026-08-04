import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  getApprovedMetadata,
  listMetadataGenerations,
} from "@/server/images/ai-metadata-service";

const idSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: {params: Promise<{projectId: string; imageId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, imageId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(imageId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const language = new URL(request.url).searchParams.get("language") ?? undefined;
  const [history, approved] = await Promise.all([
    listMetadataGenerations({userId: session.user.id, projectId, imageId}),
    getApprovedMetadata({userId: session.user.id, projectId, imageId, language}),
  ]);
  return Response.json({ok: true, history, approved});
}
