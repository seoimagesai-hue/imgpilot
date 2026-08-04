import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  createMetadataGeneration,
  getMetadataAiStatus,
  getProjectMetadataSummary,
} from "@/server/images/ai-metadata-service";

const bodySchema = z.object({
  imageId: z.string().uuid(),
  language: z.enum(["en", "ur"]).optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const summary = await getProjectMetadataSummary({
    userId: session.user.id,
    projectId,
  });
  return Response.json({ok: true, ai: getMetadataAiStatus(), summary});
}

export async function POST(
  request: Request,
  context: {params: Promise<{projectId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
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

  const result = await createMetadataGeneration({
    userId: session.user.id,
    projectId,
    imageId: parsed.data.imageId,
    language: parsed.data.language,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.error === "PROJECT_NOT_FOUND" || result.error === "IMAGE_NOT_FOUND"
        ? 404
        : result.error === "AI_NOT_CONFIGURED"
          ? 503
          : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }
  return Response.json({ok: true, generation: result.generation, jobId: result.jobId});
}
