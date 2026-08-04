import {auth} from "@/auth";
import {z} from "zod";
import {projectIdSchema} from "@/server/projects/validation";
import {
  createAiMetadataBatch,
  listAiMetadataBatches,
  preflightAiMetadataBatch,
} from "@/server/images/ai-metadata-batch-service";
import {AI_METADATA_TEMPLATE_CODES} from "@/server/images/ai-metadata-templates";

const createBodySchema = z.object({
  imageIds: z.array(z.string().uuid()).max(50).optional(),
  selectionType: z.enum(["manual", "page", "filtered"]).default("manual"),
  filterSnapshot: z.record(z.unknown()).optional(),
  templateCode: z.enum(AI_METADATA_TEMPLATE_CODES).default("seo"),
  language: z.string().trim().min(2).max(10).optional(),
  skipExistingDrafts: z.boolean().optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

const preflightBodySchema = createBodySchema.omit({idempotencyKey: true});

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
  const batches = await listAiMetadataBatches({userId: session.user.id, projectId});
  return Response.json({ok: true, batches});
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

  const url = new URL(request.url);
  const isPreflight = url.searchParams.get("preflight") === "true";

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }

  if (isPreflight) {
    const parsed = preflightBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
    }
    const result = await preflightAiMetadataBatch({
      userId: session.user.id,
      projectId,
      imageIds: parsed.data.imageIds,
      selectionType: parsed.data.selectionType,
      filterSnapshot: parsed.data.filterSnapshot,
      templateCode: parsed.data.templateCode,
      language: parsed.data.language ?? "en",
      skipExistingDrafts: parsed.data.skipExistingDrafts,
    });
    if (!result.ok) {
      return Response.json({ok: false, error: result.error}, {status: 400});
    }
    return Response.json({ok: true, preflight: result.preflight});
  }

  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ok: false, error: "INVALID_REQUEST"}, {status: 400});
  }
  const result = await createAiMetadataBatch({
    userId: session.user.id,
    projectId,
    imageIds: parsed.data.imageIds,
    selectionType: parsed.data.selectionType,
    filterSnapshot: parsed.data.filterSnapshot,
    templateCode: parsed.data.templateCode,
    language: parsed.data.language ?? "en",
    idempotencyKey: parsed.data.idempotencyKey,
    skipExistingDrafts: parsed.data.skipExistingDrafts,
  });
  if (!result.ok) {
    const status = result.error === "PROJECT_NOT_FOUND" ? 404 : 400;
    return Response.json({ok: false, error: result.error}, {status});
  }
  return Response.json({ok: true, batch: result.batch, items: result.items}, {status: 202});
}
