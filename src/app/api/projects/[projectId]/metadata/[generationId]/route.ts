import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  approveMetadataGeneration,
  cancelQueuedMetadataGeneration,
  getMetadataGeneration,
  rejectMetadataGeneration,
  retryFailedMetadataGeneration,
  saveMetadataEdits,
} from "@/server/images/ai-metadata-service";

const idSchema = z.string().uuid();
const editSchema = z.object({
  altText: z.string().min(1).max(200),
  title: z.string().min(1).max(80),
  caption: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(500),
  filenameSuggestion: z.string().min(1).max(80),
});

export async function GET(
  _request: Request,
  context: {params: Promise<{projectId: string; generationId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, generationId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(generationId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const result = await getMetadataGeneration({
    userId: session.user.id,
    projectId,
    generationId,
  });
  if (!result.ok) {
    return Response.json({ok: false, error: result.error}, {status: 404});
  }
  return Response.json({ok: true, generation: result.generation});
}

export async function POST(
  request: Request,
  context: {params: Promise<{projectId: string; generationId: string}>},
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ok: false, error: "UNAUTHORIZED"}, {status: 401});
  }
  const {projectId, generationId} = await context.params;
  if (!projectIdSchema.safeParse(projectId).success || !idSchema.safeParse(generationId).success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "save";

  if (action === "approve") {
    const result = await approveMetadataGeneration({
      userId: session.user.id,
      projectId,
      generationId,
    });
    if (!result.ok) return Response.json({ok: false, error: result.error}, {status: 400});
    return Response.json({ok: true, generation: result.generation, approved: result.approved});
  }
  if (action === "reject") {
    const result = await rejectMetadataGeneration({
      userId: session.user.id,
      projectId,
      generationId,
    });
    if (!result.ok) return Response.json({ok: false, error: result.error}, {status: 400});
    return Response.json({ok: true, generation: result.generation});
  }
  if (action === "cancel") {
    const result = await cancelQueuedMetadataGeneration({
      userId: session.user.id,
      projectId,
      generationId,
    });
    if (!result.ok) return Response.json({ok: false, error: result.error}, {status: 400});
    return Response.json({ok: true, generation: result.generation});
  }
  if (action === "retry") {
    const result = await retryFailedMetadataGeneration({
      userId: session.user.id,
      projectId,
      generationId,
    });
    if (!result.ok) return Response.json({ok: false, error: result.error}, {status: 400});
    return Response.json({ok: true, generation: result.generation});
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const parsed = editSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ok: false, error: "METADATA_VALIDATION_FAILED"}, {status: 400});
  }
  const result = await saveMetadataEdits({
    userId: session.user.id,
    projectId,
    generationId,
    ...parsed.data,
  });
  if (!result.ok) return Response.json({ok: false, error: result.error}, {status: 400});
  return Response.json({ok: true, generation: result.generation});
}
