/**
 * Prompt 25 — bounded, dry-run-by-default reconciliation for the public API
 * subsystem (API keys + idempotency + rate-limit bookkeeping).
 */
import {and, eq, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {apiKeys} from "@/db/schema";
import {pruneExpiredIdempotencyRecords} from "@/server/api/idempotency";
import {pruneExpiredRateLimitBuckets} from "@/server/api/rate-limit";

export type ApiReconcileFinding = {
  code: string;
  workspaceId?: string;
  detail: string;
};

export type ApiReconcileResult = {
  dryRun: boolean;
  findings: ApiReconcileFinding[];
  repaired: number;
};

const BATCH = 100;

export async function reconcileApiSubsystem(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<ApiReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: ApiReconcileFinding[] = [];
  let repaired = 0;

  const now = new Date();
  const expiredActiveKeys = await db
    .select({id: apiKeys.id, workspaceId: apiKeys.workspaceId})
    .from(apiKeys)
    .where(and(eq(apiKeys.status, "active"), lt(apiKeys.expiresAt, now)))
    .limit(limit);

  for (const row of expiredActiveKeys) {
    findings.push({
      code: "API_KEY_PAST_EXPIRY_STILL_ACTIVE",
      workspaceId: row.workspaceId,
      detail: row.id,
    });
    if (!dryRun) {
      await db
        .update(apiKeys)
        .set({status: "expired", updatedAt: new Date()})
        .where(eq(apiKeys.id, row.id));
      repaired += 1;
    }
  }

  if (!dryRun) {
    const idempotencyPruned = await pruneExpiredIdempotencyRecords(limit);
    const bucketsPruned = await pruneExpiredRateLimitBuckets();
    if (idempotencyPruned > 0) {
      findings.push({
        code: "IDEMPOTENCY_RECORDS_PRUNED",
        detail: String(idempotencyPruned),
      });
      repaired += idempotencyPruned;
    }
    if (bucketsPruned > 0) {
      findings.push({
        code: "RATE_LIMIT_BUCKETS_PRUNED",
        detail: String(bucketsPruned),
      });
      repaired += bucketsPruned;
    }
  }

  return {dryRun, findings, repaired};
}
