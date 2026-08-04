/**
 * Prompt 28 — Webflow publish job service (create + queue worker saga).
 *
 * Saga (mirrors `shopify/publish-service.ts`):
 *   1. validating          — re-confirm connection/mapping/image/metadata freshness
 *   2. creating_asset      — POST /sites/{siteId}/assets (skipped if remoteAssetId already set)
 *   3. uploading_asset     — multipart POST of the bytes to the pre-signed S3 uploadUrl
 *   4. verifying_asset     — GET the asset back (ground truth); remoteAssetId/Url
 *                            persisted immediately once verified — a retry never
 *                            re-uploads once the asset exists
 *   5. updating_cms_item   — PATCH only the mapped fieldData keys on the EXISTING item
 *   6. verifying_cms_item  — GET the item back (ground truth)
 *   7. media mapping upserted; job marked completed (or partially_completed if the
 *      asset upload succeeded but the CMS update/verify failed — a retry of a
 *      partially_completed job only repeats the CMS step, never the upload)
 *
 * This saga never creates collections/items, never archives/drafts/publishes
 * an item, and never calls the site-wide publish endpoint.
 */
import {and, desc, eq, isNull, lt} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {
  imageDerivatives,
  imageMetadataApproved,
  images,
  projects,
  webflowMediaMappings,
  webflowPublishJobs,
  type ApiWorkspaceType,
  type Image,
  type WebflowConnection,
  type WebflowFieldMapping,
  type WebflowFilenameMode,
  type WebflowMediaMapping,
  type WebflowPublishJob,
  type WebflowPublishJobStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {
  createAsset,
  getAsset,
  getCollectionItem,
  patchCollectionItem,
  uploadAssetBinary,
  type WebflowCollectionItemDetail,
} from "@/server/webflow/client";
import {decryptConnectionCredentials, getConnectionRowForPublish} from "@/server/webflow/connections";
import {assertPublishEligible} from "@/server/webflow/eligibility";
import {WebflowError, isRetryableWebflowFailure} from "@/server/webflow/errors";
import {getMappingRowForPublish} from "@/server/webflow/field-mappings";
import {
  baseNameFromStorageKey,
  extensionForFormat,
  isAllowedWebflowImageFormat,
  md5FileHash,
  mimeForFormat,
  resolveRequestedFilename,
  toPlainCmsText,
  WEBFLOW_MAX_MEDIA_BYTES,
  WEBFLOW_PUBLISH_CLAIM_BATCH,
  WEBFLOW_PUBLISH_LEASE_TTL_MS,
  WEBFLOW_PUBLISH_MAX_ATTEMPTS_DEFAULT,
} from "@/server/webflow/policy";
import {requireViewWebflow} from "@/server/webflow/permissions";

export type WebflowPublishJobDto = Omit<WebflowPublishJob, never>;

function toDto(job: WebflowPublishJob): WebflowPublishJobDto {
  return job;
}

export async function createPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  imageId: string;
  collectionId: string;
  cmsItemId: string;
  cmsItemNameSafe?: string | null;
  fieldMappingId: string;
  derivativeId?: string | null;
  filenameMode: WebflowFilenameMode;
  language: MetadataLanguage;
  idempotencyKey?: string | null;
  bulkParentId?: string | null;
}): Promise<WebflowPublishJobDto> {
  const db = getDb();

  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(webflowPublishJobs)
      .where(eq(webflowPublishJobs.idempotencyKey, params.idempotencyKey))
      .limit(1);
    if (existing) return toDto(existing);
  }

  const eligibility = await assertPublishEligible({
    userId: params.userId,
    connectionId: params.connectionId,
    projectId: params.projectId,
    imageId: params.imageId,
    collectionId: params.collectionId,
    cmsItemId: params.cmsItemId,
    fieldMappingId: params.fieldMappingId,
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
    .insert(webflowPublishJobs)
    .values({
      workspaceType: eligibility.workspaceType,
      workspaceId: eligibility.workspaceId,
      connectionId: eligibility.connection.id,
      projectId: eligibility.project.id,
      imageId: eligibility.image.id,
      collectionId: eligibility.collectionId,
      cmsItemId: eligibility.cmsItemId,
      cmsItemNameSafe: params.cmsItemNameSafe?.trim().slice(0, 300) || null,
      fieldMappingId: eligibility.fieldMapping.id,
      mappingVersion: eligibility.fieldMapping.mappingVersion,
      sourceType: eligibility.derivative ? "derivative" : "original",
      derivativeId: eligibility.derivative?.id ?? null,
      sourceStorageKey: eligibility.sourceStorageKey,
      sourceRevisionKey: eligibility.sourceStorageKey,
      metadataApprovalId: eligibility.approvedMetadata.id,
      metadataLanguage: params.language,
      filenameMode: params.filenameMode,
      requestedFilename,
      status: "queued",
      maxAttempts: WEBFLOW_PUBLISH_MAX_ATTEMPTS_DEFAULT,
      idempotencyKey: params.idempotencyKey ?? null,
      bulkParentId: params.bulkParentId ?? null,
    })
    .returning();
  if (!row) throw new WebflowError("INTERNAL_ERROR", "Failed to create Webflow publish job.");

  await writeIntegrationAudit({
    workspaceType: eligibility.workspaceType,
    workspaceId: eligibility.workspaceId,
    actorUserId: params.userId,
    action: "webflow_publish_job.created",
    targetEntityType: "webflow_publish_job",
    targetEntityId: row.id,
    afterSummary: `connectionId=${eligibility.connection.id} imageId=${eligibility.image.id} cmsItemId=${eligibility.cmsItemId}`,
  });

  return toDto(row);
}

/** Claim up to `limit` queued jobs for this worker via `FOR UPDATE SKIP LOCKED`. */
export async function claimQueuedWebflowJobs(params: {
  workerId: string;
  limit?: number;
}): Promise<WebflowPublishJob[]> {
  const limit = Math.max(1, Math.min(params.limit ?? WEBFLOW_PUBLISH_CLAIM_BATCH, WEBFLOW_PUBLISH_CLAIM_BATCH));
  const sqlClient = getPostgresClient();
  const leaseExpiresAt = new Date(Date.now() + WEBFLOW_PUBLISH_LEASE_TTL_MS).toISOString();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE webflow_publish_jobs AS wpj
    SET
      status = 'leased',
      attempt_count = wpj.attempt_count + 1,
      started_at = coalesce(wpj.started_at, now()),
      lease_owner = ${params.workerId},
      lease_expires_at = ${leaseExpiresAt}::timestamp,
      updated_at = now()
    WHERE wpj.id IN (
      SELECT id
      FROM webflow_publish_jobs
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

function mapPublishJobSqlRow(row: Record<string, unknown>): WebflowPublishJob {
  return {
    id: String(row.id),
    workspaceType: row.workspace_type as ApiWorkspaceType,
    workspaceId: String(row.workspace_id),
    connectionId: String(row.connection_id),
    projectId: String(row.project_id),
    imageId: String(row.image_id),
    collectionId: String(row.collection_id),
    cmsItemId: String(row.cms_item_id),
    cmsItemNameSafe: (row.cms_item_name_safe as string | null) ?? null,
    fieldMappingId: String(row.field_mapping_id),
    mappingVersion: Number(row.mapping_version ?? 1),
    sourceType: row.source_type as WebflowPublishJob["sourceType"],
    derivativeId: (row.derivative_id as string | null) ?? null,
    sourceStorageKey: String(row.source_storage_key),
    sourceRevisionKey: String(row.source_revision_key),
    metadataApprovalId: String(row.metadata_approval_id),
    metadataLanguage: row.metadata_language as MetadataLanguage,
    filenameMode: row.filename_mode as WebflowFilenameMode,
    requestedFilename: String(row.requested_filename),
    status: row.status as WebflowPublishJobStatus,
    remoteAssetId: (row.remote_asset_id as string | null) ?? null,
    remoteAssetUrlSafe: (row.remote_asset_url_safe as string | null) ?? null,
    attemptCount: Number(row.attempt_count ?? 0),
    maxAttempts: Number(row.max_attempts ?? WEBFLOW_PUBLISH_MAX_ATTEMPTS_DEFAULT),
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

async function setStatus(jobId: string, status: WebflowPublishJobStatus): Promise<void> {
  const db = getDb();
  await db
    .update(webflowPublishJobs)
    .set({status, updatedAt: new Date()})
    .where(eq(webflowPublishJobs.id, jobId));
}

async function finalizeJob(
  job: WebflowPublishJob,
  status: "completed" | "partially_completed" | "failed" | "cancelled",
  errorCode: string | null,
): Promise<void> {
  const db = getDb();
  await db
    .update(webflowPublishJobs)
    .set({
      status,
      completedAt: new Date(),
      lastErrorCode: errorCode,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(webflowPublishJobs.id, job.id));
}

function buildFieldDataPatch(params: {
  fieldMapping: WebflowFieldMapping;
  approvedAltText: string | null;
  approvedTitle: string | null;
  approvedCaption: string | null;
  approvedDescription: string | null;
  remoteAssetId: string;
  remoteAssetUrlSafe: string;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const imageKey = params.fieldMapping.imageFieldSlug || params.fieldMapping.imageFieldId;
  // Locked shape — Webflow v2 Image field value as an object referencing the uploaded asset.
  patch[imageKey] = {fileId: params.remoteAssetId, url: params.remoteAssetUrlSafe};

  if (params.fieldMapping.altFieldId) {
    const key = params.fieldMapping.altFieldSlug || params.fieldMapping.altFieldId;
    patch[key] = toPlainCmsText(params.approvedAltText);
  }
  if (params.fieldMapping.titleFieldId) {
    const key = params.fieldMapping.titleFieldSlug || params.fieldMapping.titleFieldId;
    patch[key] = toPlainCmsText(params.approvedTitle);
  }
  if (params.fieldMapping.captionFieldId) {
    const key = params.fieldMapping.captionFieldSlug || params.fieldMapping.captionFieldId;
    patch[key] = toPlainCmsText(params.approvedCaption);
  }
  if (params.fieldMapping.descriptionFieldId) {
    const key = params.fieldMapping.descriptionFieldSlug || params.fieldMapping.descriptionFieldId;
    patch[key] = toPlainCmsText(params.approvedDescription);
  }
  return patch;
}

async function upsertMediaMapping(params: {
  job: WebflowPublishJob;
  image: Image;
  connection: WebflowConnection;
  fieldMapping: WebflowFieldMapping;
  remoteAssetId: string;
  remoteAssetUrlSafe: string;
  remoteFilenameSafe: string;
  remoteMimeType: string;
}): Promise<WebflowMediaMapping> {
  const db = getDb();
  const derivativeCondition = params.job.derivativeId
    ? eq(webflowMediaMappings.derivativeId, params.job.derivativeId)
    : isNull(webflowMediaMappings.derivativeId);

  const [existing] = await db
    .select()
    .from(webflowMediaMappings)
    .where(
      and(
        eq(webflowMediaMappings.connectionId, params.connection.id),
        eq(webflowMediaMappings.collectionId, params.job.collectionId),
        eq(webflowMediaMappings.cmsItemId, params.job.cmsItemId),
        eq(webflowMediaMappings.imageId, params.image.id),
        eq(webflowMediaMappings.sourceStorageKey, params.job.sourceStorageKey),
        derivativeCondition,
        eq(webflowMediaMappings.metadataApprovalId, params.job.metadataApprovalId),
        eq(webflowMediaMappings.mappingVersion, params.job.mappingVersion),
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
    collectionId: params.job.collectionId,
    cmsItemId: params.job.cmsItemId,
    fieldMappingId: params.fieldMapping.id,
    mappingVersion: params.job.mappingVersion,
    sourceStorageKey: params.job.sourceStorageKey,
    derivativeId: params.job.derivativeId,
    metadataApprovalId: params.job.metadataApprovalId,
    remoteAssetId: params.remoteAssetId,
    remoteAssetUrlSafe: params.remoteAssetUrlSafe,
    remoteFilename: params.remoteFilenameSafe || params.job.requestedFilename,
    remoteMimeType: params.remoteMimeType,
    remoteWidth: null,
    remoteHeight: null,
    publishStatus: "active" as const,
    lastVerifiedAt: now,
    staleAt: null,
    updatedAt: now,
  };

  if (existing) {
    const [updated] = await db
      .update(webflowMediaMappings)
      .set(shared)
      .where(eq(webflowMediaMappings.id, existing.id))
      .returning();
    return updated ?? {...existing, ...shared};
  }
  const [inserted] = await db
    .insert(webflowMediaMappings)
    .values({...shared, publishedAt: now})
    .returning();
  if (!inserted) throw new WebflowError("INTERNAL_ERROR", "Failed to record Webflow media mapping.");
  return inserted;
}

async function recordCompletionSideEffects(params: {
  job: WebflowPublishJob;
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
    eventType: "webflow_publish_completed",
    entityType: "webflow_publish_job",
    entityId: params.job.id,
    idempotencyKey: `webflow_publish_completed:${params.job.id}`,
    safeMetadata: {
      partial: params.outcome === "partially_completed",
      failureCode: params.failureCode ?? null,
    },
  });

  const {recordUsage} = await import("@/server/billing/entitlements");
  await recordUsage({
    userId: entitlementUserId,
    projectId: params.job.projectId,
    category: "webflow_publish",
    entityId: params.job.id,
    idempotencyKey: `webflow_publish_usage:${params.job.id}`,
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  if (params.outcome === "completed") {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "webflow.publish.completed",
      entityType: "webflow_publish_job",
      entityId: params.job.id,
      deduplicationKey: `webflow.publish.completed:${params.job.id}`,
      payload: {jobId: params.job.id, imageId: params.job.imageId, projectId: params.job.projectId},
    }).catch(() => undefined);
  } else {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "webflow.publish.partially_completed",
      entityType: "webflow_publish_job",
      entityId: params.job.id,
      deduplicationKey: `webflow.publish.partially_completed:${params.job.id}`,
      payload: {
        jobId: params.job.id,
        imageId: params.job.imageId,
        projectId: params.job.projectId,
        failureCode: params.failureCode ?? null,
      },
    }).catch(() => undefined);
  }
}

async function recordFailureSideEffects(job: WebflowPublishJob, failureCode: string): Promise<void> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  const entitlementUserId = project ? await resolveEntitlementUserIdForProject(project) : job.workspaceId;

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: entitlementUserId,
    projectId: job.projectId,
    imageId: job.imageId,
    eventType: "webflow_publish_failed",
    entityType: "webflow_publish_job",
    entityId: job.id,
    idempotencyKey: `webflow_publish_failed:${job.id}`,
    safeMetadata: {failureCode},
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  await emitWebhookEvent({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    eventType: "webflow.publish.failed",
    entityType: "webflow_publish_job",
    entityId: job.id,
    deduplicationKey: `webflow.publish.failed:${job.id}`,
    payload: {jobId: job.id, imageId: job.imageId, projectId: job.projectId, failureCode},
  }).catch(() => undefined);

  if (failureCode === "MAPPING_STALE") {
    await emitWebhookEvent({
      workspaceType: job.workspaceType,
      workspaceId: job.workspaceId,
      eventType: "webflow.mapping.stale",
      entityType: "webflow_field_mapping",
      entityId: job.fieldMappingId,
      deduplicationKey: `webflow.mapping.stale:${job.fieldMappingId}:${job.id}`,
      payload: {fieldMappingId: job.fieldMappingId, jobId: job.id},
    }).catch(() => undefined);
  }
}

async function handleJobFailure(
  job: WebflowPublishJob,
  error: WebflowError,
): Promise<{ok: false; terminal: boolean}> {
  const db = getDb();
  const retryable = isRetryableWebflowFailure(error.code);

  if (retryable && job.attemptCount < job.maxAttempts) {
    await db
      .update(webflowPublishJobs)
      .set({
        status: "queued",
        lastErrorCode: error.code,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(webflowPublishJobs.id, job.id));
    return {ok: false, terminal: false};
  }

  await finalizeJob(job, "failed", error.code);
  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: null,
    action: "webflow_publish_job.failed",
    targetEntityType: "webflow_publish_job",
    targetEntityId: job.id,
    afterSummary: error.code,
  });
  await recordFailureSideEffects(job, error.code).catch(() => undefined);
  return {ok: false, terminal: true};
}

/** Execute (or terminally fail) one claimed publish job. Idempotent w.r.t. lease ownership. */
export async function executeWebflowPublishJob(params: {
  workerId: string;
  job: WebflowPublishJob;
}): Promise<{ok: boolean; terminal: boolean}> {
  const db = getDb();
  const [current] = await db
    .select()
    .from(webflowPublishJobs)
    .where(eq(webflowPublishJobs.id, params.job.id))
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
      throw new WebflowError("CONNECTION_NOT_ACTIVE", "Webflow connection is no longer active.");
    }
    if (!connection.remoteSiteId) {
      throw new WebflowError("WEBFLOW_SITE_NOT_FOUND", "This connection has no Webflow site selected.");
    }

    const fieldMapping = await getMappingRowForPublish(job.fieldMappingId);
    if (fieldMapping.staleAt || fieldMapping.mappingVersion !== job.mappingVersion) {
      throw new WebflowError("MAPPING_STALE", "The field mapping changed or is stale.");
    }

    const [image] = await db.select().from(images).where(eq(images.id, job.imageId)).limit(1);
    if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
      throw new WebflowError("IMAGE_NOT_ELIGIBLE", "Image is no longer eligible for publishing.");
    }
    if (image.storageKey !== job.sourceRevisionKey) {
      throw new WebflowError("APPROVED_METADATA_STALE", "The source image changed since this job was queued.");
    }

    const [approved] = await db
      .select()
      .from(imageMetadataApproved)
      .where(eq(imageMetadataApproved.id, job.metadataApprovalId))
      .limit(1);
    if (!approved || approved.sourceStorageKey !== image.storageKey) {
      throw new WebflowError("APPROVED_METADATA_STALE", "Approved metadata changed or is stale.");
    }

    let derivativeFormat: string | null = null;
    if (job.derivativeId) {
      const [derivative] = await db
        .select()
        .from(imageDerivatives)
        .where(eq(imageDerivatives.id, job.derivativeId))
        .limit(1);
      if (!derivative || derivative.status !== "active" || derivative.sourceStorageKey !== image.storageKey) {
        throw new WebflowError("DERIVATIVE_NOT_ACTIVE", "Derivative is no longer active.");
      }
      derivativeFormat = derivative.format ?? derivative.mimeType ?? null;
    }

    const format = derivativeFormat || image.detectedFormat || null;
    if (!isAllowedWebflowImageFormat(format)) {
      throw new WebflowError("ASSET_UNSUPPORTED_FORMAT", "Image format is not supported by Webflow.");
    }
    const mimeType = mimeForFormat(format, image.detectedMimeType || "application/octet-stream");

    const {accessToken} = await decryptConnectionCredentials(connection);

    let remoteAssetId = job.remoteAssetId;
    let remoteAssetUrlSafe = job.remoteAssetUrlSafe;
    let remoteFilenameSafe = job.requestedFilename;
    if (!remoteAssetId) {
      await setStatus(job.id, "creating_asset");
      const storage = await getObjectStorageProvider();
      const object = await storage.getObjectBuffer(job.sourceStorageKey, WEBFLOW_MAX_MEDIA_BYTES);
      if (object.body.byteLength > WEBFLOW_MAX_MEDIA_BYTES) {
        throw new WebflowError("ASSET_TOO_LARGE", "Image exceeds Webflow's 4 MiB asset limit.");
      }
      const fileHash = md5FileHash(object.body);
      const created = await createAsset(accessToken, connection.remoteSiteId, {
        fileName: job.requestedFilename,
        fileHash,
      });

      await setStatus(job.id, "uploading_asset");
      await uploadAssetBinary(
        created.uploadUrl,
        created.uploadDetails,
        object.body,
        object.contentType || mimeType,
        job.requestedFilename,
      );

      await setStatus(job.id, "verifying_asset");
      const verified = await getAsset(accessToken, connection.remoteSiteId, created.assetId);
      if (!verified.hostedUrlSafe) {
        throw new WebflowError("ASSET_VERIFY_FAILED", "Webflow did not return a hosted URL for the uploaded asset.");
      }
      remoteAssetId = verified.assetId || created.assetId;
      remoteAssetUrlSafe = verified.hostedUrlSafe;
      remoteFilenameSafe = verified.originalFileNameSafe || job.requestedFilename;

      // Persist immediately — a retry must never re-upload once the asset is verified.
      await db
        .update(webflowPublishJobs)
        .set({remoteAssetId, remoteAssetUrlSafe, updatedAt: new Date()})
        .where(eq(webflowPublishJobs.id, job.id));
    }

    await setStatus(job.id, "updating_cms_item");
    const fieldDataPatch = buildFieldDataPatch({
      fieldMapping,
      approvedAltText: approved.altText,
      approvedTitle: approved.title,
      approvedCaption: approved.caption,
      approvedDescription: approved.description,
      remoteAssetId,
      remoteAssetUrlSafe: remoteAssetUrlSafe ?? "",
    });

    let cmsError: WebflowError | null = null;
    try {
      await patchCollectionItem(accessToken, job.collectionId, job.cmsItemId, fieldDataPatch);
    } catch (error) {
      cmsError = error instanceof WebflowError ? error : new WebflowError("CMS_UPDATE_FAILED", "CMS item update failed.");
    }

    await setStatus(job.id, "verifying_cms_item");
    let verifyError: WebflowError | null = null;
    let verifiedItem: WebflowCollectionItemDetail | null = null;
    try {
      // GET is the ground truth for what Webflow actually persisted.
      verifiedItem = await getCollectionItem(accessToken, job.collectionId, job.cmsItemId);
    } catch (error) {
      verifyError =
        error instanceof WebflowError ? error : new WebflowError("CMS_VERIFY_FAILED", "CMS item verification failed.");
    }
    void verifiedItem;

    await upsertMediaMapping({
      job,
      image,
      connection,
      fieldMapping,
      remoteAssetId,
      remoteAssetUrlSafe: remoteAssetUrlSafe ?? "",
      remoteFilenameSafe,
      remoteMimeType: mimeType,
    });

    const softError = cmsError ?? verifyError;
    if (softError) {
      await finalizeJob(job, "partially_completed", softError.code);
      await writeIntegrationAudit({
        workspaceType: job.workspaceType,
        workspaceId: job.workspaceId,
        actorUserId: null,
        action: "webflow_publish_job.partially_completed",
        targetEntityType: "webflow_publish_job",
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
      action: "webflow_publish_job.completed",
      targetEntityType: "webflow_publish_job",
      targetEntityId: job.id,
    });
    await recordCompletionSideEffects({job, outcome: "completed"}).catch(() => undefined);
    return {ok: true, terminal: true};
  } catch (error) {
    const wfError = error instanceof WebflowError ? error : new WebflowError("INTERNAL_ERROR", "Webflow publish failed.");
    return handleJobFailure(job, wfError);
  }
}

/** Requeue jobs whose worker lease expired (crash / missed heartbeat). */
export async function recoverExpiredWebflowLeases(params?: {limit?: number}): Promise<number> {
  const db = getDb();
  const now = new Date();
  const result = await db
    .update(webflowPublishJobs)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "LEASE_EXPIRED",
      updatedAt: now,
    })
    .where(and(eq(webflowPublishJobs.status, "leased"), lt(webflowPublishJobs.leaseExpiresAt, now)))
    .returning({id: webflowPublishJobs.id});
  return result.slice(0, params?.limit ?? 50).length;
}

export async function retryPublishJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<WebflowPublishJobDto> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "webflow.publish");
  if (!project) {
    throw new WebflowError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(webflowPublishJobs)
    .where(and(eq(webflowPublishJobs.id, params.jobId), eq(webflowPublishJobs.projectId, project.id)))
    .limit(1);
  if (!job) throw new WebflowError("JOB_NOT_FOUND", "Publish job not found.");
  if (!["failed", "partially_completed", "stale"].includes(job.status)) {
    throw new WebflowError("JOB_CONFLICT", "Only a failed, partially completed, or stale job can be retried.");
  }

  const [updated] = await db
    .update(webflowPublishJobs)
    .set({
      status: "queued",
      attemptCount: 0,
      lastErrorCode: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(webflowPublishJobs.id, job.id))
    .returning();
  if (!updated) throw new WebflowError("INTERNAL_ERROR", "Failed to retry Webflow publish job.");

  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: params.userId,
    action: "webflow_publish_job.created",
    targetEntityType: "webflow_publish_job",
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
}): Promise<WebflowPublishJobDto[]> {
  await requireViewWebflow(params.actorUserId, params.workspaceType, params.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(webflowPublishJobs)
    .where(
      and(
        eq(webflowPublishJobs.workspaceType, params.workspaceType),
        eq(webflowPublishJobs.workspaceId, params.workspaceId),
        eq(webflowPublishJobs.connectionId, params.connectionId),
      ),
    )
    .orderBy(desc(webflowPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}

/** Recent publish jobs for one project — used by the project-scoped publish page. */
export async function listRecentPublishJobsForProject(params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<WebflowPublishJobDto[]> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "webflow.publish");
  if (!project) {
    throw new WebflowError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(webflowPublishJobs)
    .where(eq(webflowPublishJobs.projectId, project.id))
    .orderBy(desc(webflowPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}
