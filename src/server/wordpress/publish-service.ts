/**
 * Prompt 26 — WordPress publish job service (create + queue worker saga).
 *
 * Saga (mirrors the webhook delivery / export job lease pattern):
 *   1. validating        — re-confirm connection/image/metadata freshness
 *   2. (read source bytes from private R2 — never logged)
 *   3. uploading_media    — skipped if remoteMediaId already set (never re-upload on retry)
 *   4. remoteMediaId persisted immediately after a successful upload
 *   5. updating_metadata  — title/alt/caption/description
 *   6. verifying_remote   — GET the remote media item back
 *   7. media mapping upserted; job marked completed (or partially_completed if
 *      the upload succeeded but metadata/verify failed)
 */
import {and, desc, eq, isNull, lt} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {
  imageDerivatives,
  imageMetadataApproved,
  images,
  projects,
  wordpressMediaMappings,
  wordpressPublishJobs,
  type ApiWorkspaceType,
  type Image,
  type WordpressConnection,
  type WordpressFilenameMode,
  type WordpressMediaMapping,
  type WordpressPublishJob,
  type WordpressPublishJobStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {assertPublishEligible} from "@/server/wordpress/eligibility";
import {WordPressError, isRetryableWordPressFailure} from "@/server/wordpress/errors";
import {
  baseNameFromStorageKey,
  extensionForFormat,
  resolveRequestedFilename,
  WORDPRESS_MAX_MEDIA_BYTES,
  WORDPRESS_PUBLISH_CLAIM_BATCH,
  WORDPRESS_PUBLISH_LEASE_TTL_MS,
  WORDPRESS_PUBLISH_MAX_ATTEMPTS_DEFAULT,
} from "@/server/wordpress/policy";
import {getMedia, updateMedia, uploadMedia, type WordpressMediaResult} from "@/server/wordpress/client";
import {decryptConnectionCredentials, getConnectionRowForPublish} from "@/server/wordpress/connections";
import {requireViewWordpress} from "@/server/wordpress/permissions";

export type WordpressPublishJobDto = Omit<WordpressPublishJob, never>;

function toDto(job: WordpressPublishJob): WordpressPublishJobDto {
  return job;
}

export async function createPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  imageId: string;
  derivativeId?: string | null;
  filenameMode: WordpressFilenameMode;
  language: MetadataLanguage;
  idempotencyKey?: string | null;
  bulkParentId?: string | null;
}): Promise<WordpressPublishJobDto> {
  const db = getDb();

  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(wordpressPublishJobs)
      .where(eq(wordpressPublishJobs.idempotencyKey, params.idempotencyKey))
      .limit(1);
    if (existing) return toDto(existing);
  }

  const eligibility = await assertPublishEligible({
    userId: params.userId,
    connectionId: params.connectionId,
    projectId: params.projectId,
    imageId: params.imageId,
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
    .insert(wordpressPublishJobs)
    .values({
      workspaceType: eligibility.workspaceType,
      workspaceId: eligibility.workspaceId,
      connectionId: eligibility.connection.id,
      projectId: eligibility.project.id,
      imageId: eligibility.image.id,
      sourceType: eligibility.derivative ? "derivative" : "original",
      derivativeId: eligibility.derivative?.id ?? null,
      sourceStorageKey: eligibility.sourceStorageKey,
      sourceRevisionKey: eligibility.sourceStorageKey,
      metadataApprovalId: eligibility.approvedMetadata.id,
      metadataLanguage: params.language,
      filenameMode: params.filenameMode,
      requestedFilename,
      status: "queued",
      maxAttempts: WORDPRESS_PUBLISH_MAX_ATTEMPTS_DEFAULT,
      idempotencyKey: params.idempotencyKey ?? null,
      bulkParentId: params.bulkParentId ?? null,
    })
    .returning();
  if (!row) throw new WordPressError("INTERNAL_ERROR", "Failed to create WordPress publish job.");

  await writeIntegrationAudit({
    workspaceType: eligibility.workspaceType,
    workspaceId: eligibility.workspaceId,
    actorUserId: params.userId,
    action: "wordpress_publish_job.created",
    targetEntityType: "wordpress_publish_job",
    targetEntityId: row.id,
    afterSummary: `connectionId=${eligibility.connection.id} imageId=${eligibility.image.id}`,
  });

  return toDto(row);
}

/** Claim up to `limit` queued jobs for this worker via `FOR UPDATE SKIP LOCKED`. */
export async function claimQueuedWordpressJobs(params: {
  workerId: string;
  limit?: number;
}): Promise<WordpressPublishJob[]> {
  const limit = Math.max(1, Math.min(params.limit ?? WORDPRESS_PUBLISH_CLAIM_BATCH, WORDPRESS_PUBLISH_CLAIM_BATCH));
  const sqlClient = getPostgresClient();
  const leaseExpiresAt = new Date(Date.now() + WORDPRESS_PUBLISH_LEASE_TTL_MS).toISOString();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE wordpress_publish_jobs AS wpj
    SET
      status = 'leased',
      attempt_count = wpj.attempt_count + 1,
      started_at = coalesce(wpj.started_at, now()),
      lease_owner = ${params.workerId},
      lease_expires_at = ${leaseExpiresAt}::timestamp,
      updated_at = now()
    WHERE wpj.id IN (
      SELECT id
      FROM wordpress_publish_jobs
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

function mapPublishJobSqlRow(row: Record<string, unknown>): WordpressPublishJob {
  return {
    id: String(row.id),
    workspaceType: row.workspace_type as ApiWorkspaceType,
    workspaceId: String(row.workspace_id),
    connectionId: String(row.connection_id),
    projectId: String(row.project_id),
    imageId: String(row.image_id),
    sourceType: row.source_type as WordpressPublishJob["sourceType"],
    derivativeId: (row.derivative_id as string | null) ?? null,
    sourceStorageKey: String(row.source_storage_key),
    sourceRevisionKey: String(row.source_revision_key),
    metadataApprovalId: String(row.metadata_approval_id),
    metadataLanguage: row.metadata_language as MetadataLanguage,
    filenameMode: row.filename_mode as WordpressFilenameMode,
    requestedFilename: String(row.requested_filename),
    status: row.status as WordpressPublishJobStatus,
    remoteMediaId: (row.remote_media_id as string | null) ?? null,
    attemptCount: Number(row.attempt_count ?? 0),
    maxAttempts: Number(row.max_attempts ?? WORDPRESS_PUBLISH_MAX_ATTEMPTS_DEFAULT),
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

async function setStatus(jobId: string, status: WordpressPublishJobStatus): Promise<void> {
  const db = getDb();
  await db
    .update(wordpressPublishJobs)
    .set({status, updatedAt: new Date()})
    .where(eq(wordpressPublishJobs.id, jobId));
}

async function finalizeJob(
  job: WordpressPublishJob,
  status: "completed" | "partially_completed" | "failed" | "cancelled",
  errorCode: string | null,
): Promise<void> {
  const db = getDb();
  await db
    .update(wordpressPublishJobs)
    .set({
      status,
      completedAt: new Date(),
      lastErrorCode: errorCode,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(wordpressPublishJobs.id, job.id));
}

async function upsertMediaMapping(params: {
  job: WordpressPublishJob;
  image: Image;
  connection: WordpressConnection;
  remoteMediaId: string;
  verified: WordpressMediaResult;
}): Promise<WordpressMediaMapping> {
  const db = getDb();
  const derivativeCondition = params.job.derivativeId
    ? eq(wordpressMediaMappings.derivativeId, params.job.derivativeId)
    : isNull(wordpressMediaMappings.derivativeId);

  const [existing] = await db
    .select()
    .from(wordpressMediaMappings)
    .where(
      and(
        eq(wordpressMediaMappings.connectionId, params.connection.id),
        eq(wordpressMediaMappings.imageId, params.image.id),
        eq(wordpressMediaMappings.sourceStorageKey, params.job.sourceStorageKey),
        eq(wordpressMediaMappings.metadataApprovalId, params.job.metadataApprovalId),
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
    sourceStorageKey: params.job.sourceStorageKey,
    derivativeId: params.job.derivativeId,
    metadataApprovalId: params.job.metadataApprovalId,
    remoteMediaId: params.remoteMediaId,
    remoteMediaUrlSafe: params.verified.remoteMediaUrlSafe,
    remoteFilename: params.verified.remoteFilename || params.job.requestedFilename,
    remoteMimeType: params.verified.remoteMimeType,
    remoteWidth: params.verified.remoteWidth,
    remoteHeight: params.verified.remoteHeight,
    publishStatus: "active" as const,
    lastVerifiedAt: now,
    staleAt: null,
    updatedAt: now,
  };

  if (existing) {
    const [updated] = await db
      .update(wordpressMediaMappings)
      .set(shared)
      .where(eq(wordpressMediaMappings.id, existing.id))
      .returning();
    return updated ?? {...existing, ...shared};
  }
  const [inserted] = await db
    .insert(wordpressMediaMappings)
    .values({...shared, publishedAt: now})
    .returning();
  if (!inserted) throw new WordPressError("INTERNAL_ERROR", "Failed to record WordPress media mapping.");
  return inserted;
}

async function recordCompletionSideEffects(params: {
  job: WordpressPublishJob;
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
    eventType: "wordpress_publish_completed",
    entityType: "wordpress_publish_job",
    entityId: params.job.id,
    idempotencyKey: `wordpress_publish_completed:${params.job.id}`,
    safeMetadata: {
      partial: params.outcome === "partially_completed",
      failureCode: params.failureCode ?? null,
    },
  });

  const {recordUsage} = await import("@/server/billing/entitlements");
  await recordUsage({
    userId: entitlementUserId,
    projectId: params.job.projectId,
    category: "wordpress_publish",
    entityId: params.job.id,
    idempotencyKey: `wordpress_publish_usage:${params.job.id}`,
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  if (params.outcome === "completed") {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "wordpress.publish.completed",
      entityType: "wordpress_publish_job",
      entityId: params.job.id,
      deduplicationKey: `wordpress.publish.completed:${params.job.id}`,
      payload: {jobId: params.job.id, imageId: params.job.imageId, projectId: params.job.projectId},
    }).catch(() => undefined);
  } else {
    await emitWebhookEvent({
      workspaceType: params.job.workspaceType,
      workspaceId: params.job.workspaceId,
      eventType: "wordpress.publish.partially_completed",
      entityType: "wordpress_publish_job",
      entityId: params.job.id,
      deduplicationKey: `wordpress.publish.partially_completed:${params.job.id}`,
      payload: {
        jobId: params.job.id,
        imageId: params.job.imageId,
        projectId: params.job.projectId,
        failureCode: params.failureCode ?? null,
      },
    }).catch(() => undefined);
  }
}

async function recordFailureSideEffects(job: WordpressPublishJob, failureCode: string): Promise<void> {
  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  const entitlementUserId = project ? await resolveEntitlementUserIdForProject(project) : job.workspaceId;

  const {recordAnalyticsEventSafe} = await import("@/server/analytics/analytics-events");
  recordAnalyticsEventSafe({
    userId: entitlementUserId,
    projectId: job.projectId,
    imageId: job.imageId,
    eventType: "wordpress_publish_failed",
    entityType: "wordpress_publish_job",
    entityId: job.id,
    idempotencyKey: `wordpress_publish_failed:${job.id}`,
    safeMetadata: {failureCode},
  });

  const {emitWebhookEvent} = await import("@/server/webhooks/events");
  await emitWebhookEvent({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    eventType: "wordpress.publish.failed",
    entityType: "wordpress_publish_job",
    entityId: job.id,
    deduplicationKey: `wordpress.publish.failed:${job.id}`,
    payload: {jobId: job.id, imageId: job.imageId, projectId: job.projectId, failureCode},
  }).catch(() => undefined);
}

async function handleJobFailure(
  job: WordpressPublishJob,
  error: WordPressError,
): Promise<{ok: false; terminal: boolean}> {
  const db = getDb();
  const retryable = isRetryableWordPressFailure(error.code);

  if (retryable && job.attemptCount < job.maxAttempts) {
    await db
      .update(wordpressPublishJobs)
      .set({
        status: "queued",
        lastErrorCode: error.code,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(wordpressPublishJobs.id, job.id));
    return {ok: false, terminal: false};
  }

  await finalizeJob(job, "failed", error.code);
  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: null,
    action: "wordpress_publish_job.failed",
    targetEntityType: "wordpress_publish_job",
    targetEntityId: job.id,
    afterSummary: error.code,
  });
  await recordFailureSideEffects(job, error.code).catch(() => undefined);
  return {ok: false, terminal: true};
}

/** Execute (or terminally fail) one claimed publish job. Idempotent w.r.t. lease ownership. */
export async function executeWordpressPublishJob(params: {
  workerId: string;
  job: WordpressPublishJob;
}): Promise<{ok: boolean; terminal: boolean}> {
  const db = getDb();
  const [current] = await db
    .select()
    .from(wordpressPublishJobs)
    .where(eq(wordpressPublishJobs.id, params.job.id))
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
      throw new WordPressError("CONNECTION_NOT_ACTIVE", "WordPress connection is no longer active.");
    }

    const [image] = await db.select().from(images).where(eq(images.id, job.imageId)).limit(1);
    if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
      throw new WordPressError("IMAGE_NOT_ELIGIBLE", "Image is no longer eligible for publishing.");
    }
    if (image.storageKey !== job.sourceRevisionKey) {
      throw new WordPressError("APPROVED_METADATA_STALE", "The source image changed since this job was queued.");
    }

    const [approved] = await db
      .select()
      .from(imageMetadataApproved)
      .where(eq(imageMetadataApproved.id, job.metadataApprovalId))
      .limit(1);
    if (!approved || approved.sourceStorageKey !== image.storageKey) {
      throw new WordPressError("APPROVED_METADATA_STALE", "Approved metadata changed or is stale.");
    }

    let derivativeFormat: string | null = null;
    if (job.derivativeId) {
      const [derivative] = await db
        .select()
        .from(imageDerivatives)
        .where(eq(imageDerivatives.id, job.derivativeId))
        .limit(1);
      if (!derivative || derivative.status !== "active" || derivative.sourceStorageKey !== image.storageKey) {
        throw new WordPressError("DERIVATIVE_NOT_ACTIVE", "Derivative is no longer active.");
      }
      derivativeFormat = derivative.format ?? derivative.mimeType ?? null;
    }

    const {username, applicationPassword} = await decryptConnectionCredentials(connection);

    let remoteMediaId = job.remoteMediaId;
    if (!remoteMediaId) {
      await setStatus(job.id, "uploading_media");
      const storage = await getObjectStorageProvider();
      const object = await storage.getObjectBuffer(job.sourceStorageKey, WORDPRESS_MAX_MEDIA_BYTES);
      const contentType =
        object.contentType || derivativeFormat || image.detectedMimeType || "application/octet-stream";

      const uploaded = await uploadMedia({
        siteUrlNormalized: connection.siteUrlNormalized,
        username,
        applicationPassword,
        filename: job.requestedFilename,
        contentType,
        bytes: object.body,
        title: approved.title,
        altText: approved.altText,
        caption: approved.caption,
        description: approved.description,
      });
      remoteMediaId = uploaded.remoteMediaId;
      if (!remoteMediaId) {
        throw new WordPressError("WORDPRESS_UPLOAD_FAILED", "WordPress did not return a media id after upload.");
      }

      // Persist immediately — a retry must never re-upload once we have a remote id.
      await db
        .update(wordpressPublishJobs)
        .set({remoteMediaId, updatedAt: new Date()})
        .where(eq(wordpressPublishJobs.id, job.id));
    }

    await setStatus(job.id, "updating_metadata");
    let metadataError: WordPressError | null = null;
    let mediaResult: WordpressMediaResult | null = null;
    try {
      mediaResult = await updateMedia({
        siteUrlNormalized: connection.siteUrlNormalized,
        username,
        applicationPassword,
        remoteMediaId,
        title: approved.title,
        altText: approved.altText,
        caption: approved.caption,
        description: approved.description,
      });
    } catch (error) {
      metadataError =
        error instanceof WordPressError
          ? error
          : new WordPressError("WORDPRESS_METADATA_UPDATE_FAILED", "Metadata update failed.");
    }

    await setStatus(job.id, "verifying_remote");
    let verifyError: WordPressError | null = null;
    try {
      // GET is the ground truth for what WordPress actually persisted.
      mediaResult = await getMedia({
        siteUrlNormalized: connection.siteUrlNormalized,
        username,
        applicationPassword,
        remoteMediaId,
      });
    } catch (error) {
      verifyError =
        error instanceof WordPressError ? error : new WordPressError("WORDPRESS_VERIFY_FAILED", "Verification failed.");
    }

    const resolvedMedia: WordpressMediaResult =
      mediaResult ?? {
        remoteMediaId,
        remoteMediaUrlSafe: "",
        remoteFilename: job.requestedFilename,
        remoteMimeType: "",
        remoteWidth: null,
        remoteHeight: null,
      };

    await upsertMediaMapping({job, image, connection, remoteMediaId, verified: resolvedMedia});

    const softError = metadataError ?? verifyError;
    if (softError) {
      await finalizeJob(job, "partially_completed", softError.code);
      await writeIntegrationAudit({
        workspaceType: job.workspaceType,
        workspaceId: job.workspaceId,
        actorUserId: null,
        action: "wordpress_publish_job.partially_completed",
        targetEntityType: "wordpress_publish_job",
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
      action: "wordpress_publish_job.completed",
      targetEntityType: "wordpress_publish_job",
      targetEntityId: job.id,
    });
    await recordCompletionSideEffects({job, outcome: "completed"}).catch(() => undefined);
    return {ok: true, terminal: true};
  } catch (error) {
    const wpError =
      error instanceof WordPressError ? error : new WordPressError("INTERNAL_ERROR", "WordPress publish failed.");
    return handleJobFailure(job, wpError);
  }
}

/** Requeue jobs whose worker lease expired (crash / missed heartbeat). */
export async function recoverExpiredWordpressLeases(params?: {limit?: number}): Promise<number> {
  const db = getDb();
  const now = new Date();
  const result = await db
    .update(wordpressPublishJobs)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "LEASE_EXPIRED",
      updatedAt: now,
    })
    .where(and(eq(wordpressPublishJobs.status, "leased"), lt(wordpressPublishJobs.leaseExpiresAt, now)))
    .returning({id: wordpressPublishJobs.id});
  return result.slice(0, params?.limit ?? 50).length;
}

export async function retryPublishJob(params: {
  userId: string;
  projectId: string;
  jobId: string;
}): Promise<WordpressPublishJobDto> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "wordpress.publish");
  if (!project) {
    throw new WordPressError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(wordpressPublishJobs)
    .where(and(eq(wordpressPublishJobs.id, params.jobId), eq(wordpressPublishJobs.projectId, project.id)))
    .limit(1);
  if (!job) throw new WordPressError("JOB_NOT_FOUND", "Publish job not found.");
  if (!["failed", "partially_completed", "stale"].includes(job.status)) {
    throw new WordPressError("JOB_CONFLICT", "Only a failed, partially completed, or stale job can be retried.");
  }

  const [updated] = await db
    .update(wordpressPublishJobs)
    .set({
      status: "queued",
      attemptCount: 0,
      lastErrorCode: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(wordpressPublishJobs.id, job.id))
    .returning();
  if (!updated) throw new WordPressError("INTERNAL_ERROR", "Failed to retry WordPress publish job.");

  await writeIntegrationAudit({
    workspaceType: job.workspaceType,
    workspaceId: job.workspaceId,
    actorUserId: params.userId,
    action: "wordpress_publish_job.created",
    targetEntityType: "wordpress_publish_job",
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
}): Promise<WordpressPublishJobDto[]> {
  await requireViewWordpress(params.actorUserId, params.workspaceType, params.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(wordpressPublishJobs)
    .where(
      and(
        eq(wordpressPublishJobs.workspaceType, params.workspaceType),
        eq(wordpressPublishJobs.workspaceId, params.workspaceId),
        eq(wordpressPublishJobs.connectionId, params.connectionId),
      ),
    )
    .orderBy(desc(wordpressPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}

/** Recent publish jobs for one project — used by the project-scoped publish page. */
export async function listRecentPublishJobsForProject(params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<WordpressPublishJobDto[]> {
  const {getOwnedProject} = await import("@/server/projects/queries");
  const project = await getOwnedProject(params.userId, params.projectId, "wordpress.publish");
  if (!project) {
    throw new WordPressError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(wordpressPublishJobs)
    .where(eq(wordpressPublishJobs.projectId, project.id))
    .orderBy(desc(wordpressPublishJobs.createdAt))
    .limit(Math.min(params.limit ?? RECENT_JOBS_DEFAULT_LIMIT, RECENT_JOBS_MAX_LIMIT));
  return rows.map(toDto);
}
