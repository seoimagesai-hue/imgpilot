/**
 * Prompt 26 — bounded, dry-run-by-default reconciliation for WordPress
 * publish jobs, bulk jobs, and stale connections. Mirrors `webhooks/reconcile.ts`.
 */
import {and, eq, isNotNull, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {wordpressBulkJobs, wordpressConnections, wordpressPublishJobs} from "@/db/schema";
import {recoverExpiredWordpressLeases} from "@/server/wordpress/publish-service";
import {recountBulkJob} from "@/server/wordpress/bulk";

export type WordpressReconcileFinding = {
  code: string;
  connectionId?: string;
  jobId?: string;
  detail: string;
};

export type WordpressReconcileResult = {
  dryRun: boolean;
  findings: WordpressReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_QUEUED_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_CONNECTION_FAILURE_THRESHOLD = 10;

export async function reconcileWordpress(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<WordpressReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: WordpressReconcileFinding[] = [];
  let repaired = 0;

  // Expired worker leases — always safe to recover regardless of dryRun granularity,
  // matching the webhook delivery worker's lease-recovery behavior.
  if (!dryRun) {
    repaired += await recoverExpiredWordpressLeases({limit});
  } else {
    const now = new Date();
    const expired = await db
      .select({id: wordpressPublishJobs.id})
      .from(wordpressPublishJobs)
      .where(and(eq(wordpressPublishJobs.status, "leased"), lt(wordpressPublishJobs.leaseExpiresAt, now)))
      .limit(limit);
    for (const row of expired) {
      findings.push({code: "PUBLISH_JOB_LEASE_EXPIRED", jobId: row.id, detail: "lease expired"});
    }
  }

  // Jobs stuck in `queued` far longer than any reasonable worker poll interval.
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_MS);
  const staleQueued = await db
    .select({id: wordpressPublishJobs.id})
    .from(wordpressPublishJobs)
    .where(and(eq(wordpressPublishJobs.status, "queued"), lt(wordpressPublishJobs.createdAt, staleCutoff)))
    .limit(limit);
  for (const row of staleQueued) {
    findings.push({code: "PUBLISH_JOB_STALE_QUEUED", jobId: row.id, detail: "queued for over 24 hours"});
    if (!dryRun) {
      await db
        .update(wordpressPublishJobs)
        .set({status: "stale", updatedAt: new Date()})
        .where(and(eq(wordpressPublishJobs.id, row.id), eq(wordpressPublishJobs.status, "queued")));
      repaired += 1;
    }
  }

  // Connections that have failed many times in a row without a successful verify.
  const degradedConnections = await db
    .select({id: wordpressConnections.id, count: wordpressConnections.consecutiveFailureCount})
    .from(wordpressConnections)
    .where(
      and(
        isNotNull(wordpressConnections.lastFailureAt),
        eq(wordpressConnections.status, "active"),
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
          .update(wordpressConnections)
          .set({status: "degraded", updatedAt: new Date()})
          .where(eq(wordpressConnections.id, row.id));
        repaired += 1;
      }
    }
  }

  // Bulk jobs whose rollup counters have drifted from their children (e.g. after a crash).
  const activeBulkJobs = await db
    .select({id: wordpressBulkJobs.id, status: wordpressBulkJobs.status})
    .from(wordpressBulkJobs)
    .where(eq(wordpressBulkJobs.status, "running"))
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
