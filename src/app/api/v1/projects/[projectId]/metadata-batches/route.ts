/**
 * Public API v1 — create an AI metadata batch (202 Accepted).
 */
import {z} from "zod";
import {authenticateApiRequest, requireProjectAccess} from "@/server/api/auth";
import {ApiError} from "@/server/api/errors";
import {successJson} from "@/server/api/http";
import {mapDomainError, withApiHandler, withIdempotentWrite} from "@/server/api/v1-handlers";
import {createAiMetadataBatch, listAiMetadataBatches, type AiMetadataBatchFilterSnapshot} from "@/server/images/ai-metadata-batch-service";
import {AI_METADATA_TEMPLATE_CODES} from "@/server/images/ai-metadata-templates";
import {projectIdSchema} from "@/server/projects/validation";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{projectId: string}>};

const filterSnapshotSchema = z
  .object({
    q: z.string().max(100).optional(),
    status: z.string().optional(),
    sort: z.string().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(48).optional(),
  })
  .optional();

const createBatchBodySchema = z.object({
  imageIds: z.array(z.string().uuid()).max(50).optional(),
  selectionType: z.enum(["manual", "page", "filtered"]).default("manual"),
  filterSnapshot: filterSnapshotSchema,
  templateCode: z.enum(AI_METADATA_TEMPLATE_CODES).default("seo"),
  language: z.string().trim().min(2).max(10).optional(),
  skipExistingDrafts: z.boolean().optional(),
});

export async function GET(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    if (!projectIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
    }
    await requireProjectAccess(principal, projectIdParsed.data, "metadata:generate");
    const batches = await listAiMetadataBatches({
      userId: principal.entitlementUserId,
      projectId: projectIdParsed.data,
    });
    return successJson({batches}, undefined, 200, principal.requestId);
  });
}

export async function POST(request: Request, {params}: RouteContext) {
  return withApiHandler(async () => {
    const principal = await authenticateApiRequest(request);
    const {projectId: rawProjectId} = await params;
    const projectIdParsed = projectIdSchema.safeParse(rawProjectId);
    if (!projectIdParsed.success) {
      throw new ApiError("INVALID_REQUEST", "projectId must be a valid UUID.");
    }
    const projectId = projectIdParsed.data;
    await requireProjectAccess(principal, projectId, "metadata:generate");

    let rawBody: unknown = {};
    const rawText = await request.text();
    if (rawText.trim().length > 0) {
      try {
        rawBody = JSON.parse(rawText);
      } catch {
        throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
      }
    }
    const parsed = createBatchBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError("INVALID_REQUEST", "Invalid metadata batch payload.");
    }
    if (
      parsed.data.selectionType === "manual" &&
      (!parsed.data.imageIds || parsed.data.imageIds.length === 0)
    ) {
      throw new ApiError("INVALID_REQUEST", "imageIds required for manual selection.");
    }

    return withIdempotentWrite({
      principal,
      request,
      routeKey: "POST /v1/projects/:projectId/metadata-batches",
      requestBody: rawBody,
      run: async (idempotencyKey) => {
        const result = await createAiMetadataBatch({
          userId: principal.entitlementUserId,
          projectId,
          imageIds: parsed.data.imageIds,
          selectionType: parsed.data.selectionType,
          filterSnapshot: parsed.data.filterSnapshot as AiMetadataBatchFilterSnapshot | undefined,
          templateCode: parsed.data.templateCode,
          language: parsed.data.language ?? "en",
          idempotencyKey,
          skipExistingDrafts: parsed.data.skipExistingDrafts,
        });
        if (!result.ok) throw mapDomainError(result.error);
        return {status: 202, data: {batch: result.batch, items: result.items}};
      },
    });
  });
}
