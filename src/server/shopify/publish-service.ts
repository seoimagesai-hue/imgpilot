/**
 * Prompt 27 — Shopify publish job service (create + queue worker saga).
 *
 * Saga (mirrors `wordpress/publish-service.ts`):
 *   1. validating        — re-confirm connection/image/metadata freshness
 *   2. (read source bytes from private R2 — never logged)
 *   3. uploading_media    — skipped if remoteImageId already set (never re-upload on retry)
 *   4. remoteImageId persisted immediately after a successful upload
 *   5. updating_metadata  — alt text (best-effort correction after upload)
 *   6. verifying_remote   — GET the remote product image back (ground truth)
 *   7. media mapping upserted; job marked completed (or partially_completed if
 *      the upload succeeded but alt-text update/verify failed)
 *
 * Publish targets EXISTING products only — this saga never creates products,
 * variants, orders, or inventory records, and it never auto-deletes a Shopify
 * asset. A failed alt-text update or verify never rolls back the upload.
 */
import {and, desc, eq, isNull, lt} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {
  imageDerivatives,
  imageMetadataApproved,
  images,
  projects,
  shopifyMediaMappings,
  shopifyPublishJobs,
  type ApiWorkspaceType,
  type Image,
  type ShopifyConnection,
  type ShopifyFilenameMode,
  type ShopifyMediaMapping,
  type ShopifyPublishJob,
  type ShopifyPublishJobStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {assertPublishEligible} from "@/server/shopify/eligibility";
import {ShopifyError, isRetryableShopifyFailure} from "@/server/shopify/errors";
import {
  baseNameFromStorageKey,
  extensionForFormat,
  resolveRequestedFilename,
  SHOPIFY_MAX_MEDIA_BYTES,
  SHOPIFY_PUBLISH_CLAIM_BATCH,
  SHOPIFY_PUBLISH_LEASE_TTL_MS,
  SHOPIFY_PUBLISH_MAX_ATTEMPTS_DEFAULT,
} from "@/server/shopify/policy";
import {getProductImage, updateProductImageAlt, uploadProductImage, type ShopifyProductImageResult} from "@/server/shopify/client";
import {decryptConnectionCredentials, getConnectionRowForPublish} from "@/server/shopify/connections";
import {requireViewShopify} from "@/server/shopify/permissions";

export type ShopifyPublishJobDto = Omit<ShopifyPublishJob, never>;

function toDto(job: ShopifyPublishJob): ShopifyPublishJobDto {
  return job;
}

export async function createPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  imageId: string;
  shopifyProductId: string;
  derivativeId?: string | null;
  filenameMode: ShopifyFilenameMode;
  language: MetadataLanguage;
  idempotencyKey?: string | null;
  bulkParentId?: string | null;
}): Promise<ShopifyPublishJobDto> {
  const db = getDb();

  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(shopifyPublishJobs)
      .where(eq(shopifyPublishJobs.idempotencyKey, params.idempotencyKey))
      .limit(1);
    if (existing) return toDto(existing);
  }

  const eligibility = await assertPublishEligible({
    userId: params.userId,
    connectionId: params.connectionId,
    projectId: params.projectId,
    imageId: params.imageId,
    shopifyProductId: params.shopifyProductId,
    derivativeId: params.derivativeId,
    filenameMode: params.filenameMode,
    language: params.language,
  });

  const format = eligibility.derivative?.format ?? eligibility.image.detectedFormat ?? null;
  const extension = extensionForFormat(format);
  const requestedFilename = resolveRequestedFilename({
    filenameMode: params.filenameMode,
    currentBaseName: baseNameFromStorageKey(eligibility.sourceStorageKey),
    filenameSuggestion: eligibility.approvedMetadata.filenameSuggestion,
    extension,
  });

  const [row] = await db
    .insert(shopifyPublishJobs)
    .values({
      workspaceType: eligibility.workspaceType,
      workspaceId: eligibility.workspaceId,
      connectionId: eligibility.connection.id,
      projectId: eligibility.project.id,
      imageId: eligibility.image.id,
      shopifyProductId: eligibility.shopifyProductId,
      sourceType: eligibility.derivative ? "derivative" : "original",
      derivativeId: eligibility.derivative?.id ?? null,
      sourceStorageKey: eligibility.sourceStorageKey,
      sourceRevisionKey: eligibility.sourceStorageKey,
      metadataApprovalId: eligibility.approvedMetadata.id,
      metadataLanguage: params.language,
      filenameMode: params.filenameMode,
      requestedFilename,
      status: "queued",
      maxAttempts: SHOPIFY_PUBLISH_MAX_ATTEMPTS_DEFAULT,
      idempotencyKey: params.idempotencyKey ?? null,
      bulkParentId: params.bulkParentId ?? null,
    })
    .returning();
  if (!row) throw new ShopifyError("INTERNAL_ERROR", "Failed to create Shopify publish job.");

  await writeIntegrationAudit({
    workspaceType: eligibility.workspaceType,
    workspaceId: eligibility.workspaceId,
    actorUserId: params.userId,
    action: "shopify_publish_job.created",
    targetEntityType: "shopify_publish_job",
    targetEntityId: row.id,
    afterSummary: `connectionId=${eligibility.connection.id} imageId=${eligibility.image.id} productId=${eligibility.shopifyProductId}`,
  });

  return toDto(row);
}

/** Claim up to `limit` queued jobs for this worker via `FOR UPDATE SKIP LOCKED`. */
export async function claimQueuedShopifyJobs(params: {
  workerId: string;
  limit?: number;
}): Promise<ShopifyPublishJob[]> {
  const limit = Math.max(1, Math.min(params.limit ?? SHOPIFY_PUBLISH_CLAIM_BATCH, SHOPIFY_PUBLISH_CLAIM_BATCH));
  const sqlClient = getPostgresClient();
  const leaseExpiresAt = new Date(Date.now() + SHOPIFY_PUBLISH_LEASE_TTL_MS).toISOString();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE shopify_publish_jobs AS spj
    SET
      status = 'leased',
      attempt_count = spj.attempt_count + 1,
      started_at = coalesce(spj.started_at, now()),
      lease_owner = ${params.workerId},
      lease_expires_at = ${leaseExpiresAt}::timestamp,
      updated_at = now()
    WHERE spj.id IN (
      SELECT id
      FROM shopify_publish_jobs
      WHERE status = 'queued'
        AND attempt_count < max_attempts
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING *
  `;

  return rows.map(mapPublishJobSqlRow);
}

function mapPublishJobSqlRow(row: Record<string, unknown>): ShopifyPublishJob {
  return {
    id: String(row.id),
    workspaceType: row.workspace_type as ApiWorkspaceType,
    workspaceId: String(row.workspace_id),
    connectionId: String(row.connection_id),
    projectId: String(row.project_id),
    imageId: String(row.image_id),
    shopifyProductId: String(row.shopify_product_id),
    shopifyProductTitleSafe: (row.shopify_product_title_safe as string | null) ?? null,
    sourceType: row.source_type as ShopifyPublishJob["sourceType"],
    derivativeId: (row.derivative_id as string | null) ?? null,
    sourceStorageKey: String(row.source_storage_key),
    sourceRevisionKey: String(row.source_revision_key),
    metadataApprovalId: String(row.metadata_approval_id),
    metadataLanguage: row.metadata_language as MetadataLanguage,
    filenameMode: row.filename_mode as ShopifyFilenameMode,
    requestedFilename: String(row.requested_filename),
    status: row.status as ShopifyPublishJobStatus,
    remoteImageId: (row.remote_image_id as string | null) ?? null,
    attemptCount: Number(row.attempt_count ?? 0),
    maxAttempts: Number(row.max_attempts ?? SHOPIFY_PUBLISH_MAX_ATTEMPTS_DEFAULT),
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
    bulkParentId: (row.bulk_parent_id as string | null) ?? null,
    lastErrorCode: (row.last_error_code as string | null) ?? null,
    leaseOwner: (row.lease_owner as string | null) ?? null,
    leaseExpiresAt: row.lease_expires_at ? new Date(String(row.lease_expires_at)) : null,
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

async function setStatus(jobId: string, status: ShopifyPublishJobStatus): Promise<void> {
  const db = getDb();
  await db
    .update(shopifyPublishJobs)
    .set({status, updatedAt: new Date()})
    .where(eq(shopifyPublishJobs.id, jobId));
}

async function finalizeJob(
  job: ShopifyPublishJob,
  status: "completed" | "partially_completed" | "failed" | "cancelled",
  errorCode: string | null,
): Promise<void> {
  const db = getDb();
  await db
    .update(shopifyPublishJobs)
    .set({
      status,
      completedAt: new Date(),
      lastErrorCode: errorCode,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(shopifyPublishJobs.id, job.id));
}

async function upsertMediaMapping(params: {
  job: ShopifyPublishJob;
  image: Image;
  connection: ShopifyConnection;
  remoteImageId: string;
  verified: ShopifyProductImageResult;
}): Promise<ShopifyMediaMapping> {
  const db = getDb();
  const derivativeCondition = params.job.derivativeId
    ? eq(shopifyMediaMappings.derivativeId, params.job.derivativeId)
    : isNull(shopifyMediaMappings.derivativeId);

  const [existing] = await db
    .select()
    .from(shopifyMediaMappings)
    .where(
      and(
        eq(shopifyMediaMappings.connectionId, params.connection.id),
        eq(shopifyMediaMappings.shopifyProductId, params.job.shopifyProductId),
        eq(shopifyMediaMappings.imageId, params.image.id),
        eq(shopifyMediaMappings.sourceStorageKey, params.job.sourceStorageKey),
        eq(shopifyMediaMappings.metadataApprovalId, params.job.metadataApprovalId),
        derivativeCondition,
      ),
    )
    .limit(1);

  const now = new Date();
  const shared = {
    workspaceType: params.job.workspaceType,
    workspaceId: params.job.workspaceId,
    projectId: params.job.projectId,
    imageId: params.image.id,
    connectionId: params.connection.id,
    publishJobId: params.job.id,
    shopifyProductId: params.job.shopifyProductId,
    sourceStorageKey: params.job.sourceStorageKey,
    derivativeId: params.job.derivativeId,
    metadataApprovalId: params.job.metadataApprovalId,
    remoteImageId: params.remoteImageId,
    remoteMediaUrlSafe: params.verified.remoteMediaUrlSafe,
    remoteFilename: params.verified.remoteFilename || params.job.requestedFilename,
    remoteMimeType: params.verified.remoteMimeType,
    remoteWidth: params.verified.remoteWidth,
    remoteHeight: params.verified.remoteHeight,
    remoteAltSafe: params.verified.altSafe,
    publishStatus: "active" as const,
    lastVerifiedAt: now,
    staleAt: null,
    updatedAt: now,
  };

  if (existing) {
    const [updated] = await db
      .update(shopifyMediaMappings)
      .set(shared)
      .where(eq(shopifyMediaMappings.id, existing.id))
      .returning();
    return updated ?? {...existing, ...shared};
  }
  const [inserted] = await db
    .insert(shopifyMediaMappings)
    .values({...shared, publishedAt: now})
    .returning();
  if (!inserted) throw new ShopifyError("INTERNAL_ERROR", "Failed to record Shopify media mapping.");
  return inserted;
}

async function recordCompletionSideEffects(params: {
  job: ShopifyPublishJob;
  outcome: "completed" | "partially_completed";
  failureCode?: string | null;
}): Promise<void> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, params.job.projectId)).limit(1);
  if (!project) return;
  const entitlementUserId = await resolveEntitlementUserIdForProject(project);

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: entitlementUserId,
    projectId: params.job.projectId,
    imageId: params.job.imageId,
    eventType: "shopify_publish_completed",
    entityType: "shopify_publish_job",
    entityId: params.job.id,
    idempotencyKey: `shopify_publish_completed:${params.job.id}`,
    safeMetadata: {
      partial: params.outcome === "partially_completed",
      failureCode: params.failureCode ?? null,
    },
  });

  const {recordUsage} = await import("@/server/billing/entitlements");
  await recordUsage({
    userId: entitlementUserId,
    projectId: params.job.projectId,
    category: "shopify_publish",
    entityId: params.job.id,
    idempotencyKey: `shopify_publish_usage:${params.job.id}`,
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  if (params.outcome === "completed") {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "shopify.publish.completed",
      entityType: "shopify_publish_job",
      entityId: params.job.id,
      deduplicationKey: `shopify.publish.completed:${params.job.id}`,
      payload: {jobId: params.job.id, imageId: params.job.imageId, projectId: params.job.projectId},
    }).catch(() => undefined);
  } else {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "shopify.publish.partially_completed",
      entityType: "shopify_publish_job",
      entityId: params.job.id,
      deduplicationKey: `shopify.publish.partially_completed:${params.job.id}`,
      payload: {
        jobId: params.job.id,
        imageId: params.job.imageId,
        projectId: params.job.projectId,
        failureCode: params.failureCode ?? null,
      },
    }).catch(() => undefined);
  }
}

async function recordFailureSideEffects(job: ShopifyPublishJob, failureCode: string): Promise<void> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  const entitlementUserId = project ? await resolveEntitlementUserIdForProject(project) : job.workspaceId;

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: entitlementUserId,
    projectId: job.projectId,
    imageId: job.imageId,
    eventType: "shopify_publish_failed",
    entityType: "shopify_publish_job",
    entityId: job.id,
    idempotencyKey: `shopify_publish_failed:${job.id}`,
    safeMetadata: {failureCode},
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  await emitWebhookEvent({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    eventType: "shopify.publish.failed",
    entityType: "shopify_publish_job",
    entityId: job.id,
    deduplicationKey: `shopify.publish.failed:${job.id}`,
    payload: {jobId: job.id, imageId: job.imageId, projectId: job.projectId, failureCode},
  }).catch(() => undefined);
}

async function handleJobFailure(
  job: ShopifyPublishJob,
  error: ShopifyError,
): Promise<{ok: false; terminal: boolean}> {
  const db = getDb();
  const retryable = isRetryableShopifyFailure(error.code);

  if (retryable && job.attemptCount < job.maxAttempts) {
    await db
      .update(shopifyPublishJobs)
      .set({
        status: "queued",
        lastErrorCode: error.code,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(shopifyPublishJobs.id, job.id));
    return {ok: false, terminal: false};
  }

  await finalizeJob(job, "failed", error.code);
  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: null,
    action: "shopify_publish_job.failed",
    targetEntityType: "shopify_publish_job",
    targetEntityId: job.id,
    afterSummary: error.code,
  });
  await recordFailureSideEffects(job, error.code).catch(() => undefined);
  return {ok: false, terminal: true};
}

/** Execute (or terminally fail) one claimed publish job. Idempotent w.r.t. lease ownership. */
export async function executeShopifyPublishJob(params: {
  workerId: string;
  job: ShopifyPublishJob;
}): Promise<{ok: boolean; terminal: boolean}> {
  const db = getDb();
  const [current] = await db
    .select()
    .from(shopifyPublishJobs)
    .where(eq(shopifyPublishJobs.id, params.job.id))
    .limit(1);
  if (!current || current.leaseOwner !== params.workerId || current.status !== "leased") {
    return {ok: false, terminal: false};
  }
  const job = current;

  if (job.attemptCount > job.maxAttempts) {
    await finalizeJob(job, "failed", "MAX_ATTEMPTS_EXCEEDED");
    return {ok: false, terminal: true};
  }

  try {
    await setStatus(job.id, "validating");

    const connection = await getConnectionRowForPublish(job.workspaceType, job.workspaceId, job.connectionId);
    if (connection.status === "disabled" || connection.status === "disconnected") {
      throw new ShopifyError("CONNECTION_NOT_ACTIVE", "Shopify connection is no longer active.");
    }

    const [image] = await db.select().from(images).where(eq(images.id, job.imageId)).limit(1);
    if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
      throw new ShopifyError("IMAGE_NOT_ELIGIBLE", "Image is no longer eligible for publishing.");
    }
    if (image.storageKey !== job.sourceRevisionKey) {
      throw new ShopifyError("APPROVED_METADATA_STALE", "The source image changed since this job was queued.");
    }

    const [approved] = await db
      .select()
      .from(imageMetadataApproved)
      .where(eq(imageMetadataApproved.id, job.metadataApprovalId))
      .limit(1);
    if (!approved || approved.sourceStorageKey !== image.storageKey) {
      throw new ShopifyError("APPROVED_METADATA_STALE", "Approved metadata changed or is stale.");
    }

    let derivativeFormat: string | null = null;
    if (job.derivativeId) {
      const [derivative] = await db
        .select()
        .from(imageDerivatives)
        .where(eq(imageDerivatives.id, job.derivativeId))
        .limit(1);
      if (!derivative || derivative.status !== "active" || derivative.sourceStorageKey !== image.storageKey) {
        throw new ShopifyError("DERIVATIVE_NOT_ACTIVE", "Derivative is no longer active.");
      }
      derivativeFormat = derivative.format ?? derivative.mimeType ?? null;
    }

    const {accessToken} = await decryptConnectionCredentials(connection);

    let remoteImageId = job.remoteImageId;
    let uploadedAlt: string | null = null;
    if (!remoteImageId) {
      await setStatus(job.id, "uploading_media");
      const storage = await getObjectStorageProvider();
      const object = await storage.getObjectBuffer(job.sourceStorageKey, SHOPIFY_MAX_MEDIA_BYTES);
      const mimeType = object.contentType || derivativeFormat || image.detectedMimeType || "application/octet-stream";

      const uploaded = await uploadProductImage({
        shopDomain: connection.shopDomain,
        accessToken,
        productId: job.shopifyProductId,
        filename: job.requestedFilename,
        mimeType,
        bytes: object.body,
        alt: approved.altText,
      });
      remoteImageId = uploaded.remoteImageId;
      uploadedAlt = uploaded.altSafe;
      if (!remoteImageId) {
        throw new ShopifyError("SHOPIFY_UPLOAD_FAILED", "Shopify did not return an image id after upload.");
      }

      // Persist immediately — a retry must never re-upload once we have a remote id.
      await db
        .update(shopifyPublishJobs)
        .set({remoteImageId, updatedAt: new Date()})
        .where(eq(shopifyPublishJobs.id, job.id));
    }

    await setStatus(job.id, "updating_metadata");
    let metadataError: ShopifyError | null = null;
    let mediaResult: ShopifyProductImageResult | null = null;
    if (uploadedAlt !== approved.altText) {
      try {
        mediaResult = await updateProductImageAlt({
          shopDomain: connection.shopDomain,
          accessToken,
          productId: job.shopifyProductId,
          remoteImageId,
          alt: approved.altText,
        });
      } catch (error) {
        metadataError =
          error instanceof ShopifyError
            ? error
            : new ShopifyError("SHOPIFY_METADATA_UPDATE_FAILED", "Alt-text update failed.");
      }
    }

    await setStatus(job.id, "verifying_remote");
    let verifyError: ShopifyError | null = null;
    try {
      // GET is the ground truth for what Shopify actually persisted.
      mediaResult = await getProductImage({
        shopDomain: connection.shopDomain,
        accessToken,
        productId: job.shopifyProductId,
        remoteImageId,
      });
    } catch (error) {
      verifyError =
        error instanceof ShopifyError ? error : new ShopifyError("SHOPIFY_VERIFY_FAILED", "Verification failed.");
    }

    const resolvedMedia: ShopifyProductImageResult =
      mediaResult ?? {
        remoteImageId,
        remoteMediaUrlSafe: "",
        remoteFilename: job.requestedFilename,
        remoteMimeType: "",
        remoteWidth: null,
        remoteHeight: null,
        altSafe: uploadedAlt,
      };

    await upsertMediaMapping({job, image, connection, remoteImageId, verified: resolvedMedia});

    const softError = metadataError ?? verifyError;
    if (softError) {
      await finalizeJob(job, "partially_completed", softError.code);
      await writeIntegrationAudit({
        workspaceType: job.workspaceType,
        workspaceId: job.workspaceId,
        actorUserId: null,
        action: "shopify_publish_job.partially_completed",
        targetEntityType: "shopify_publish_job",
        targetEntityId: job.id,
        afterSummary: softError.code,
      });
      await recordCompletionSideEffects({
        job,
        outcome: "partially_completed",
        failureCode: softError.code,
      }).catch(() => undefined);
      return {ok: true, terminal: true};
    }

    await finalizeJob(job, "completed", null);
    await writeIntegrationAudit({
      workspaceType: job.workspaceType,
      workspaceId: job.workspaceId,
      actorUserId: null,
      action: "shopify_publish_job.completed",
      targetEntityType: "shopify_publish_job",
      targetEntityId: job.id,
    });
    await recordCompletionSideEffects({job, outcome: "completed"}).catch(() => undefined);
    return {ok: true, terminal: true};
  } catch (error) {
    const spError =
      error instanceof ShopifyError ? error : new ShopifyError("INTERNAL_ERROR", "Shopify publish failed.");
    return handleJobFailure(job, spError);
  }
}

/** Requeue jobs whose worker lease expired (crash / missed heartbeat). */
export async function recoverExpiredShopifyLeases(params?: {limit?: number}): Promise<number> {
  const db = getDb();
  const now = new Date();
  const result = await db
    .update(shopifyPublishJobs)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "LEASE_EXPIRED",
      updatedAt: now,
    })
    .where(and(eq(shopifyPublishJobs.status, "leased"), lt(shopifyPublishJobs.leaseExpiresAt, now)))
    .returning({id: shopifyPublishJobs.id});
  return result.slice(0, params?.limit ?? 50).length;
}

export async function retryPublishJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<ShopifyPublishJobDto> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "shopify.publish");
  if (!project) {
    throw new ShopifyError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(shopifyPublishJobs)
    .where(and(eq(shopifyPublishJobs.id, params.jobId), eq(shopifyPublishJobs.projectId, project.id)))
    .limit(1);
  if (!job) throw new ShopifyError("JOB_NOT_FOUND", "Publish job not found.");
  if (!["failed", "partially_completed", "stale"].includes(job.status)) {
    throw new ShopifyError("JOB_CONFLICT", "Only a failed, partially completed, or stale job can be retried.");
  }

  const [updated] = await db
    .update(shopifyPublishJobs)
    .set({
      status: "queued",
      attemptCount: 0,
      lastErrorCode: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(shopifyPublishJobs.id, job.id))
    .returning();
  if (!updated) throw new ShopifyError("INTERNAL_ERROR", "Failed to retry Shopify publish job.");

  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: params.userId,
    action: "shopify_publish_job.created",
    targetEntityType: "shopify_publish_job",
    targetEntityId: job.id,
    afterSummary: "manual retry",
  });

  return toDto(updated);
}

const RECENT_JOBS_DEFAULT_LIMIT = 20;
const RECENT_JOBS_MAX_LIMIT = 100;

/** Recent publish jobs for one connection — used by the connection detail page. */
export async function listRecentPublishJobsForConnection(params: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  limit?: number;
}): Promise<ShopifyPublishJobDto[]> {
  await requireViewShopify(params.actorUserId, params.workspaceType, params.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(shopifyPublishJobs)
    .where(
      and(
        eq(shopifyPublishJobs.workspaceType, params.workspaceType),
        eq(shopifyPublishJobs.workspaceId, params.workspaceId),
        eq(shopifyPublishJobs.connectionId, params.connectionId),
      ),
    )
    .orderBy(desc(shopifyPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}

/** Recent publish jobs for one project — used by the project-scoped publish page. */
export async function listRecentPublishJobsForProject(params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<ShopifyPublishJobDto[]> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "shopify.publish");
  if (!project) {
    throw new ShopifyError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(shopifyPublishJobs)
    .where(eq(shopifyPublishJobs.projectId, project.id))
    .orderBy(desc(shopifyPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}
