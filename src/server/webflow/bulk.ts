/**
 * Prompt 28 — Webflow bulk publish orchestration.
 * A bulk job targets exactly ONE connection, ONE collection, and ONE field
 * mapping; it is a thin parent record over N independently-queued publish
 * jobs (same pattern as `shopify/bulk.ts`) so that a single per-image
 * failure never blocks the rest of the batch. Each child item supplies its
 * own `cmsItemId` (an existing collection item) — this never creates items.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  webflowBulkJobs,
  webflowPublishJobs,
  type WebflowBulkJob,
  type WebflowBulkJobStatus,
  type WebflowFilenameMode,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/webflow/connections";
import {resolveProjectWorkspace} from "@/server/webflow/eligibility";
import {WebflowError} from "@/server/webflow/errors";
import {getMappingRowForPublish} from "@/server/webflow/field-mappings";
import {WEBFLOW_BULK_MAX_SIZE} from "@/server/webflow/policy";
import {createPublishJob} from "@/server/webflow/publish-service";

export type WebflowBulkItemInput = {
  imageId: string;
  cmsItemId: string;
  cmsItemNameSafe?: string | null;
  derivativeId?: string | null;
};

const RUNNING_JOB_STATUSES = [
  "validating",
  "creating_asset",
  "uploading_asset",
  "verifying_asset",
  "updating_cms_item",
  "verifying_cms_item",
];
const PENDING_JOB_STATUSES = ["queued", "leased"];

export async function createBulkPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  collectionId: string;
  fieldMappingId: string;
  items: WebflowBulkItemInput[];
  filenameMode: WebflowFilenameMode;
  language: MetadataLanguage;
}): Promise<{
  bulkJob: WebflowBulkJob;
  createdJobIds: string[];
  skipped: {imageId: string; cmsItemId: string; derivativeId: string | null; errorCode: string}[];
}> {
  const collectionId = params.collectionId.trim();
  if (!collectionId) {
    throw new WebflowError("INVALID_REQUEST", "collectionId is required.");
  }

  const project = await getOwnedProject(params.userId, params.projectId, "webflow.publish");
  if (!project) {
    throw new WebflowError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);
  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);

  const fieldMapping = await getMappingRowForPublish(params.fieldMappingId);
  if (fieldMapping.connectionId !== connection.id || fieldMapping.collectionId !== collectionId) {
    throw new WebflowError("FIELD_MAPPING_INVALID", "Field mapping does not match this connection/collection.");
  }
  if (fieldMapping.staleAt) {
    throw new WebflowError("MAPPING_STALE", "This field mapping is stale. Re-map the collection before publishing.");
  }

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  const maxBulkSize = Math.min(entitlement.plan.maxWebflowBulkSize, WEBFLOW_BULK_MAX_SIZE);

  if (params.items.length === 0) {
    throw new WebflowError("INVALID_REQUEST", "At least one image is required.");
  }
  const seen = new Set<string>();
  const uniqueItems = params.items.filter((item) => {
    const key = `${item.imageId}:${item.cmsItemId}:${item.derivativeId ?? "original"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueItems.length > maxBulkSize) {
    throw new WebflowError("WEBFLOW_BULK_SIZE_EXCEEDED", `Bulk publish is limited to ${maxBulkSize} images.`);
  }

  const db = getDb();
  const [bulkJob] = await db
    .insert(webflowBulkJobs)
    .values({
      workspaceType,
      workspaceId,
      connectionId: connection.id,
      projectId: project.id,
      collectionId,
      fieldMappingId: fieldMapping.id,
      status: "queued",
      totalCount: uniqueItems.length,
      pendingCount: uniqueItems.length,
      createdByUserId: params.userId,
    })
    .returning();
  if (!bulkJob) throw new WebflowError("INTERNAL_ERROR", "Failed to create Webflow bulk publish job.");

  const createdJobIds: string[] = [];
  const skipped: {imageId: string; cmsItemId: string; derivativeId: string | null; errorCode: string}[] = [];

  for (const item of uniqueItems) {
    try {
      const job = await createPublishJob({
        userId: params.userId,
        connectionId: connection.id,
        projectId: project.id,
        imageId: item.imageId,
        collectionId,
        cmsItemId: item.cmsItemId,
        cmsItemNameSafe: item.cmsItemNameSafe ?? null,
        fieldMappingId: fieldMapping.id,
        derivativeId: item.derivativeId ?? null,
        filenameMode: params.filenameMode,
        language: params.language,
        idempotencyKey: `webflow_bulk:${bulkJob.id}:${item.imageId}:${item.cmsItemId}:${item.derivativeId ?? "original"}`,
        bulkParentId: bulkJob.id,
      });
      createdJobIds.push(job.id);
    } catch (error) {
      skipped.push({
        imageId: item.imageId,
        cmsItemId: item.cmsItemId,
        derivativeId: item.derivativeId ?? null,
        errorCode: error instanceof WebflowError ? error.code : "INTERNAL_ERROR",
      });
    }
  }

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType,
    workspaceId,
    actorUserId: params.userId,
    action: "webflow_bulk_job.created",
    targetEntityType: "webflow_bulk_job",
    targetEntityId: bulkJob.id,
    afterSummary: `collectionId=${collectionId} items=${uniqueItems.length} created=${createdJobIds.length} skipped=${skipped.length}`,
  });

  return {bulkJob: recounted, createdJobIds, skipped};
}

/** Cancel every still-queued child job and mark the bulk job cancel-requested. */
export async function cancelBulkPublishJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<WebflowBulkJob> {
  const project = await getOwnedProject(params.userId, params.projectId, "webflow.publish");
  if (!project) {
    throw new WebflowError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [bulkJob] = await db
    .select()
    .from(webflowBulkJobs)
    .where(and(eq(webflowBulkJobs.id, params.bulkJobId), eq(webflowBulkJobs.projectId, project.id)))
    .limit(1);
  if (!bulkJob) throw new WebflowError("JOB_NOT_FOUND", "Bulk publish job not found.");

  await db
    .update(webflowBulkJobs)
    .set({cancelRequested: true, updatedAt: new Date()})
    .where(eq(webflowBulkJobs.id, bulkJob.id));

  await db
    .update(webflowPublishJobs)
    .set({status: "cancelled", completedAt: new Date(), updatedAt: new Date()})
    .where(and(eq(webflowPublishJobs.bulkParentId, bulkJob.id), eq(webflowPublishJobs.status, "queued")));

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType: bulkJob.workspaceType,
    workspaceId: bulkJob.workspaceId,
    actorUserId: params.userId,
    action: "webflow_bulk_job.cancelled",
    targetEntityType: "webflow_bulk_job",
    targetEntityId: bulkJob.id,
  });

  return recounted;
}

/** Recompute a bulk job's counters + rollup status from its child publish jobs. */
export async function recountBulkJob(bulkJobId: string): Promise<WebflowBulkJob> {
  const db = getDb();
  const rows = await db
    .select({status: webflowPublishJobs.status})
    .from(webflowPublishJobs)
    .where(eq(webflowPublishJobs.bulkParentId, bulkJobId));

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
  let status: WebflowBulkJobStatus;
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
    .update(webflowBulkJobs)
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
    .where(eq(webflowBulkJobs.id, bulkJobId))
    .returning();
  if (!updated) throw new WebflowError("JOB_NOT_FOUND", "Bulk publish job not found.");
  return updated;
}
