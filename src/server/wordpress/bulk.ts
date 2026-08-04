/**
 * Prompt 26 — WordPress bulk publish orchestration.
 * A bulk job is a thin parent record over N independently-queued publish jobs
 * (same pattern as `bulk_jobs`/`bulk_job_items` for processing) so that a
 * single per-image failure never blocks the rest of the batch.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  wordpressBulkJobs,
  wordpressPublishJobs,
  type WordpressBulkJob,
  type WordpressBulkJobStatus,
  type WordpressFilenameMode,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/wordpress/connections";
import {resolveProjectWorkspace} from "@/server/wordpress/eligibility";
import {WordPressError} from "@/server/wordpress/errors";
import {WORDPRESS_BULK_MAX_SIZE} from "@/server/wordpress/policy";
import {createPublishJob} from "@/server/wordpress/publish-service";

export type WordpressBulkItemInput = {
  imageId: string;
  derivativeId?: string | null;
};

const RUNNING_JOB_STATUSES = ["validating", "uploading_media", "updating_metadata", "verifying_remote"];
const PENDING_JOB_STATUSES = ["queued", "leased"];

export async function createBulkPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  items: WordpressBulkItemInput[];
  filenameMode: WordpressFilenameMode;
  language: MetadataLanguage;
}): Promise<{
  bulkJob: WordpressBulkJob;
  createdJobIds: string[];
  skipped: {imageId: string; derivativeId: string | null; errorCode: string}[];
}> {
  const project = await getOwnedProject(params.userId, params.projectId, "wordpress.publish");
  if (!project) {
    throw new WordPressError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);
  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  const maxBulkSize = Math.min(entitlement.plan.maxWordpressBulkSize, WORDPRESS_BULK_MAX_SIZE);

  if (params.items.length === 0) {
    throw new WordPressError("INVALID_REQUEST", "At least one image is required.");
  }
  const seen = new Set<string>();
  const uniqueItems = params.items.filter((item) => {
    const key = `${item.imageId}:${item.derivativeId ?? "original"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueItems.length > maxBulkSize) {
    throw new WordPressError("WORDPRESS_BULK_SIZE_EXCEEDED", `Bulk publish is limited to ${maxBulkSize} images.`);
  }

  const db = getDb();
  const [bulkJob] = await db
    .insert(wordpressBulkJobs)
    .values({
      workspaceType,
      workspaceId,
      connectionId: connection.id,
      projectId: project.id,
      status: "queued",
      totalCount: uniqueItems.length,
      pendingCount: uniqueItems.length,
      createdByUserId: params.userId,
    })
    .returning();
  if (!bulkJob) throw new WordPressError("INTERNAL_ERROR", "Failed to create WordPress bulk publish job.");

  const createdJobIds: string[] = [];
  const skipped: {imageId: string; derivativeId: string | null; errorCode: string}[] = [];

  for (const item of uniqueItems) {
    try {
      const job = await createPublishJob({
        userId: params.userId,
        connectionId: connection.id,
        projectId: project.id,
        imageId: item.imageId,
        derivativeId: item.derivativeId ?? null,
        filenameMode: params.filenameMode,
        language: params.language,
        idempotencyKey: `wordpress_bulk:${bulkJob.id}:${item.imageId}:${item.derivativeId ?? "original"}`,
        bulkParentId: bulkJob.id,
      });
      createdJobIds.push(job.id);
    } catch (error) {
      skipped.push({
        imageId: item.imageId,
        derivativeId: item.derivativeId ?? null,
        errorCode: error instanceof WordPressError ? error.code : "INTERNAL_ERROR",
      });
    }
  }

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType,
    workspaceId,
    actorUserId: params.userId,
    action: "wordpress_bulk_job.created",
    targetEntityType: "wordpress_bulk_job",
    targetEntityId: bulkJob.id,
    afterSummary: `items=${uniqueItems.length} created=${createdJobIds.length} skipped=${skipped.length}`,
  });

  return {bulkJob: recounted, createdJobIds, skipped};
}

/** Cancel every still-queued child job and mark the bulk job cancel-requested. */
export async function cancelBulkPublishJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<WordpressBulkJob> {
  const project = await getOwnedProject(params.userId, params.projectId, "wordpress.publish");
  if (!project) {
    throw new WordPressError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [bulkJob] = await db
    .select()
    .from(wordpressBulkJobs)
    .where(and(eq(wordpressBulkJobs.id, params.bulkJobId), eq(wordpressBulkJobs.projectId, project.id)))
    .limit(1);
  if (!bulkJob) throw new WordPressError("JOB_NOT_FOUND", "Bulk publish job not found.");

  await db
    .update(wordpressBulkJobs)
    .set({cancelRequested: true, updatedAt: new Date()})
    .where(eq(wordpressBulkJobs.id, bulkJob.id));

  await db
    .update(wordpressPublishJobs)
    .set({status: "cancelled", completedAt: new Date(), updatedAt: new Date()})
    .where(and(eq(wordpressPublishJobs.bulkParentId, bulkJob.id), eq(wordpressPublishJobs.status, "queued")));

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType: bulkJob.workspaceType,
    workspaceId: bulkJob.workspaceId,
    actorUserId: params.userId,
    action: "wordpress_bulk_job.cancelled",
    targetEntityType: "wordpress_bulk_job",
    targetEntityId: bulkJob.id,
  });

  return recounted;
}

/** Recompute a bulk job's counters + rollup status from its child publish jobs. */
export async function recountBulkJob(bulkJobId: string): Promise<WordpressBulkJob> {
  const db = getDb();
  const rows = await db
    .select({status: wordpressPublishJobs.status})
    .from(wordpressPublishJobs)
    .where(eq(wordpressPublishJobs.bulkParentId, bulkJobId));

  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;
  let cancelled = 0;
  for (const row of rows) {
    if (PENDING_JOB_STATUSES.includes(row.status)) pending += 1;
    else if (RUNNING_JOB_STATUSES.includes(row.status)) running += 1;
    else if (row.status === "completed" || row.status === "partially_completed") completed += 1;
    else if (row.status === "failed") failed += 1;
    else if (row.status === "cancelled" || row.status === "stale") cancelled += 1;
  }

  const stillInFlight = pending > 0 || running > 0;
  let status: WordpressBulkJobStatus;
  if (stillInFlight) {
    status = "running";
  } else if (completed > 0 && failed === 0 && cancelled === 0) {
    status = "completed";
  } else if (completed > 0) {
    status = "partially_completed";
  } else if (failed > 0) {
    status = "failed";
  } else {
    status = "cancelled";
  }

  const [updated] = await db
    .update(wordpressBulkJobs)
    .set({
      totalCount: rows.length,
      pendingCount: pending,
      runningCount: running,
      completedCount: completed,
      failedCount: failed,
      cancelledCount: cancelled,
      status,
      updatedAt: new Date(),
    })
    .where(eq(wordpressBulkJobs.id, bulkJobId))
    .returning();
  if (!updated) throw new WordPressError("JOB_NOT_FOUND", "Bulk publish job not found.");
  return updated;
}
