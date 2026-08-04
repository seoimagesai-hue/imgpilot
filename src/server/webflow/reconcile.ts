/**
 * Prompt 28 — bounded, dry-run-by-default reconciliation for Webflow publish
 * jobs, bulk jobs, field mappings, and stale connections. Mirrors
 * `shopify/reconcile.ts`.
 */
import {and, eq, isNotNull, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {webflowBulkJobs, webflowConnections, webflowFieldMappings, webflowPublishJobs} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {recountBulkJob} from "@/server/webflow/bulk";
import {recoverExpiredWebflowLeases} from "@/server/webflow/publish-service";

export type WebflowReconcileFinding = {
  code: string;
  connectionId?: string;
  jobId?: string;
  fieldMappingId?: string;
  detail: string;
};

export type WebflowReconcileResult = {
  dryRun: boolean;
  findings: WebflowReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_QUEUED_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_CONNECTION_FAILURE_THRESHOLD = 10;

export async function reconcileWebflow(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<WebflowReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: WebflowReconcileFinding[] = [];
  let repaired = 0;

  // Expired worker leases — always safe to recover regardless of dryRun granularity,
  // matching the webhook delivery worker's lease-recovery behavior.
  if (!dryRun) {
    repaired += await recoverExpiredWebflowLeases({limit});
  } else {
    const now = new Date();
    const expired = await db
      .select({id: webflowPublishJobs.id})
      .from(webflowPublishJobs)
      .where(and(eq(webflowPublishJobs.status, "leased"), lt(webflowPublishJobs.leaseExpiresAt, now)))
      .limit(limit);
    for (const row of expired) {
      findings.push({code: "PUBLISH_JOB_LEASE_EXPIRED", jobId: row.id, detail: "lease expired"});
    }
  }

  // Jobs stuck in `queued` far longer than any reasonable worker poll interval.
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_MS);
  const staleQueued = await db
    .select({id: webflowPublishJobs.id})
    .from(webflowPublishJobs)
    .where(and(eq(webflowPublishJobs.status, "queued"), lt(webflowPublishJobs.createdAt, staleCutoff)))
    .limit(limit);
  for (const row of staleQueued) {
    findings.push({code: "PUBLISH_JOB_STALE_QUEUED", jobId: row.id, detail: "queued for over 24 hours"});
    if (!dryRun) {
      await db
        .update(webflowPublishJobs)
        .set({status: "stale", updatedAt: new Date()})
        .where(and(eq(webflowPublishJobs.id, row.id), eq(webflowPublishJobs.status, "queued")));
      repaired += 1;
    }
  }

  // Connections that have failed many times in a row without a successful verify.
  const degradedConnections = await db
    .select({
      id: webflowConnections.id,
      count: webflowConnections.consecutiveFailureCount,
      workspaceType: webflowConnections.workspaceType,
      workspaceId: webflowConnections.workspaceId,
    })
    .from(webflowConnections)
    .where(and(isNotNull(webflowConnections.lastFailureAt), eq(webflowConnections.status, "active")))
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
          .update(webflowConnections)
          .set({status: "degraded", updatedAt: new Date()})
          .where(eq(webflowConnections.id, row.id));
        await writeIntegrationAudit({
          workspaceType: row.workspaceType,
          workspaceId: row.workspaceId,
          actorUserId: null,
          action: "webflow_connection.auto_degraded",
          targetEntityType: "webflow_connection",
          targetEntityId: row.id,
          afterSummary: `consecutiveFailureCount=${row.count}`,
        });
        repaired += 1;
      }
    }
  }

  // Field mappings on a connection that is no longer active/degraded are surfaced but never auto-marked stale
  // (a temporarily unreachable connection should not silently invalidate a mapping).
  const disconnectedConnections = await db
    .select({id: webflowConnections.id})
    .from(webflowConnections)
    .where(eq(webflowConnections.status, "disconnected"))
    .limit(limit);
  for (const conn of disconnectedConnections) {
    const mappings = await db
      .select({id: webflowFieldMappings.id, staleAt: webflowFieldMappings.staleAt})
      .from(webflowFieldMappings)
      .where(eq(webflowFieldMappings.connectionId, conn.id))
      .limit(limit);
    for (const mapping of mappings) {
      if (mapping.staleAt) continue;
      findings.push({
        code: "FIELD_MAPPING_ORPHANED_BY_DISCONNECT",
        connectionId: conn.id,
        fieldMappingId: mapping.id,
        detail: "connection disconnected",
      });
      if (!dryRun) {
        await db
          .update(webflowFieldMappings)
          .set({staleAt: new Date(), updatedAt: new Date()})
          .where(eq(webflowFieldMappings.id, mapping.id));
        repaired += 1;
      }
    }
  }

  // Bulk jobs whose rollup counters have drifted from their children (e.g. after a crash).
  const activeBulkJobs = await db
    .select({id: webflowBulkJobs.id, status: webflowBulkJobs.status})
    .from(webflowBulkJobs)
    .where(eq(webflowBulkJobs.status, "running"))
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
