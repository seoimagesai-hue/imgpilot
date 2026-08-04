/**
 * AI metadata generation service — Prompt 17.
 * Creates queue jobs (generate_metadata); worker runs generation; humans approve drafts.
 */
import {and, desc, eq, gte, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageMetadataApproved,
  images,
  metadataGenerations,
  processingJobs,
  type MetadataGeneration,
} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import {AiDomainError, type SafeAiErrorCode} from "@/server/images/ai-errors";
import {prepareAnalysisImage} from "@/server/images/ai-analysis-image";
import {
  AI_MAX_GENERATIONS_PER_IMAGE_PER_DAY,
  AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY,
  AI_METADATA_PROMPT_VERSION,
  METADATA_OPERATION,
  getAiMetadataPolicy,
  isMetadataOutputLanguage,
  type MetadataOutputLanguage,
} from "@/server/images/ai-metadata-policy";
import {getTemplate, templateCodeFromPromptVersion, type AiMetadataTemplateCode} from "@/server/images/ai-metadata-templates";
import {metadataEditSchema, sanitizeFilenameSuggestion} from "@/server/images/ai-metadata-schema";
import {getAiConfigStatus, getImageMetadataProvider, isAiConfigured} from "@/server/images/ai-provider";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import {imageHasOpenReplacement} from "@/server/images/ready-queries";
import {READY_STATUS} from "@/server/images/ready-eligibility";
import {
  ACTIVE_JOB_STATUSES,
  findActiveJobForImage,
  findJobByIdempotencyKey,
  getOwnedImageForProcessing,
  insertProcessingJob,
  updateProcessingJob,
} from "@/server/images/processing-queries";
import {getOwnedProject} from "@/server/projects/queries";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {MAX_SOURCE_BYTES_FOR_PROCESSING} from "@/server/images/processing-policy";

const ELIGIBLE = new Set(["validated", READY_STATUS]);
const ACTIVE_META = ["queued", "generating", "validating_output"] as const;
const EDITABLE = new Set(["draft", "reviewed"]);

export type MetadataGenerationDto = {
  id: string;
  projectId: string;
  imageId: string;
  processingJobId: string | null;
  language: string;
  provider: string;
  model: string;
  promptVersion: string;
  status: string;
  altText: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  filenameSuggestion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  sourceStorageKeyPresent: true;
  lastErrorCode: string | null;
  createdAt: string;
  generatedAt: string | null;
  approvedAt: string | null;
};

export type ApprovedMetadataDto = {
  id: string;
  imageId: string;
  language: string;
  generationId: string;
  altText: string;
  title: string;
  caption: string | null;
  description: string;
  filenameSuggestion: string;
  approvedAt: string;
};

function toDto(row: MetadataGeneration): MetadataGenerationDto {
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

function hostnameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function getMetadataAiStatus() {
  const status = getAiConfigStatus();
  const policy = getAiMetadataPolicy();
  return {...status, policy};
}

export async function createMetadataGeneration(params: {
  userId: string;
  projectId: string;
  imageId: string;
  language?: string | null;
  idempotencyKey?: string;
  templateCode?: AiMetadataTemplateCode | string | null;
  /** When true, skip monthly allowance check (batch pre-reserved usage). */
  skipAllowanceCheck?: boolean;
}): Promise<
  | {ok: true; generation: MetadataGenerationDto; jobId: string}
  | {ok: false; error: SafeAiErrorCode}
> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  const ai = getAiConfigStatus();
  if (!ai.configured) return {ok: false, error: ai.reason};

  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const {resolveEntitlementUserIdForProject} = await import("@/server/organizations/access");
  const {assertMonthlyAllowance, resolveEntitlement} = await import(
    "@/server/billing/entitlements"
  );
  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.aiMetadataEnabled || !entitlement.writesAllowed) {
    return {
      ok: false,
      error: !entitlement.plan.aiMetadataEnabled
        ? "FEATURE_NOT_INCLUDED"
        : "SUBSCRIPTION_RESTRICTED",
    };
  }
  const allowance = params.skipAllowanceCheck
    ? {ok: true as const}
    : await assertMonthlyAllowance(entitlementUserId, "ai");
  if (!allowance.ok) {
    return {
      ok: false,
      error:
        allowance.error === "AI_LIMIT_REACHED" ? "AI_LIMIT_REACHED" : "SUBSCRIPTION_RESTRICTED",
    };
  }

  const language = (params.language ?? project.metadataLanguage) as string;
  if (!isMetadataOutputLanguage(language)) {
    return {ok: false, error: "METADATA_LANGUAGE_UNSUPPORTED"};
  }

  if (params.idempotencyKey) {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(metadataGenerations)
      .where(
        and(
          eq(metadataGenerations.projectId, project.id),
          eq(metadataGenerations.idempotencyKey, params.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing) {
      return {
        ok: true,
        generation: toDto(existing),
        jobId: existing.processingJobId ?? existing.id,
      };
    }
  }

  const image = await getOwnedImageForProcessing(params.userId, project.id, params.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (!ELIGIBLE.has(image.status) || !image.storageKey || !image.detectedFormat) {
    return {ok: false, error: "IMAGE_NOT_ELIGIBLE"};
  }
  if (await imageHasOpenReplacement(image.id, project.id)) {
    return {ok: false, error: "IMAGE_NOT_ELIGIBLE"};
  }

  const activeJob = await findActiveJobForImage(image.id, project.id, {
    operation: METADATA_OPERATION,
    preset: language,
  });
  if (activeJob) return {ok: false, error: "AI_GENERATION_CONFLICT"};

  const db = getDb();
  const [activeGen] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.imageId, image.id),
        eq(metadataGenerations.language, language),
        inArray(metadataGenerations.status, [...ACTIVE_META]),
      ),
    )
    .limit(1);
  if (activeGen) return {ok: false, error: "AI_GENERATION_CONFLICT"};

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
    return {ok: false, error: "AI_RATE_LIMITED"};
  }
  const [projectDay] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.projectId, project.id),
        gte(metadataGenerations.createdAt, dayStart),
      ),
    );
  if ((projectDay?.count ?? 0) >= AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY) {
    return {ok: false, error: "AI_RATE_LIMITED"};
  }

  const jobId = crypto.randomUUID();
  const generationId = crypto.randomUUID();
  const template = getTemplate(params.templateCode ?? "seo");
  const promptVersion = template?.promptVersion ?? AI_METADATA_PROMPT_VERSION;

  try {
    await insertProcessingJob({
      id: jobId,
      projectId: project.id,
      imageId: image.id,
      createdBy: params.userId,
      operation: METADATA_OPERATION,
      preset: language,
      status: "queued",
      sourceStorageKey: image.storageKey,
      sourceByteSize: image.storageSizeBytes ?? image.sizeBytes,
      sourceDetectedFormat: image.detectedFormat,
      sourceMimeType: image.detectedMimeType ?? image.mimeType,
      sourceWidth: image.width,
      sourceHeight: image.height,
      sourceEtag: image.etag,
      idempotencyKey: params.idempotencyKey ? `meta-job:${params.idempotencyKey}` : null,
      maxAttempts: 3,
    });

    await db.insert(metadataGenerations).values({
      id: generationId,
      projectId: project.id,
      imageId: image.id,
      processingJobId: jobId,
      sourceStorageKey: image.storageKey,
      language,
      provider: ai.provider,
      model: ai.model,
      promptVersion,
      status: "queued",
      createdBy: params.userId,
      idempotencyKey: params.idempotencyKey ?? null,
    });
  } catch {
    return {ok: false, error: "AI_GENERATION_CONFLICT"};
  }

  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(eq(metadataGenerations.id, generationId))
    .limit(1);
  return {ok: true, generation: toDto(row!), jobId};
}

/** Called from processing-service when operation is generate_metadata. */
export async function executeMetadataGenerationJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  if (!isAiConfigured()) return {ok: false, error: "AI_NOT_CONFIGURED"};
  const db = getDb();
  const [gen] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.processingJobId, params.jobId),
        eq(metadataGenerations.projectId, params.projectId),
      ),
    )
    .limit(1);
  if (!gen) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (gen.status === "draft" || gen.status === "approved" || gen.status === "reviewed") {
    return {ok: true, generation: toDto(gen)};
  }
  if (gen.status === "stale" || gen.status === "cancelled") {
    return {ok: false, error: "AI_GENERATION_STALE"};
  }

  const image = await getOwnedImageForProcessing(params.userId, params.projectId, gen.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    await failGeneration(gen.id, "IMAGE_NOT_FOUND");
    await updateProcessingJob(params.jobId, params.projectId, {
      status: "failed",
      failedAt: new Date(),
      lastErrorCode: "IMAGE_NOT_FOUND",
    });
    const {syncAiMetadataBatchFromGenerationTerminal} = await import(
      "@/server/images/ai-metadata-batch-queue-sync"
    );
    void syncAiMetadataBatchFromGenerationTerminal({
      generationId: gen.id,
      projectId: gen.projectId,
      generationStatus: "failed",
      errorCode: "IMAGE_NOT_FOUND",
    });
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (image.storageKey !== gen.sourceStorageKey) {
    await staleGeneration(gen.id, "IMAGE_SOURCE_CHANGED");
    await updateProcessingJob(params.jobId, params.projectId, {
      status: "stale",
      lastErrorCode: "SOURCE_REVISION_CHANGED",
    });
    const {syncAiMetadataBatchFromGenerationTerminal} = await import(
      "@/server/images/ai-metadata-batch-queue-sync"
    );
    void syncAiMetadataBatchFromGenerationTerminal({
      generationId: gen.id,
      projectId: gen.projectId,
      generationStatus: "stale",
      errorCode: "IMAGE_SOURCE_CHANGED",
    });
    return {ok: false, error: "IMAGE_SOURCE_CHANGED"};
  }
  if (await imageHasOpenReplacement(image.id, params.projectId)) {
    await staleGeneration(gen.id, "IMAGE_SOURCE_CHANGED");
    const {syncAiMetadataBatchFromGenerationTerminal} = await import(
      "@/server/images/ai-metadata-batch-queue-sync"
    );
    void syncAiMetadataBatchFromGenerationTerminal({
      generationId: gen.id,
      projectId: gen.projectId,
      generationStatus: "stale",
      errorCode: "IMAGE_SOURCE_CHANGED",
    });
    return {ok: false, error: "IMAGE_SOURCE_CHANGED"};
  }

  await db
    .update(metadataGenerations)
    .set({status: "generating", startedAt: new Date(), updatedAt: new Date()})
    .where(eq(metadataGenerations.id, gen.id));

  try {
    const storage = await getObjectStorageProvider();
    const source = await storage.getObjectBuffer(
      gen.sourceStorageKey,
      MAX_SOURCE_BYTES_FOR_PROCESSING,
    );
    const analysis = await prepareAnalysisImage(source.body);
    const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
    const provider = getImageMetadataProvider();

    await db
      .update(metadataGenerations)
      .set({status: "validating_output", updatedAt: new Date()})
      .where(eq(metadataGenerations.id, gen.id));

    const {recordUsage} = await import("@/server/billing/entitlements");
    await recordUsage({
      userId: gen.createdBy,
      projectId: gen.projectId,
      category: "ai",
      entityId: gen.id,
      idempotencyKey: `ai_provider_request:${gen.id}:${gen.attemptCount}`,
    });

    const templateCode = templateCodeFromPromptVersion(gen.promptVersion);
    const result = await provider.generateMetadata({
      analysis,
      context: {
        language: gen.language as MetadataOutputLanguage,
        projectName: project?.name,
        websiteHostname: hostnameFromUrl(project?.websiteUrl),
        businessDescription: project?.description,
        templateCode,
      },
    });

    // analysis bytes go out of scope — not persisted
    const [updated] = await db
      .update(metadataGenerations)
      .set({
        status: "draft",
        altText: result.output.altText,
        title: result.output.title,
        caption: result.output.caption,
        description: result.output.description,
        filenameSuggestion: result.output.filenameSuggestion,
        provider: result.provider,
        model: result.model,
        promptVersion: result.promptVersion,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        generatedAt: new Date(),
        lastErrorCode: null,
        lastErrorMessageSafe: null,
        updatedAt: new Date(),
      })
      .where(eq(metadataGenerations.id, gen.id))
      .returning();

    await updateProcessingJob(params.jobId, params.projectId, {
      status: "completed",
      completedAt: new Date(),
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
    });

    if (project) {
      const {workspaceFromProject} = await import("@/server/workflows/workspace");
      const {safeInvokeDomainEvent} = await import("@/server/workflows/dispatch");
      const ws = workspaceFromProject(project);
      void safeInvokeDomainEvent({
        eventType: "metadata.draft_created",
        workspaceType: ws.workspaceType,
        workspaceId: ws.workspaceId,
        projectId: gen.projectId,
        imageId: gen.imageId,
        entityId: gen.id,
        deduplicationKey: `metadata.draft_created:${gen.id}`,
        payload: {language: gen.language},
      });
    }

    const {syncAiMetadataBatchFromGenerationTerminal} = await import(
      "@/server/images/ai-metadata-batch-queue-sync"
    );
    void syncAiMetadataBatchFromGenerationTerminal({
      generationId: gen.id,
      projectId: gen.projectId,
      generationStatus: "draft",
    });

    return {ok: true, generation: toDto(updated!)};
  } catch (error) {
    const code =
      error instanceof AiDomainError
        ? error.code
        : error instanceof Error && error.message === "AI_RESPONSE_INVALID"
          ? "AI_RESPONSE_INVALID"
          : "AI_PROVIDER_UNAVAILABLE";

    const retryable = new Set([
      "AI_PROVIDER_UNAVAILABLE",
      "AI_RATE_LIMITED",
      "AI_REQUEST_TIMEOUT",
      "AI_RESPONSE_INVALID",
    ]);
    const [job] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.id, params.jobId))
      .limit(1);
    const canRetry =
      Boolean(job) &&
      retryable.has(code) &&
      (job?.attemptCount ?? 99) < (job?.maxAttempts ?? 0);

    if (canRetry && job) {
      await db
        .update(metadataGenerations)
        .set({
          status: "queued",
          lastErrorCode: code,
          lastErrorMessageSafe: code,
          updatedAt: new Date(),
        })
        .where(eq(metadataGenerations.id, gen.id));
      await updateProcessingJob(params.jobId, params.projectId, {
        status: "queued",
        lastErrorCode: code,
        lastErrorMessageSafe: code,
        leaseOwner: null,
        leaseExpiresAt: null,
        heartbeatAt: null,
      });
      return {ok: false, error: code};
    }

    await failGeneration(gen.id, code);
    const limitReached =
      Boolean(job) && (job!.attemptCount >= job!.maxAttempts || !retryable.has(code));
    await updateProcessingJob(params.jobId, params.projectId, {
      status: "failed",
      failedAt: new Date(),
      lastErrorCode: limitReached && retryable.has(code) ? "AI_RETRY_LIMIT_REACHED" : code,
      lastErrorMessageSafe: code,
      leaseOwner: null,
      leaseExpiresAt: null,
    });

    const {syncAiMetadataBatchFromGenerationTerminal} = await import(
      "@/server/images/ai-metadata-batch-queue-sync"
    );
    void syncAiMetadataBatchFromGenerationTerminal({
      generationId: gen.id,
      projectId: gen.projectId,
      generationStatus: "failed",
      errorCode: code,
    });

    return {ok: false, error: code};
  }
}

async function failGeneration(id: string, code: string) {
  const db = getDb();
  await db
    .update(metadataGenerations)
    .set({
      status: "failed",
      failedAt: new Date(),
      lastErrorCode: code,
      lastErrorMessageSafe: code,
      updatedAt: new Date(),
    })
    .where(eq(metadataGenerations.id, id));
}

async function staleGeneration(id: string, code: string) {
  const db = getDb();
  await db
    .update(metadataGenerations)
    .set({
      status: "stale",
      lastErrorCode: code,
      lastErrorMessageSafe: code,
      updatedAt: new Date(),
    })
    .where(eq(metadataGenerations.id, id));
}

export async function getMetadataGeneration(params: {
  userId: string;
  projectId: string;
  generationId: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "projects.view");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  return {ok: true, generation: toDto(row)};
}

export async function listMetadataGenerations(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<MetadataGenerationDto[]> {
  const project = await getOwnedProject(params.userId, params.projectId, "projects.view");
  if (!project) return [];
  const image = await getOwnedImageForProcessing(params.userId, project.id, params.imageId);
  if (!image) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.projectId, project.id),
        eq(metadataGenerations.imageId, params.imageId),
      ),
    )
    .orderBy(desc(metadataGenerations.createdAt))
    .limit(20);
  return rows.map(toDto);
}

export async function getApprovedMetadata(params: {
  userId: string;
  projectId: string;
  imageId: string;
  language?: string;
}): Promise<ApprovedMetadataDto | null> {
  const project = await getOwnedProject(params.userId, params.projectId, "projects.view");
  if (!project) return null;
  const language = (params.language ?? project.metadataLanguage) as MetadataOutputLanguage;
  const db = getDb();
  const [row] = await db
    .select()
    .from(imageMetadataApproved)
    .where(
      and(
        eq(imageMetadataApproved.projectId, project.id),
        eq(imageMetadataApproved.imageId, params.imageId),
        eq(imageMetadataApproved.language, language),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    imageId: row.imageId,
    language: row.language,
    generationId: row.generationId,
    altText: row.altText,
    title: row.title,
    caption: row.caption,
    description: row.description,
    filenameSuggestion: row.filenameSuggestion,
    approvedAt: row.approvedAt.toISOString(),
  };
}

export async function saveMetadataEdits(params: {
  userId: string;
  projectId: string;
  generationId: string;
  altText: string;
  title: string;
  caption?: string | null;
  description: string;
  filenameSuggestion: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.edit");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const parsed = metadataEditSchema.safeParse({
    altText: params.altText,
    title: params.title,
    caption: params.caption ?? null,
    description: params.description,
    filenameSuggestion: params.filenameSuggestion,
  });
  if (!parsed.success) return {ok: false, error: "METADATA_VALIDATION_FAILED"};

  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (!EDITABLE.has(row.status)) return {ok: false, error: "METADATA_NOT_APPROVABLE"};

  const image = await getOwnedImageForProcessing(params.userId, project.id, row.imageId);
  if (!image || image.storageKey !== row.sourceStorageKey) {
    return {ok: false, error: "AI_GENERATION_STALE"};
  }

  const [updated] = await db
    .update(metadataGenerations)
    .set({
      altText: parsed.data.altText,
      title: parsed.data.title,
      caption: parsed.data.caption ?? null,
      description: parsed.data.description,
      filenameSuggestion: sanitizeFilenameSuggestion(parsed.data.filenameSuggestion),
      status: "reviewed",
      reviewedAt: new Date(),
      updatedBy: params.userId,
      updatedAt: new Date(),
    })
    .where(eq(metadataGenerations.id, row.id))
    .returning();
  return {ok: true, generation: toDto(updated!)};
}

export async function approveMetadataGeneration(params: {
  userId: string;
  projectId: string;
  generationId: string;
}): Promise<
  | {ok: true; generation: MetadataGenerationDto; approved: ApprovedMetadataDto}
  | {ok: false; error: SafeAiErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.approve");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (row.status !== "draft" && row.status !== "reviewed") {
    return {ok: false, error: "METADATA_NOT_APPROVABLE"};
  }
  if (!row.altText || !row.title || !row.description || !row.filenameSuggestion) {
    return {ok: false, error: "METADATA_VALIDATION_FAILED"};
  }

  const image = await getOwnedImageForProcessing(params.userId, project.id, row.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (image.storageKey !== row.sourceStorageKey) {
    return {ok: false, error: "AI_GENERATION_STALE"};
  }

  const approvedId = crypto.randomUUID();
  await db
    .insert(imageMetadataApproved)
    .values({
      id: approvedId,
      projectId: project.id,
      imageId: row.imageId,
      language: row.language,
      generationId: row.id,
      sourceStorageKey: row.sourceStorageKey,
      altText: row.altText,
      title: row.title,
      caption: row.caption,
      description: row.description,
      filenameSuggestion: row.filenameSuggestion,
      approvedBy: params.userId,
    })
    .onConflictDoUpdate({
      target: [imageMetadataApproved.imageId, imageMetadataApproved.language],
      set: {
        generationId: row.id,
        sourceStorageKey: row.sourceStorageKey,
        altText: row.altText,
        title: row.title,
        caption: row.caption,
        description: row.description,
        filenameSuggestion: row.filenameSuggestion,
        approvedBy: params.userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  const [updated] = await db
    .update(metadataGenerations)
    .set({
      status: "approved",
      approvedAt: new Date(),
      updatedBy: params.userId,
      updatedAt: new Date(),
    })
    .where(eq(metadataGenerations.id, row.id))
    .returning();

  const approved = await getApprovedMetadata({
    userId: params.userId,
    projectId: project.id,
    imageId: row.imageId,
    language: row.language,
  });

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: params.userId,
    projectId: project.id,
    imageId: row.imageId,
    eventType: "metadata_approved",
    entityType: "metadata_generation",
    entityId: row.id,
    idempotencyKey: `metadata_approved:${row.id}`,
  });

  const {workspaceFromProject} = await import("@/server/workflows/workspace");
  const ws = workspaceFromProject(project);
  const {recordActivityEventSafe} = await import("@/server/collaboration/activity");
  recordActivityEventSafe({
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    organizationId: project.organizationId,
    projectId: project.id,
    actorUserId: params.userId,
    verb: "metadata.approved",
    entityType: "metadata_generation",
    entityId: row.id,
    summarySafe: "Metadata approved",
    metadataSafe: {imageId: row.imageId, language: row.language},
    idempotencyKey: `activity:metadata.approved:${row.id}`,
  });

  const {safeInvokeDomainEvent} = await import("@/server/workflows/dispatch");
  void safeInvokeDomainEvent({
    eventType: "metadata.approved",
    workspaceType: ws.workspaceType,
    workspaceId: ws.workspaceId,
    projectId: project.id,
    imageId: row.imageId,
    entityId: row.id,
    actorUserId: params.userId,
    deduplicationKey: `metadata.approved:${row.id}`,
    payload: {
      language: row.language,
      metadataApproved: true,
    },
  });

  return {ok: true, generation: toDto(updated!), approved: approved!};
}

export async function rejectMetadataGeneration(params: {
  userId: string;
  projectId: string;
  generationId: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.approve");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (!EDITABLE.has(row.status) && row.status !== "draft") {
    return {ok: false, error: "METADATA_NOT_APPROVABLE"};
  }
  const [updated] = await db
    .update(metadataGenerations)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      updatedBy: params.userId,
      updatedAt: new Date(),
    })
    .where(eq(metadataGenerations.id, row.id))
    .returning();
  return {ok: true, generation: toDto(updated!)};
}

export async function cancelQueuedMetadataGeneration(params: {
  userId: string;
  projectId: string;
  generationId: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (row.status !== "queued") return {ok: false, error: "AI_GENERATION_CONFLICT"};

  const [updated] = await db
    .update(metadataGenerations)
    .set({status: "cancelled", updatedAt: new Date(), updatedBy: params.userId})
    .where(eq(metadataGenerations.id, row.id))
    .returning();
  if (row.processingJobId) {
    await updateProcessingJob(row.processingJobId, project.id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }
  return {ok: true, generation: toDto(updated!)};
}

/** User-initiated retry for a failed generation (requeues linked processing job). */
export async function retryFailedMetadataGeneration(params: {
  userId: string;
  projectId: string;
  generationId: string;
}): Promise<{ok: true; generation: MetadataGenerationDto} | {ok: false; error: SafeAiErrorCode}> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [row] = await db
    .select()
    .from(metadataGenerations)
    .where(
      and(
        eq(metadataGenerations.id, params.generationId),
        eq(metadataGenerations.projectId, project.id),
      ),
    )
    .limit(1);
  if (!row) return {ok: false, error: "AI_GENERATION_NOT_FOUND"};
  if (row.status !== "failed") return {ok: false, error: "AI_GENERATION_CONFLICT"};
  if (row.attemptCount >= row.maxAttempts) return {ok: false, error: "AI_RETRY_LIMIT_REACHED"};

  const image = await getOwnedImageForProcessing(params.userId, project.id, row.imageId);
  if (!image || image.deletedAt || image.storageKey !== row.sourceStorageKey) {
    return {ok: false, error: "AI_GENERATION_STALE"};
  }

  if (row.processingJobId) {
    await updateProcessingJob(row.processingJobId, project.id, {
      status: "queued",
      lastErrorCode: null,
      lastErrorMessageSafe: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
    });
  }
  const [updated] = await db
    .update(metadataGenerations)
    .set({
      status: "queued",
      lastErrorCode: null,
      lastErrorMessageSafe: null,
      attemptCount: sql`${metadataGenerations.attemptCount} + 1`,
      updatedAt: new Date(),
      updatedBy: params.userId,
    })
    .where(eq(metadataGenerations.id, row.id))
    .returning();
  return {ok: true, generation: toDto(updated!)};
}

/** Invalidate pending/active metadata when image deleted or replaced. */
export async function onImageInvalidateMetadata(params: {
  projectId: string;
  imageId: string;
  reason: "IMAGE_NOT_FOUND" | "IMAGE_SOURCE_CHANGED";
}): Promise<void> {
  const db = getDb();
  await db
    .update(metadataGenerations)
    .set({
      status: params.reason === "IMAGE_NOT_FOUND" ? "cancelled" : "stale",
      lastErrorCode: params.reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(metadataGenerations.projectId, params.projectId),
        eq(metadataGenerations.imageId, params.imageId),
        inArray(metadataGenerations.status, [
          "queued",
          "generating",
          "validating_output",
          "draft",
          "reviewed",
        ]),
      ),
    );

  // Also cancel linked queued processing jobs
  await db
    .update(processingJobs)
    .set({
      status: params.reason === "IMAGE_NOT_FOUND" ? "cancelled" : "stale",
      lastErrorCode: params.reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processingJobs.projectId, params.projectId),
        eq(processingJobs.imageId, params.imageId),
        eq(processingJobs.operation, METADATA_OPERATION),
        inArray(processingJobs.status, [...ACTIVE_JOB_STATUSES]),
      ),
    );

  const {onImageInvalidateAiBatchItems} = await import("@/server/images/ai-metadata-batch-service");
  void onImageInvalidateAiBatchItems({
    projectId: params.projectId,
    imageId: params.imageId,
    reason: params.reason,
  });
}

export async function getProjectMetadataSummary(params: {
  userId: string;
  projectId: string;
}): Promise<{
  eligible: number;
  drafts: number;
  reviewed: number;
  approved: number;
  failed: number;
  stale: number;
} | null> {
  const project = await getOwnedProject(params.userId, params.projectId, "metadata.generate");
  if (!project) return null;
  const db = getDb();
  const [eligibleRow] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(images)
    .where(
      and(
        eq(images.projectId, project.id),
        inArray(images.status, ["validated", READY_STATUS]),
      ),
    );
  const gens = await db
    .select({status: metadataGenerations.status})
    .from(metadataGenerations)
    .where(eq(metadataGenerations.projectId, project.id))
    .limit(500);
  const counts = {drafts: 0, reviewed: 0, approved: 0, failed: 0, stale: 0};
  for (const g of gens) {
    if (g.status === "draft") counts.drafts++;
    else if (g.status === "reviewed") counts.reviewed++;
    else if (g.status === "approved") counts.approved++;
    else if (g.status === "failed") counts.failed++;
    else if (g.status === "stale") counts.stale++;
  }
  return {eligible: eligibleRow?.count ?? 0, ...counts};
}

export {getAiMetadataPolicy, isAiConfigured, findJobByIdempotencyKey};
