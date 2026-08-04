/**
 * Prompt 27 — Shopify bulk publish orchestration.
 * A bulk job targets exactly ONE connection and ONE existing product; it is a
 * thin parent record over N independently-queued publish jobs (same pattern
 * as `wordpress/bulk.ts`) so that a single per-image failure never blocks the
 * rest of the batch.
 */
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {
  shopifyBulkJobs,
  shopifyPublishJobs,
  type ShopifyBulkJob,
  type ShopifyBulkJobStatus,
  type ShopifyFilenameMode,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {resolveEntitlementUserIdForProject} from "@/server/organizations/access";
import {getOwnedProject} from "@/server/projects/queries";
import type {MetadataLanguage} from "@/server/projects/validation";
import {getConnectionRowForPublish} from "@/server/shopify/connections";
import {resolveProjectWorkspace} from "@/server/shopify/eligibility";
import {ShopifyError} from "@/server/shopify/errors";
import {SHOPIFY_BULK_MAX_SIZE} from "@/server/shopify/policy";
import {createPublishJob} from "@/server/shopify/publish-service";

export type ShopifyBulkItemInput = {
  imageId: string;
  derivativeId?: string | null;
};

const RUNNING_JOB_STATUSES = ["validating", "uploading_media", "updating_metadata", "verifying_remote"];
const PENDING_JOB_STATUSES = ["queued", "leased"];

export async function createBulkPublishJob(params: {
  userId: string;
  connectionId: string;
  projectId: string;
  shopifyProductId: string;
  items: ShopifyBulkItemInput[];
  filenameMode: ShopifyFilenameMode;
  language: MetadataLanguage;
}): Promise<{
  bulkJob: ShopifyBulkJob;
  createdJobIds: string[];
  skipped: {imageId: string; derivativeId: string | null; errorCode: string}[];
}> {
  const shopifyProductId = params.shopifyProductId.trim();
  if (!shopifyProductId) {
    throw new ShopifyError("INVALID_REQUEST", "shopifyProductId is required.");
  }

  const project = await getOwnedProject(params.userId, params.projectId, "shopify.publish");
  if (!project) {
    throw new ShopifyError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const {workspaceType, workspaceId} = resolveProjectWorkspace(project);
  const connection = await getConnectionRowForPublish(workspaceType, workspaceId, params.connectionId);

  const entitlementUserId = await resolveEntitlementUserIdForProject(project);
  const entitlement = await resolveEntitlement(entitlementUserId);
  const maxBulkSize = Math.min(entitlement.plan.maxShopifyBulkSize, SHOPIFY_BULK_MAX_SIZE);

  if (params.items.length === 0) {
    throw new ShopifyError("INVALID_REQUEST", "At least one image is required.");
  }
  const seen = new Set<string>();
  const uniqueItems = params.items.filter((item) => {
    const key = `${item.imageId}:${item.derivativeId ?? "original"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueItems.length > maxBulkSize) {
    throw new ShopifyError("SHOPIFY_BULK_SIZE_EXCEEDED", `Bulk publish is limited to ${maxBulkSize} images.`);
  }

  const db = getDb();
  const [bulkJob] = await db
    .insert(shopifyBulkJobs)
    .values({
      workspaceType,
      workspaceId,
      connectionId: connection.id,
      projectId: project.id,
      shopifyProductId,
      status: "queued",
      totalCount: uniqueItems.length,
      pendingCount: uniqueItems.length,
      createdByUserId: params.userId,
    })
    .returning();
  if (!bulkJob) throw new ShopifyError("INTERNAL_ERROR", "Failed to create Shopify bulk publish job.");

  const createdJobIds: string[] = [];
  const skipped: {imageId: string; derivativeId: string | null; errorCode: string}[] = [];

  for (const item of uniqueItems) {
    try {
      const job = await createPublishJob({
        userId: params.userId,
        connectionId: connection.id,
        projectId: project.id,
        imageId: item.imageId,
        shopifyProductId,
        derivativeId: item.derivativeId ?? null,
        filenameMode: params.filenameMode,
        language: params.language,
        idempotencyKey: `shopify_bulk:${bulkJob.id}:${item.imageId}:${item.derivativeId ?? "original"}`,
        bulkParentId: bulkJob.id,
      });
      createdJobIds.push(job.id);
    } catch (error) {
      skipped.push({
        imageId: item.imageId,
        derivativeId: item.derivativeId ?? null,
        errorCode: error instanceof ShopifyError ? error.code : "INTERNAL_ERROR",
      });
    }
  }

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType,
    workspaceId,
    actorUserId: params.userId,
    action: "shopify_bulk_job.created",
    targetEntityType: "shopify_bulk_job",
    targetEntityId: bulkJob.id,
    afterSummary: `productId=${shopifyProductId} items=${uniqueItems.length} created=${createdJobIds.length} skipped=${skipped.length}`,
  });

  return {bulkJob: recounted, createdJobIds, skipped};
}

/** Cancel every still-queued child job and mark the bulk job cancel-requested. */
export async function cancelBulkPublishJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<ShopifyBulkJob> {
  const project = await getOwnedProject(params.userId, params.projectId, "shopify.publish");
  if (!project) {
    throw new ShopifyError("PROJECT_NOT_FOUND", "Project not found or you do not have permission to publish from it.");
  }
  const db = getDb();
  const [bulkJob] = await db
    .select()
    .from(shopifyBulkJobs)
    .where(and(eq(shopifyBulkJobs.id, params.bulkJobId), eq(shopifyBulkJobs.projectId, project.id)))
    .limit(1);
  if (!bulkJob) throw new ShopifyError("JOB_NOT_FOUND", "Bulk publish job not found.");

  await db
    .update(shopifyBulkJobs)
    .set({cancelRequested: true, updatedAt: new Date()})
    .where(eq(shopifyBulkJobs.id, bulkJob.id));

  await db
    .update(shopifyPublishJobs)
    .set({status: "cancelled", completedAt: new Date(), updatedAt: new Date()})
    .where(and(eq(shopifyPublishJobs.bulkParentId, bulkJob.id), eq(shopifyPublishJobs.status, "queued")));

  const recounted = await recountBulkJob(bulkJob.id);

  await writeIntegrationAudit({
    workspaceType: bulkJob.workspaceType,
    workspaceId: bulkJob.workspaceId,
    actorUserId: params.userId,
    action: "shopify_bulk_job.cancelled",
    targetEntityType: "shopify_bulk_job",
    targetEntityId: bulkJob.id,
  });

  return recounted;
}

/** Recompute a bulk job's counters + rollup status from its child publish jobs. */
export async function recountBulkJob(bulkJobId: string): Promise<ShopifyBulkJob> {
  const db = getDb();
  const rows = await db
    .select({status: shopifyPublishJobs.status})
    .from(shopifyPublishJobs)
    .where(eq(shopifyPublishJobs.bulkParentId, bulkJobId));

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
  let status: ShopifyBulkJobStatus;
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
    .update(shopifyBulkJobs)
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
    .where(eq(shopifyBulkJobs.id, bulkJobId))
    .returning();
  if (!updated) throw new ShopifyError("JOB_NOT_FOUND", "Bulk publish job not found.");
  return updated;
}
