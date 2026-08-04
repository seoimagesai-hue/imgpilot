/**
 * Prompt 29 — bounded, dry-run-by-default reconciliation for Cloudinary
 * publish jobs, bulk jobs, and stale connections. Mirrors `webflow/reconcile.ts`.
 */
import {and, eq, isNotNull, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {cloudinaryBulkJobs, cloudinaryConnections, cloudinaryPublishJobs} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {recountBulkJob} from "@/server/cloudinary/bulk";
import {recoverExpiredCloudinaryLeases} from "@/server/cloudinary/publish-service";

export type CloudinaryReconcileFinding = {
  code: string;
  connectionId?: string;
  jobId?: string;
  detail: string;
};

export type CloudinaryReconcileResult = {
  dryRun: boolean;
  findings: CloudinaryReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_QUEUED_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_CONNECTION_FAILURE_THRESHOLD = 10;

export async function reconcileCloudinary(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<CloudinaryReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: CloudinaryReconcileFinding[] = [];
  let repaired = 0;

  // Expired worker leases — always safe to recover regardless of dryRun granularity,
  // matching the webhook delivery worker's lease-recovery behavior.
  if (!dryRun) {
    repaired += await recoverExpiredCloudinaryLeases({limit});
  } else {
    const now = new Date();
    const expired = await db
      .select({id: cloudinaryPublishJobs.id})
      .from(cloudinaryPublishJobs)
      .where(and(eq(cloudinaryPublishJobs.status, "leased"), lt(cloudinaryPublishJobs.leaseExpiresAt, now)))
      .limit(limit);
    for (const row of expired) {
      findings.push({code: "PUBLISH_JOB_LEASE_EXPIRED", jobId: row.id, detail: "lease expired"});
    }
  }

  // Jobs stuck in `queued` far longer than any reasonable worker poll interval.
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_MS);
  const staleQueued = await db
    .select({id: cloudinaryPublishJobs.id})
    .from(cloudinaryPublishJobs)
    .where(and(eq(cloudinaryPublishJobs.status, "queued"), lt(cloudinaryPublishJobs.createdAt, staleCutoff)))
    .limit(limit);
  for (const row of staleQueued) {
    findings.push({code: "PUBLISH_JOB_STALE_QUEUED", jobId: row.id, detail: "queued for over 24 hours"});
    if (!dryRun) {
      await db
        .update(cloudinaryPublishJobs)
        .set({status: "stale", updatedAt: new Date()})
        .where(and(eq(cloudinaryPublishJobs.id, row.id), eq(cloudinaryPublishJobs.status, "queued")));
      repaired += 1;
    }
  }

  // Connections that have failed many times in a row without a successful verify.
  const degradedConnections = await db
    .select({
      id: cloudinaryConnections.id,
      count: cloudinaryConnections.consecutiveFailureCount,
      workspaceType: cloudinaryConnections.workspaceType,
      workspaceId: cloudinaryConnections.workspaceId,
    })
    .from(cloudinaryConnections)
    .where(and(isNotNull(cloudinaryConnections.lastFailureAt), eq(cloudinaryConnections.status, "active")))
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
          .update(cloudinaryConnections)
          .set({status: "degraded", updatedAt: new Date()})
          .where(eq(cloudinaryConnections.id, row.id));
        await writeIntegrationAudit({
          workspaceType: row.workspaceType,
          workspaceId: row.workspaceId,
          actorUserId: null,
          action: "cloudinary_connection.auto_degraded",
          targetEntityType: "cloudinary_connection",
          targetEntityId: row.id,
          afterSummary: `consecutiveFailureCount=${row.count}`,
        });
        repaired += 1;
      }
    }
  }

  // Bulk jobs whose rollup counters have drifted from their children (e.g. after a crash).
  const activeBulkJobs = await db
    .select({id: cloudinaryBulkJobs.id, status: cloudinaryBulkJobs.status})
    .from(cloudinaryBulkJobs)
    .where(eq(cloudinaryBulkJobs.status, "running"))
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
