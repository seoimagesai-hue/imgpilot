/**
 * Prompt 27 — bounded, dry-run-by-default reconciliation for Shopify publish
 * jobs, bulk jobs, and stale connections. Mirrors `wordpress/reconcile.ts`.
 */
import {and, eq, isNotNull, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {shopifyBulkJobs, shopifyConnections, shopifyPublishJobs} from "@/db/schema";
import {recoverExpiredShopifyLeases} from "@/server/shopify/publish-service";
import {recountBulkJob} from "@/server/shopify/bulk";

export type ShopifyReconcileFinding = {
  code: string;
  connectionId?: string;
  jobId?: string;
  detail: string;
};

export type ShopifyReconcileResult = {
  dryRun: boolean;
  findings: ShopifyReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_QUEUED_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_CONNECTION_FAILURE_THRESHOLD = 10;

export async function reconcileShopify(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<ShopifyReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: ShopifyReconcileFinding[] = [];
  let repaired = 0;

  // Expired worker leases — always safe to recover regardless of dryRun granularity,
  // matching the webhook delivery worker's lease-recovery behavior.
  if (!dryRun) {
    repaired += await recoverExpiredShopifyLeases({limit});
  } else {
    const now = new Date();
    const expired = await db
      .select({id: shopifyPublishJobs.id})
      .from(shopifyPublishJobs)
      .where(and(eq(shopifyPublishJobs.status, "leased"), lt(shopifyPublishJobs.leaseExpiresAt, now)))
      .limit(limit);
    for (const row of expired) {
      findings.push({code: "PUBLISH_JOB_LEASE_EXPIRED", jobId: row.id, detail: "lease expired"});
    }
  }

  // Jobs stuck in `queued` far longer than any reasonable worker poll interval.
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_MS);
  const staleQueued = await db
    .select({id: shopifyPublishJobs.id})
    .from(shopifyPublishJobs)
    .where(and(eq(shopifyPublishJobs.status, "queued"), lt(shopifyPublishJobs.createdAt, staleCutoff)))
    .limit(limit);
  for (const row of staleQueued) {
    findings.push({code: "PUBLISH_JOB_STALE_QUEUED", jobId: row.id, detail: "queued for over 24 hours"});
    if (!dryRun) {
      await db
        .update(shopifyPublishJobs)
        .set({status: "stale", updatedAt: new Date()})
        .where(and(eq(shopifyPublishJobs.id, row.id), eq(shopifyPublishJobs.status, "queued")));
      repaired += 1;
    }
  }

  // Connections that have failed many times in a row without a successful verify.
  const degradedConnections = await db
    .select({id: shopifyConnections.id, count: shopifyConnections.consecutiveFailureCount})
    .from(shopifyConnections)
    .where(
      and(
        isNotNull(shopifyConnections.lastFailureAt),
        eq(shopifyConnections.status, "active"),
      ),
    )
    .limit(limit);
  for (const row of degradedConnections) {
    if (row.count >= STALE_CONNECTION_FAILURE_THRESHOLD) {
      findings.push({
        code: "CONNECTION_REPEATED_FAILURES",
        connectionId: row.id,
        detail: `consecutiveFailureCount=${row.count}`,
      });
      if (!dryRun) {
        await db
          .update(shopifyConnections)
          .set({status: "degraded", updatedAt: new Date()})
          .where(eq(shopifyConnections.id, row.id));
        repaired += 1;
      }
    }
  }

  // Bulk jobs whose rollup counters have drifted from their children (e.g. after a crash).
  const activeBulkJobs = await db
    .select({id: shopifyBulkJobs.id, status: shopifyBulkJobs.status})
    .from(shopifyBulkJobs)
    .where(eq(shopifyBulkJobs.status, "running"))
    .limit(limit);
  for (const row of activeBulkJobs) {
    findings.push({code: "BULK_JOB_RECOUNT_CANDIDATE", jobId: row.id, detail: "running bulk job checked for drift"});
    if (!dryRun) {
      await recountBulkJob(row.id);
      repaired += 1;
    }
  }

  return {dryRun, findings, repaired};
}
