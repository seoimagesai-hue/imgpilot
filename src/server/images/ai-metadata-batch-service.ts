/**
 * Prompt 31 — AI metadata batch orchestration over single-image generation.
 */
import {and, desc, eq, gte, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  aiMetadataBatchItems,
  aiMetadataBatches,
  metadataGenerations,
  type AiMetadataBatch,
  type AiMetadataBatchItem,
  type AiMetadataBatchItemStatus,
  type AiMetadataBatchSelectionType,
  type AiMetadataBatchStatus,
  type AiMetadataTemplateCode,
} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import type {SafeAiBatchErrorCode} from "@/server/images/ai-metadata-batch-errors";
import {
  AI_BATCH_ENQUEUE_CONCURRENCY,
  AI_BATCH_MAX_ACTIVE,
  AI_BATCH_MAX_IMAGES,
  AI_MAX_GENERATIONS_PER_IMAGE_PER_DAY,
  AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY,
  isMetadataOutputLanguage,
  type MetadataOutputLanguage,
} from "@/server/images/ai-metadata-policy";
import {
  cancelQueuedMetadataGeneration,
  createMetadataGeneration,
  retryFailedMetadataGeneration,
  type MetadataGenerationDto,
} from "@/server/images/ai-metadata-service";
import {getTemplate, isActiveTemplate} from "@/server/images/ai-metadata-templates";
import {mapWithConcurrency} from "@/server/images/bulk-policy";
import {filterOwnedImageIds, listFilteredReadyImageIds, listLibraryImagesForOwnedProject} from "@/server/images/library-queries";
import {parseLibraryQuery, type LibraryQuery} from "@/server/images/library-query";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import {imageHasOpenReplacement} from "@/server/images/ready-queries";
import {READY_STATUS} from "@/server/images/ready-eligibility";
import {getOwnedImageForProcessing} from "@/server/images/processing-queries";
import {getAiConfigStatus} from "@/server/images/ai-provider";
import {writeIntegrationAudit} from "@/server/api/audit";
import {getOwnedProject} from "@/server/projects/queries";
import {workspaceFromProject} from "@/server/workflows/workspace";
import {emitWebhookEvent} from "@/server/webhooks/events";
import {safeInvokeDomainEvent} from "@/server/workflows/dispatch";

const ELIGIBLE = new Set(["validated", READY_STATUS]);
const ACTIVE_GEN = ["queued", "generating", "validating_output"] as const;
const TERMINAL_BATCH: AiMetadataBatchStatus[] = [
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
];
const ACTIVE_BATCH: AiMetadataBatchStatus[] = [
  "preparing",
  "queued",
  "running",
  "cancelling",
];

export type AiMetadataBatchFilterSnapshot = Partial<
  Pick<LibraryQuery, "q" | "status" | "sort" | "page" | "pageSize">
>;

export type AiMetadataBatchDto = {
  id: string;
  projectId: string;
  templateCode: AiMetadataTemplateCode;
  language: string;
  provider: string;
  model: string;
  promptVersion: string;
  status: AiMetadataBatchStatus;
  selectionType: AiMetadataBatchSelectionType;
  totalCount: number;
  eligibleCount: number;
  queuedCount: number;
  runningCount: number;
  draftCount: number;
  reviewedCount: number;
  approvedCount: number;
  rejectedCount: number;
  failedCount: number;
  cancelledCount: number;
  staleCount: number;
  skippedCount: number;
  usageReserved: number;
  usageConsumed: number;
  usageReleased: number;
  cancelRequested: boolean;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type AiMetadataBatchItemDto = {
  id: string;
  batchId: string;
  imageId: string;
  generationId: string | null;
  status: AiMetadataBatchItemStatus;
  eligibilityCode: string | null;
  lastErrorCode: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type PreflightImageResult = {
  imageId: string;
  eligible: boolean;
  code?: string;
};

export type PreflightAiMetadataBatchResult = {
  templateCode: AiMetadataTemplateCode;
  language: MetadataOutputLanguage;
  totalResolved: number;
  eligible: PreflightImageResult[];
  ineligible: PreflightImageResult[];
  allowanceRemaining: number | null;
  allowanceSufficient: boolean;
};

function toBatchDto(row: AiMetadataBatch): AiMetadataBatchDto {
  return {
    id: row.id,
    projectId: row.projectId,
    templateCode: row.templateCode,
    language: row.language,
    provider: row.provider,
    model: row.model,
    promptVersion: row.promptVersion,
    status: row.status,
    selectionType: row.selectionType,
    totalCount: row.totalCount,
    eligibleCount: row.eligibleCount,
    queuedCount: row.queuedCount,
    runningCount: row.runningCount,
    draftCount: row.draftCount,
    reviewedCount: row.reviewedCount,
    approvedCount: row.approvedCount,
    rejectedCount: row.rejectedCount,
    failedCount: row.failedCount,
    cancelledCount: row.cancelledCount,
    staleCount: row.staleCount,
    skippedCount: row.skippedCount,
    usageReserved: row.usageReserved,
    usageConsumed: row.usageConsumed,
    usageReleased: row.usageReleased,
    cancelRequested: row.cancelRequested,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toItemDto(row: AiMetadataBatchItem): AiMetadataBatchItemDto {
  return {
    id: row.id,
    batchId: row.batchId,
    imageId: row.imageId,
    generationId: row.generationId,
    status: row.status,
    eligibilityCode: row.eligibilityCode,
    lastErrorCode: row.lastErrorCode,
    queuedAt: row.queuedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function generationStatusToItemStatus(status: string): AiMetadataBatchItemStatus | null {
  switch (status) {
    case "queued":
      return "queued";
    case "generating":
    case "validating_output":
      return "running";
    case "draft":
      return "draft";
    case "reviewed":
      return "reviewed";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "stale":
      return "stale";
    default:
      return null;
  }
}

async function resolveAllowanceRemaining(userId: string): Promise<number | null> {
  const {resolveEntitlement, countUsageInPeriod} = await import("@/server/billing/entitlements");
  const entitlement = await resolveEntitlement(userId);
  if (!entitlement.plan.aiMetadataEnabled) return 0;
  const limit = entitlement.plan.monthlyAiLimit;
  if (limit < 0) return null;
  const used = await countUsageInPeriod(userId, "ai", entitlement.periodStart, entitlement.periodEnd);
  return Math.max(0, limit - used);
}

async function countActiveBatchesForWorkspace(
  workspaceType: AiMetadataBatch["workspaceType"],
  workspaceId: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(aiMetadataBatches)
    .where(
      and(
        eq(aiMetadataBatches.workspaceType, workspaceType),
        eq(aiMetadataBatches.workspaceId, workspaceId),
        inArray(aiMetadataBatches.status, ACTIVE_BATCH),
      ),
    );
  return row?.count ?? 0;
}

async function resolveImageIds(params: {
  userId: string;
  projectId: string;
  selectionType: AiMetadataBatchSelectionType;
  imageIds?: string[];
  filterSnapshot?: AiMetadataBatchFilterSnapshot | null;
}): Promise<string[]> {
  if (params.selectionType === "manual") {
    const unique = [...new Set(params.imageIds ?? [])];
    const owned = await filterOwnedImageIds(params.userId, params.projectId, unique);
    return owned.slice(0, AI_BATCH_MAX_IMAGES);
  }

  const snapshot = params.filterSnapshot ?? {};
  const libraryQuery = parseLibraryQuery({
    q: snapshot.q,
    status: snapshot.status,
    sort: snapshot.sort,
    page: snapshot.page != null ? String(snapshot.page) : undefined,
    pageSize: snapshot.pageSize != null ? String(snapshot.pageSize) : undefined,
  });

  if (params.selectionType === "page") {
    const page = await listLibraryImagesForOwnedProject(params.userId, params.projectId, libraryQuery);
    return page.items.map((i) => i.id).slice(0, AI_BATCH_MAX_IMAGES);
  }

  // filtered — server-side re-resolve; never trust browser full list
  return listFilteredReadyImageIds(
    params.userId,
    params.projectId,
    libraryQuery,
    AI_BATCH_MAX_IMAGES,
  );
}

async function assessImageEligibility(params: {
  userId: string;
  projectId: string;
  imageId: string;
  language: MetadataOutputLanguage;
  skipExistingDrafts?: boolean;
}): Promise<{eligible: true; storageKey: string} | {eligible: false; code: string}> {
  const image = await getOwnedImageForProcessing(params.userId, params.projectId, params.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {eligible: false, code: "IMAGE_NOT_FOUND"};
  }
  if (!ELIGIBLE.has(image.status) || !image.storageKey || !image.detectedFormat) {
    return {eligible: false, code: "IMAGE_NOT_ELIGIBLE"};
  }
  if (await imageHasOpenReplacement(image.id, params.projectId)) {
    return {eligible: false, code: "IMAGE_NOT_ELIGIBLE"};
  }

  const db = getDb();
  const [activeGen] = await db
    .select({id: metadataGenerations.id})
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.imageId, image.id),
        eq(metadataGenerations.language, params.language),
        inArray(metadataGenerations.status, [...ACTIVE_GEN]),
      ),
    )
    .limit(1);
  if (activeGen) return {eligible: false, code: "AI_GENERATION_CONFLICT"};

  if (params.skipExistingDrafts) {
    const [existingDraft] = await db
      .select({id: metadataGenerations.id})
      .from(metadataGenerations)
      .where(
        and(
          eq(metadataGenerations.imageId, image.id),
          eq(metadataGenerations.language, params.language),
          inArray(metadataGenerations.status, ["draft", "reviewed"]),
        ),
      )
      .limit(1);
    if (existingDraft) return {eligible: false, code: "EXISTING_DRAFT"};
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const [imageDay] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.imageId, image.id),
        gte(metadataGenerations.createdAt, dayStart),
      ),
    );
  if ((imageDay?.count ?? 0) >= AI_MAX_GENERATIONS_PER_IMAGE_PER_DAY) {
    return {eligible: false, code: "AI_RATE_LIMITED"};
  }
  const [projectDay] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.projectId, params.projectId),
        gte(metadataGenerations.createdAt, dayStart),
      ),
    );
  if ((projectDay?.count ?? 0) >= AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY) {
    return {eligible: false, code: "AI_RATE_LIMITED"};
  }

  return {eligible: true, storageKey: image.storageKey};
}

export async function preflightAiMetadataBatch(params: {
  userId: string;
  projectId: string;
  imageIds?: string[];
  selectionType: AiMetadataBatchSelectionType;
  filterSnapshot?: AiMetadataBatchFilterSnapshot | null;
  templateCode: string;
  language: string;
  skipExistingDrafts?: boolean;
}): Promise<
  | {ok: true; preflight: PreflightAiMetadataBatchResult}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  if (!isActiveTemplate(params.templateCode)) return {ok: false, error: "AI_BATCH_TEMPLATE_INVALID"};
  const template = getTemplate(params.templateCode)!;
  const language = (params.language ?? project.metadataLanguage) as string;
  if (!isMetadataOutputLanguage(language) || !template.supportedLanguages.includes(language)) {
    return {ok: false, error: "AI_BATCH_LANGUAGE_UNSUPPORTED"};
  }

  const resolvedIds = await resolveImageIds({
    userId: params.userId,
    projectId: project.id,
    selectionType: params.selectionType,
    imageIds: params.imageIds,
    filterSnapshot: params.filterSnapshot,
  });
  if (!resolvedIds.length) return {ok: false, error: "AI_BATCH_EMPTY_SELECTION"};
  if (resolvedIds.length > AI_BATCH_MAX_IMAGES) return {ok: false, error: "AI_BATCH_TOO_LARGE"};

  const eligible: PreflightImageResult[] = [];
  const ineligible: PreflightImageResult[] = [];
  for (const imageId of resolvedIds) {
    const result = await assessImageEligibility({
      userId: params.userId,
      projectId: project.id,
      imageId,
      language,
      skipExistingDrafts: params.skipExistingDrafts,
    });
    if (result.eligible) eligible.push({imageId, eligible: true});
    else ineligible.push({imageId, eligible: false, code: result.code});
  }

  const {resolveEntitlementUserIdForProject} = await import("@/server/organizations/access");
  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const allowanceRemaining = await resolveAllowanceRemaining(entitlementUserId);

  return {
    ok: true,
    preflight: {
      templateCode: template.code,
      language,
      totalResolved: resolvedIds.length,
      eligible,
      ineligible,
      allowanceRemaining,
      allowanceSufficient:
        allowanceRemaining == null ? true : eligible.length <= allowanceRemaining,
    },
  };
}

export async function createAiMetadataBatch(params: {
  userId: string;
  projectId: string;
  imageIds?: string[];
  selectionType: AiMetadataBatchSelectionType;
  filterSnapshot?: AiMetadataBatchFilterSnapshot | null;
  templateCode: string;
  language: string;
  idempotencyKey?: string;
  skipExistingDrafts?: boolean;
}): Promise<
  | {ok: true; batch: AiMetadataBatchDto; items: AiMetadataBatchItemDto[]}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  const ai = getAiConfigStatus();
  if (!ai.configured) return {ok: false, error: "AI_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  if (!isActiveTemplate(params.templateCode)) return {ok: false, error: "AI_BATCH_TEMPLATE_INVALID"};
  const template = getTemplate(params.templateCode)!;
  const language = (params.language ?? project.metadataLanguage) as string;
  if (!isMetadataOutputLanguage(language) || !template.supportedLanguages.includes(language)) {
    return {ok: false, error: "AI_BATCH_LANGUAGE_UNSUPPORTED"};
  }

  const ws = workspaceFromProject(project);
  const activeCount = await countActiveBatchesForWorkspace(ws.workspaceType, ws.workspaceId);
  if (activeCount >= AI_BATCH_MAX_ACTIVE) return {ok: false, error: "AI_BATCH_ACTIVE_LIMIT"};

  const db = getDb();
  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(aiMetadataBatches)
      .where(
        and(
          eq(aiMetadataBatches.projectId, project.id),
          eq(aiMetadataBatches.idempotencyKey, params.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing) {
      const items = await db
        .select()
        .from(aiMetadataBatchItems)
        .where(eq(aiMetadataBatchItems.batchId, existing.id));
      return {ok: true, batch: toBatchDto(existing), items: items.map(toItemDto)};
    }
  }

  const preflight = await preflightAiMetadataBatch({
    userId: params.userId,
    projectId: project.id,
    imageIds: params.imageIds,
    selectionType: params.selectionType,
    filterSnapshot: params.filterSnapshot,
    templateCode: template.code,
    language,
    skipExistingDrafts: params.skipExistingDrafts,
  });
  if (!preflight.ok) return preflight;
  if (!preflight.preflight.eligible.length) return {ok: false, error: "AI_BATCH_EMPTY_SELECTION"};
  if (!preflight.preflight.allowanceSufficient) return {ok: false, error: "AI_BATCH_USAGE_INSUFFICIENT"};

  const batchId = crypto.randomUUID();
  const eligibleIds = preflight.preflight.eligible.map((e) => e.imageId);
  const ineligibleRows = preflight.preflight.ineligible;

  await db.transaction(async (tx) => {
    await tx.insert(aiMetadataBatches).values({
      id: batchId,
      workspaceType: ws.workspaceType,
      workspaceId: ws.workspaceId,
      projectId: project.id,
      templateCode: template.code,
      language,
      provider: ai.provider,
      model: ai.model,
      promptVersion: template.promptVersion,
      status: "preparing",
      selectionType: params.selectionType,
      selectionSnapshot: params.filterSnapshot ?? null,
      totalCount: preflight.preflight.totalResolved,
      eligibleCount: eligibleIds.length,
      skippedCount: ineligibleRows.filter((r) => r.code === "EXISTING_DRAFT").length,
      usageReserved: eligibleIds.length,
      idempotencyKey: params.idempotencyKey ?? null,
      createdByUserId: params.userId,
    });

    const itemRows = [
      ...eligibleIds.map((imageId) => ({
        id: crypto.randomUUID(),
        batchId,
        projectId: project.id,
        imageId,
        status: "pending" as const,
      })),
      ...ineligibleRows.map((row) => ({
        id: crypto.randomUUID(),
        batchId,
        projectId: project.id,
        imageId: row.imageId,
        status: (row.code === "EXISTING_DRAFT" ? "skipped" : "failed") as AiMetadataBatchItemStatus,
        eligibilityCode: row.code ?? null,
        lastErrorCode: row.code ?? null,
        completedAt: new Date(),
      })),
    ];
    if (itemRows.length) await tx.insert(aiMetadataBatchItems).values(itemRows);

    await tx
      .update(aiMetadataBatches)
      .set({status: "queued", updatedAt: new Date()})
      .where(eq(aiMetadataBatches.id, batchId));
  });

  await writeIntegrationAudit({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    actorUserId: params.userId,
    action: "ai_metadata_batch.created",
    targetEntityType: "ai_metadata_batch",
    targetEntityId: batchId,
    afterSummary: `template=${template.code} language=${language} eligible=${eligibleIds.length}`,
  });

  void emitWebhookEvent({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    eventType: "metadata_batch.started",
    entityType: "ai_metadata_batch",
    entityId: batchId,
    deduplicationKey: `metadata_batch.started:${batchId}`,
    payload: {
      projectId: project.id,
      templateCode: template.code,
      language,
      eligibleCount: eligibleIds.length,
    },
  }).catch(() => undefined);

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: params.userId,
    projectId: project.id,
    eventType: "ai_batch_started",
    entityType: "ai_metadata_batch",
    entityId: batchId,
    idempotencyKey: `ai_batch_started:${batchId}`,
    safeMetadata: {templateCode: template.code, eligibleCount: eligibleIds.length},
  });

  const {recordActivityEventSafe} = await import("@/server/collaboration/activity");
  recordActivityEventSafe({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    organizationId: project.organizationId,
    projectId: project.id,
    actorUserId: params.userId,
    verb: "ai_batch.created",
    entityType: "ai_metadata_batch",
    entityId: batchId,
    summarySafe: `AI batch started (${eligibleIds.length} images)`,
    metadataSafe: {templateCode: template.code, eligibleCount: eligibleIds.length, language},
    idempotencyKey: `activity:ai_batch.created:${batchId}`,
  });

  void runAiMetadataBatch({userId: params.userId, projectId: project.id, batchId}).catch(() => undefined);

  const [batch] = await db.select().from(aiMetadataBatches).where(eq(aiMetadataBatches.id, batchId)).limit(1);
  const items = await db.select().from(aiMetadataBatchItems).where(eq(aiMetadataBatchItems.batchId, batchId));
  return {ok: true, batch: toBatchDto(batch!), items: items.map(toItemDto)};
}

async function enqueueOneBatchItem(params: {
  userId: string;
  projectId: string;
  batch: AiMetadataBatch;
  item: AiMetadataBatchItem;
}): Promise<void> {
  const db = getDb();
  const [freshBatch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(eq(aiMetadataBatches.id, params.batch.id))
    .limit(1);
  if (freshBatch?.cancelRequested) {
    await db
      .update(aiMetadataBatchItems)
      .set({status: "cancelled", updatedAt: new Date(), completedAt: new Date()})
      .where(and(eq(aiMetadataBatchItems.id, params.item.id), eq(aiMetadataBatchItems.status, "pending")));
    return;
  }

  const [acquired] = await db
    .update(aiMetadataBatchItems)
    .set({status: "queued", queuedAt: new Date(), updatedAt: new Date()})
    .where(and(eq(aiMetadataBatchItems.id, params.item.id), eq(aiMetadataBatchItems.status, "pending")))
    .returning();
  if (!acquired) return;

  const created = await createMetadataGeneration({
    userId: params.userId,
    projectId: params.projectId,
    imageId: params.item.imageId,
    language: params.batch.language,
    templateCode: params.batch.templateCode,
    idempotencyKey: `ai-batch:${params.batch.id}:${params.item.imageId}`,
    skipAllowanceCheck: true,
  });

  if (!created.ok) {
    const skipCodes = new Set(["IMAGE_NOT_FOUND", "IMAGE_NOT_ELIGIBLE", "AI_GENERATION_CONFLICT", "EXISTING_DRAFT"]);
    const status: AiMetadataBatchItemStatus = skipCodes.has(created.error) ? "skipped" : "failed";
    await db
      .update(aiMetadataBatchItems)
      .set({
        status,
        lastErrorCode: created.error,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiMetadataBatchItems.id, params.item.id));
    if (status !== "failed") {
      await db
        .update(aiMetadataBatches)
        .set({
          usageReleased: sql`${aiMetadataBatches.usageReleased} + 1`,
          usageReserved: sql`GREATEST(0, ${aiMetadataBatches.usageReserved} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(aiMetadataBatches.id, params.batch.id));
    }
    return;
  }

  await db
    .update(aiMetadataBatchItems)
    .set({
      generationId: created.generation.id,
      status: generationStatusToItemStatus(created.generation.status) ?? "queued",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aiMetadataBatchItems.id, params.item.id));
}

export async function runAiMetadataBatch(params: {
  userId: string;
  projectId: string;
  batchId: string;
}): Promise<
  | {ok: true; batch: AiMetadataBatchDto; items: AiMetadataBatchItemDto[]}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();

  const [batch] = await db
    .update(aiMetadataBatches)
    .set({
      status: "running",
      startedAt: sql`coalesce(${aiMetadataBatches.startedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(aiMetadataBatches.id, params.batchId),
        eq(aiMetadataBatches.projectId, project.id),
        inArray(aiMetadataBatches.status, ["queued", "running", "partially_completed"]),
      ),
    )
    .returning();
  if (!batch) return {ok: false, error: "AI_BATCH_CONFLICT"};

  const pending = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(
      and(
        eq(aiMetadataBatchItems.batchId, batch.id),
        eq(aiMetadataBatchItems.status, "pending"),
      ),
    );

  await mapWithConcurrency(pending, AI_BATCH_ENQUEUE_CONCURRENCY, async (item) => {
    await enqueueOneBatchItem({userId: params.userId, projectId: project.id, batch, item});
  });

  await recountAiMetadataBatch(batch.id, project.id);
  const [updated] = await db.select().from(aiMetadataBatches).where(eq(aiMetadataBatches.id, batch.id)).limit(1);
  const items = await db.select().from(aiMetadataBatchItems).where(eq(aiMetadataBatchItems.batchId, batch.id));
  return {ok: true, batch: toBatchDto(updated!), items: items.map(toItemDto)};
}

function finalizeBatchStatus(counts: {
  pending: number;
  queued: number;
  running: number;
  draft: number;
  reviewed: number;
  approved: number;
  rejected: number;
  failed: number;
  cancelled: number;
  stale: number;
  skipped: number;
  eligibleCount: number;
  cancelRequested: boolean;
}): AiMetadataBatchStatus {
  const active = counts.pending + counts.queued + counts.running;
  if (active > 0) return counts.cancelRequested ? "cancelling" : "running";

  const success = counts.draft + counts.reviewed + counts.approved;
  const terminalFail = counts.failed + counts.cancelled + counts.stale;

  if (counts.cancelRequested && success === 0 && counts.approved === 0) return "cancelled";
  if (success > 0 && terminalFail === 0 && counts.rejected === 0) return "completed";
  if (success > 0 && (terminalFail > 0 || counts.rejected > 0)) return "partially_completed";
  if (success === 0 && counts.skipped === counts.eligibleCount) return "failed";
  if (success === 0 && terminalFail > 0) return counts.skipped > 0 ? "partially_completed" : "failed";
  if (counts.cancelRequested) return "cancelled";
  return "failed";
}

export async function recountAiMetadataBatch(batchId: string, projectId: string): Promise<AiMetadataBatch | null> {
  const db = getDb();
  const items = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(and(eq(aiMetadataBatchItems.batchId, batchId), eq(aiMetadataBatchItems.projectId, projectId)));

  const counts = {
    pending: 0,
    queued: 0,
    running: 0,
    draft: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
    cancelled: 0,
    stale: 0,
    skipped: 0,
  };
  for (const item of items) {
    switch (item.status) {
      case "pending":
        counts.pending++;
        break;
      case "queued":
        counts.queued++;
        break;
      case "running":
        counts.running++;
        break;
      case "draft":
        counts.draft++;
        break;
      case "reviewed":
        counts.reviewed++;
        break;
      case "approved":
        counts.approved++;
        break;
      case "rejected":
        counts.rejected++;
        break;
      case "failed":
        counts.failed++;
        break;
      case "cancelled":
        counts.cancelled++;
        break;
      case "stale":
        counts.stale++;
        break;
      case "skipped":
        counts.skipped++;
        break;
    }
  }

  const [current] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, batchId), eq(aiMetadataBatches.projectId, projectId)))
    .limit(1);
  if (!current) return null;

  const status = finalizeBatchStatus({...counts, eligibleCount: current.eligibleCount, cancelRequested: current.cancelRequested});
  const terminal = TERMINAL_BATCH.includes(status);
  const usageConsumed = counts.draft + counts.reviewed + counts.approved + counts.rejected + counts.failed;

  const [updated] = await db
    .update(aiMetadataBatches)
    .set({
      queuedCount: counts.queued,
      runningCount: counts.running,
      draftCount: counts.draft,
      reviewedCount: counts.reviewed,
      approvedCount: counts.approved,
      rejectedCount: counts.rejected,
      failedCount: counts.failed,
      cancelledCount: counts.cancelled,
      staleCount: counts.stale,
      skippedCount: counts.skipped,
      usageConsumed,
      status,
      completedAt: terminal ? (current.completedAt ?? new Date()) : current.completedAt,
      cancelledAt: status === "cancelled" ? (current.cancelledAt ?? new Date()) : current.cancelledAt,
      updatedAt: new Date(),
    })
    .where(eq(aiMetadataBatches.id, batchId))
    .returning();

  if (updated && terminal && current.status !== status) {
    await emitBatchTerminalEvents(updated);
  } else if (updated && !terminal) {
    const reviewReady =
      counts.pending + counts.queued + counts.running === 0 &&
      counts.draft + counts.reviewed > 0;
    if (reviewReady) {
      const ws = {workspaceType: updated.workspaceType, workspaceId: updated.workspaceId};
      void emitWebhookEvent({
        ...ws,
        eventType: "metadata_batch.review_ready",
        entityType: "ai_metadata_batch",
        entityId: updated.id,
        deduplicationKey: `metadata_batch.review_ready:${updated.id}`,
        payload: {
          projectId: updated.projectId,
          draftCount: counts.draft,
          reviewedCount: counts.reviewed,
        },
      }).catch(() => undefined);
      const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
      recordAnalyticsEventSafe({
        userId: updated.createdByUserId,
        projectId: updated.projectId,
        eventType: "ai_batch_review_ready",
        entityType: "ai_metadata_batch",
        entityId: updated.id,
        idempotencyKey: `ai_batch_review_ready:${updated.id}`,
        safeMetadata: {draftCount: counts.draft},
      });
    }
  }

  return updated ?? null;
}

async function emitBatchTerminalEvents(batch: AiMetadataBatch): Promise<void> {
  const ws = {workspaceType: batch.workspaceType, workspaceId: batch.workspaceId};
  const eventType =
    batch.status === "completed"
      ? "metadata_batch.completed"
      : batch.status === "partially_completed"
        ? "metadata_batch.partially_completed"
        : batch.status === "cancelled"
          ? "metadata_batch.cancelled"
          : "metadata_batch.failed";

  void emitWebhookEvent({
    ...ws,
    eventType,
    entityType: "ai_metadata_batch",
    entityId: batch.id,
    deduplicationKey: `${eventType}:${batch.id}`,
    payload: {
      projectId: batch.projectId,
      status: batch.status,
      templateCode: batch.templateCode,
      language: batch.language,
      draftCount: batch.draftCount,
      failedCount: batch.failedCount,
    },
  }).catch(() => undefined);

  void safeInvokeDomainEvent({
    eventType: "metadata_batch.completed",
    workspaceType: batch.workspaceType,
    workspaceId: batch.workspaceId,
    projectId: batch.projectId,
    entityId: batch.id,
    deduplicationKey: `metadata_batch.completed:${batch.id}`,
    payload: {
      status: batch.status,
      templateCode: batch.templateCode,
      language: batch.language,
    },
  });

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: batch.createdByUserId,
    projectId: batch.projectId,
    eventType: "ai_batch_completed",
    entityType: "ai_metadata_batch",
    entityId: batch.id,
    idempotencyKey: `ai_batch_completed:${batch.id}`,
    safeMetadata: {status: batch.status, templateCode: batch.templateCode},
  });

  const {recordActivityEventSafe} = await import("@/server/collaboration/activity");
  recordActivityEventSafe({
    workspaceType: batch.workspaceType,
    workspaceId: batch.workspaceId,
    projectId: batch.projectId,
    actorUserId: batch.createdByUserId,
    verb: "ai_batch.completed",
    entityType: "ai_metadata_batch",
    entityId: batch.id,
    summarySafe: `AI batch ${batch.status.replace(/_/g, " ")}`,
    metadataSafe: {
      status: batch.status,
      templateCode: batch.templateCode,
      language: batch.language,
    },
    idempotencyKey: `activity:ai_batch.completed:${batch.id}`,
  });
}

export async function syncAiMetadataBatchItemFromGeneration(generationId: string): Promise<void> {
  const db = getDb();
  const [item] = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(eq(aiMetadataBatchItems.generationId, generationId))
    .limit(1);
  if (!item) return;

  const [gen] = await db
    .select()
    .from(metadataGenerations)
    .where(eq(metadataGenerations.id, generationId))
    .limit(1);
  if (!gen) return;

  const mapped = generationStatusToItemStatus(gen.status);
  if (!mapped) return;

  const terminal = ["draft", "reviewed", "approved", "rejected", "failed", "cancelled", "stale"].includes(
    mapped,
  );
  await db
    .update(aiMetadataBatchItems)
    .set({
      status: mapped,
      lastErrorCode: gen.lastErrorCode,
      completedAt: terminal ? new Date() : item.completedAt,
      updatedAt: new Date(),
    })
    .where(eq(aiMetadataBatchItems.id, item.id));

  await recountAiMetadataBatch(item.batchId, item.projectId);
}

export async function cancelAiMetadataBatch(params: {
  userId: string;
  projectId: string;
  batchId: string;
}): Promise<
  | {ok: true; batch: AiMetadataBatchDto; items: AiMetadataBatchItemDto[]}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [batch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, params.batchId), eq(aiMetadataBatches.projectId, project.id)))
    .limit(1);
  if (!batch) return {ok: false, error: "AI_BATCH_NOT_FOUND"};
  if (TERMINAL_BATCH.includes(batch.status)) return {ok: false, error: "AI_BATCH_ALREADY_TERMINAL"};

  await db
    .update(aiMetadataBatches)
    .set({cancelRequested: true, status: "cancelling", updatedAt: new Date()})
    .where(eq(aiMetadataBatches.id, batch.id));

  const queuedItems = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(
      and(
        eq(aiMetadataBatchItems.batchId, batch.id),
        inArray(aiMetadataBatchItems.status, ["pending", "queued"]),
      ),
    );

  let released = 0;
  for (const item of queuedItems) {
    if (item.status === "pending") {
      await db
        .update(aiMetadataBatchItems)
        .set({status: "cancelled", completedAt: new Date(), updatedAt: new Date()})
        .where(eq(aiMetadataBatchItems.id, item.id));
      released++;
    } else if (item.generationId) {
      await cancelQueuedMetadataGeneration({
        userId: params.userId,
        projectId: project.id,
        generationId: item.generationId,
      });
      await db
        .update(aiMetadataBatchItems)
        .set({status: "cancelled", completedAt: new Date(), updatedAt: new Date()})
        .where(eq(aiMetadataBatchItems.id, item.id));
      released++;
    }
  }

  if (released > 0) {
    await db
      .update(aiMetadataBatches)
      .set({
        usageReleased: sql`${aiMetadataBatches.usageReleased} + ${released}`,
        usageReserved: sql`GREATEST(0, ${aiMetadataBatches.usageReserved} - ${released})`,
        updatedAt: new Date(),
      })
      .where(eq(aiMetadataBatches.id, batch.id));
  }

  const ws = workspaceFromProject(project);
  await writeIntegrationAudit({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    actorUserId: params.userId,
    action: "ai_metadata_batch.cancelled",
    targetEntityType: "ai_metadata_batch",
    targetEntityId: batch.id,
  });

  await recountAiMetadataBatch(batch.id, project.id);
  const [updated] = await db.select().from(aiMetadataBatches).where(eq(aiMetadataBatches.id, batch.id)).limit(1);
  const items = await db.select().from(aiMetadataBatchItems).where(eq(aiMetadataBatchItems.batchId, batch.id));
  return {ok: true, batch: toBatchDto(updated!), items: items.map(toItemDto)};
}

export async function retryFailedAiMetadataBatchItems(params: {
  userId: string;
  projectId: string;
  batchId: string;
}): Promise<
  | {ok: true; batch: AiMetadataBatchDto; items: AiMetadataBatchItemDto[]; retried: number}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [batch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, params.batchId), eq(aiMetadataBatches.projectId, project.id)))
    .limit(1);
  if (!batch) return {ok: false, error: "AI_BATCH_NOT_FOUND"};

  const failedItems = await db
    .select()
    .from(aiMetadataBatchItems)
    .where(
      and(eq(aiMetadataBatchItems.batchId, batch.id), eq(aiMetadataBatchItems.status, "failed")),
    );

  let retried = 0;
  for (const item of failedItems) {
    if (!item.generationId) continue;
    const result = await retryFailedMetadataGeneration({
      userId: params.userId,
      projectId: project.id,
      generationId: item.generationId,
    });
    if (result.ok) {
      retried++;
      await db
        .update(aiMetadataBatchItems)
        .set({status: "queued", lastErrorCode: null, updatedAt: new Date()})
        .where(eq(aiMetadataBatchItems.id, item.id));
    }
  }

  const ws = workspaceFromProject(project);
  await writeIntegrationAudit({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    actorUserId: params.userId,
    action: "ai_metadata_batch.retry",
    targetEntityType: "ai_metadata_batch",
    targetEntityId: batch.id,
    afterSummary: `retried=${retried}`,
  });

  if (retried > 0) {
    await db
      .update(aiMetadataBatches)
      .set({status: "running", cancelRequested: false, updatedAt: new Date()})
      .where(eq(aiMetadataBatches.id, batch.id));
  }

  await recountAiMetadataBatch(batch.id, project.id);
  const [updated] = await db.select().from(aiMetadataBatches).where(eq(aiMetadataBatches.id, batch.id)).limit(1);
  const items = await db.select().from(aiMetadataBatchItems).where(eq(aiMetadataBatchItems.batchId, batch.id));
  return {ok: true, batch: toBatchDto(updated!), items: items.map(toItemDto), retried};
}

export async function listAiMetadataBatches(params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<AiMetadataBatchDto[]> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(aiMetadataBatches)
    .where(eq(aiMetadataBatches.projectId, project.id))
    .orderBy(desc(aiMetadataBatches.createdAt))
    .limit(params.limit ?? 20);
  return rows.map(toBatchDto);
}

export async function getAiMetadataBatchWithItems(params: {
  userId: string;
  projectId: string;
  batchId: string;
}): Promise<
  | {ok: true; batch: AiMetadataBatchDto; items: AiMetadataBatchItemDto[]}
  | {ok: false; error: SafeAiBatchErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [batch] = await db
    .select()
    .from(aiMetadataBatches)
    .where(and(eq(aiMetadataBatches.id, params.batchId), eq(aiMetadataBatches.projectId, project.id)))
    .limit(1);
  if (!batch) return {ok: false, error: "AI_BATCH_NOT_FOUND"};
  const items = await db.select().from(aiMetadataBatchItems).where(eq(aiMetadataBatchItems.batchId, batch.id));
  return {ok: true, batch: toBatchDto(batch), items: items.map(toItemDto)};
}

export async function onImageInvalidateAiBatchItems(params: {
  projectId: string;
  imageId: string;
  reason: "IMAGE_NOT_FOUND" | "IMAGE_SOURCE_CHANGED";
}): Promise<void> {
  const db = getDb();
  const itemStatus: AiMetadataBatchItemStatus =
    params.reason === "IMAGE_NOT_FOUND" ? "cancelled" : "stale";

  const affected = await db
    .update(aiMetadataBatchItems)
    .set({
      status: itemStatus,
      lastErrorCode: params.reason,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(aiMetadataBatchItems.projectId, params.projectId),
        eq(aiMetadataBatchItems.imageId, params.imageId),
        inArray(aiMetadataBatchItems.status, ["pending", "queued", "running"]),
      ),
    )
    .returning({batchId: aiMetadataBatchItems.batchId});

  const batchIds = [...new Set(affected.map((a) => a.batchId))];
  for (const batchId of batchIds) {
    await recountAiMetadataBatch(batchId, params.projectId);
  }
}

export type {MetadataGenerationDto};
