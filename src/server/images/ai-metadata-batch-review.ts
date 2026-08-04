/**
 * Prompt 31 — batch-scoped metadata review rows and bulk approve/reject.
 */
import {and, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  aiMetadataBatchItems,
  aiMetadataBatches,
  imageMetadataApproved,
  images,
  metadataGenerations,
  type MetadataGeneration,
} from "@/db/schema";
import {
  findMetadataDuplicates,
  imageIdsInDuplicates,
  type MetadataDuplicateHit,
} from "@/server/images/ai-metadata-duplicates";
import {
  isLowQuality,
  scoreMetadataFields,
  type MetadataQualityScore,
} from "@/server/images/ai-metadata-quality";
import type {SafeAiBatchErrorCode} from "@/server/images/ai-metadata-batch-errors";
import type {MetadataOutputLanguage} from "@/server/images/ai-metadata-policy";
import {
  approveMetadataGeneration,
  rejectMetadataGeneration,
  type ApprovedMetadataDto,
  type MetadataGenerationDto,
} from "@/server/images/ai-metadata-service";
import {mapWithConcurrency} from "@/server/images/bulk-policy";
import {METADATA_BULK_MAX, METADATA_BULK_CONCURRENCY} from "@/server/images/metadata-review-service";
import {getOwnedProject} from "@/server/projects/queries";

export type BatchReviewRow = {
  itemId: string;
  imageId: string;
  originalFilename: string;
  imageStatus: string;
  generation: MetadataGenerationDto | null;
  approved: ApprovedMetadataDto | null;
  quality: MetadataQualityScore | null;
  isDuplicate: boolean;
  needsReview: boolean;
  blocked: boolean;
  blockReason: string | null;
};

function toGenDto(row: MetadataGeneration): MetadataGenerationDto {
  return {
    id: row.id,
    projectId: row.projectId,
    imageId: row.imageId,
    processingJobId: row.processingJobId,
    language: row.language,
    provider: row.provider,
    model: row.model,
    promptVersion: row.promptVersion,
    status: row.status,
    altText: row.altText,
    title: row.title,
    caption: row.caption,
    description: row.description,
    filenameSuggestion: row.filenameSuggestion,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    sourceStorageKeyPresent: true,
    lastErrorCode: row.lastErrorCode,
    createdAt: row.createdAt.toISOString(),
    generatedAt: row.generatedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
  };
}

export async function listBatchReviewRows(params: {
  userId: string;
  projectId: string;
  batchId: string;
}): Promise<{ok: true; rows: BatchReviewRow[]} | {ok: false; error: SafeAiBatchErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.approve");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [batch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, params.batchId), eq(aiMetadataBatches.projectId, project.id)))
    .limit(1);
  if (!batch) return {ok: false, error: "AI_BATCH_NOT_FOUND"};

  const items = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(eq(aiMetadataBatchItems.batchId, batch.id));

  const generationIds = items.map((i) => i.generationId).filter(Boolean) as string[];
  const gens = generationIds.length
    ? await db.select().from(metadataGenerations).where(inArray(metadataGenerations.id, generationIds))
    : [];
  const genById = new Map(gens.map((g) => [g.id, g]));

  const imageIds = items.map((i) => i.imageId);
  const imageRows = imageIds.length
    ? await db
        .select({id: images.id, originalFilename: images.originalFilename, status: images.status, storageKey: images.storageKey, deletedAt: images.deletedAt})
        .from(images)
        .where(inArray(images.id, imageIds))
    : [];
  const imageById = new Map(imageRows.map((r) => [r.id, r]));

  const approvedRows = imageIds.length
    ? await db
        .select()
        .from(imageMetadataApproved)
        .where(
          and(
            eq(imageMetadataApproved.projectId, project.id),
            inArray(imageMetadataApproved.imageId, imageIds),
            eq(imageMetadataApproved.language, batch.language as MetadataOutputLanguage),
          ),
        )
    : [];
  const approvedByImage = new Map(approvedRows.map((r) => [r.imageId, r]));

  const draftGens = gens.filter((g) => g.status === "draft" || g.status === "reviewed");
  let duplicateHits: MetadataDuplicateHit[] = [];
  if (draftGens.length >= 2) {
    duplicateHits = findMetadataDuplicates(
      draftGens.map((g) => ({
        imageId: g.imageId,
        generationId: g.id,
        altText: g.altText,
        title: g.title,
        filenameSuggestion: g.filenameSuggestion,
      })),
    );
  }
  const dupImageIds = imageIdsInDuplicates(duplicateHits);

  const rows: BatchReviewRow[] = [];
  for (const item of items) {
    const gen = item.generationId ? genById.get(item.generationId) ?? null : null;
    const image = imageById.get(item.imageId);
    const approvedRow = approvedByImage.get(item.imageId);
    const quality =
      gen?.altText && gen.title && gen.description
        ? scoreMetadataFields({
            altText: gen.altText,
            title: gen.title,
            description: gen.description,
            filenameSuggestion: gen.filenameSuggestion ?? "",
            caption: gen.caption,
            originalFilename: image?.originalFilename,
          })
        : null;

    let blocked = false;
    let blockReason: string | null = null;
    if (!gen || !["draft", "reviewed"].includes(gen.status)) {
      blocked = true;
      blockReason = gen ? `GENERATION_${gen.status.toUpperCase()}` : "NO_GENERATION";
    } else if (!image || image.deletedAt) {
      blocked = true;
      blockReason = "IMAGE_NOT_FOUND";
    } else if (image.storageKey !== gen.sourceStorageKey) {
      blocked = true;
      blockReason = "AI_GENERATION_STALE";
    }

    rows.push({
      itemId: item.id,
      imageId: item.imageId,
      originalFilename: image?.originalFilename ?? "unknown",
      imageStatus: image?.status ?? "unknown",
      generation: gen ? toGenDto(gen) : null,
      approved: approvedRow
        ? {
            id: approvedRow.id,
            imageId: approvedRow.imageId,
            language: approvedRow.language,
            generationId: approvedRow.generationId,
            altText: approvedRow.altText,
            title: approvedRow.title,
            caption: approvedRow.caption,
            description: approvedRow.description,
            filenameSuggestion: approvedRow.filenameSuggestion,
            approvedAt: approvedRow.approvedAt.toISOString(),
          }
        : null,
      quality,
      isDuplicate: dupImageIds.has(item.imageId),
      needsReview: Boolean(quality && isLowQuality(quality)),
      blocked,
      blockReason,
    });
  }

  return {ok: true, rows};
}

export async function bulkApproveBatchItems(params: {
  userId: string;
  projectId: string;
  batchId: string;
  generationIds: string[];
  confirmBulkApprove: true;
}): Promise<
  | {ok: true; attempted: number; succeeded: number; failed: Array<{id: string; error: string}>}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  if (params.confirmBulkApprove !== true) {
    return {ok: false, error: "AI_BATCH_REVIEW_CONFIRMATION_REQUIRED"};
  }
  return bulkReviewAction({...params, action: "approve"});
}

export async function bulkRejectBatchItems(params: {
  userId: string;
  projectId: string;
  batchId: string;
  generationIds: string[];
  confirmBulkReject: true;
}): Promise<
  | {ok: true; attempted: number; succeeded: number; failed: Array<{id: string; error: string}>}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  if (params.confirmBulkReject !== true) {
    return {ok: false, error: "AI_BATCH_REVIEW_CONFIRMATION_REQUIRED"};
  }
  return bulkReviewAction({...params, action: "reject"});
}

async function bulkReviewAction(params: {
  userId: string;
  projectId: string;
  batchId: string;
  generationIds: string[];
  action: "approve" | "reject";
}): Promise<
  | {ok: true; attempted: number; succeeded: number; failed: Array<{id: string; error: string}>}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.approve");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [batch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, params.batchId), eq(aiMetadataBatches.projectId, project.id)))
    .limit(1);
  if (!batch) return {ok: false, error: "AI_BATCH_NOT_FOUND"};

  const unique = [...new Set(params.generationIds)].slice(0, METADATA_BULK_MAX);
  if (!unique.length) return {ok: false, error: "INVALID_REQUEST"};
  if (params.generationIds.length > METADATA_BULK_MAX) return {ok: false, error: "AI_BATCH_TOO_LARGE"};

  const batchGenIds = await db
    .select({generationId: aiMetadataBatchItems.generationId})
    .from(aiMetadataBatchItems)
    .where(eq(aiMetadataBatchItems.batchId, batch.id));
  const allowed = new Set(batchGenIds.map((r) => r.generationId).filter(Boolean) as string[]);
  const ids = unique.filter((id) => allowed.has(id));
  if (!ids.length) return {ok: false, error: "AI_BATCH_ITEM_NOT_FOUND"};

  const review = await listBatchReviewRows({
    userId: params.userId,
    projectId: project.id,
    batchId: batch.id,
  });
  if (!review.ok) return review;
  const blocked = new Set(
    review.rows.filter((r) => r.blocked && r.generation).map((r) => r.generation!.id),
  );

  const failed: Array<{id: string; error: string}> = [];
  let succeeded = 0;

  const results = await mapWithConcurrency(ids, METADATA_BULK_CONCURRENCY, async (generationId) => {
    if (blocked.has(generationId)) {
      return {generationId, result: {ok: false as const, error: "AI_GENERATION_STALE"}};
    }
    if (params.action === "approve") {
      return {
        generationId,
        result: await approveMetadataGeneration({userId: params.userId, projectId: project.id, generationId}),
      };
    }
    return {
      generationId,
      result: await rejectMetadataGeneration({userId: params.userId, projectId: project.id, generationId}),
    };
  });

  for (const item of results) {
    if (item.result.ok) succeeded++;
    else failed.push({id: item.generationId, error: item.result.error});
  }

  const {syncAiMetadataBatchItemFromGeneration} = await import("@/server/images/ai-metadata-batch-service");
  for (const generationId of ids) {
    void syncAiMetadataBatchItemFromGeneration(generationId);
  }

  return {ok: true, attempted: ids.length, succeeded, failed};
}
