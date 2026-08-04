/**
 * Prompt 25 — bounded, dry-run-by-default reconciliation for webhook delivery.
 */
import {and, eq, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {webhookDeliveries, webhookEndpoints} from "@/db/schema";
import {recoverExpiredDeliveryLeases} from "@/server/webhooks/delivery";

export type WebhookReconcileFinding = {
  code: string;
  endpointId?: string;
  detail: string;
};

export type WebhookReconcileResult = {
  dryRun: boolean;
  findings: WebhookReconcileFinding[];
  repaired: number;
};

const BATCH = 100;
const STALE_PENDING_VERIFICATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function reconcileWebhooks(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<WebhookReconcileResult> {
  const dryRun = options?.dryRun !== false;
  const limit = Math.min(options?.limit ?? BATCH, 500);
  const db = getDb();
  const findings: WebhookReconcileFinding[] = [];
  let repaired = 0;

  const leaseRecovery = await recoverExpiredDeliveryLeases({dryRun, limit});
  for (const id of leaseRecovery.deliveryIds) {
    findings.push({code: "DELIVERY_LEASE_EXPIRED", detail: id});
  }
  if (!dryRun) repaired += leaseRecovery.recovered;

  const staleCutoff = new Date(Date.now() - STALE_PENDING_VERIFICATION_MS);
  const stalePending = await db
    .select({id: webhookEndpoints.id})
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.status, "pending_verification"),
        lt(webhookEndpoints.createdAt, staleCutoff),
      ),
    )
    .limit(limit);
  for (const row of stalePending) {
    findings.push({
      code: "ENDPOINT_STALE_PENDING_VERIFICATION",
      endpointId: row.id,
      detail: "unverified for over 30 days",
    });
  }

  const disabledWithQueued = await db
    .select({id: webhookDeliveries.id, endpointId: webhookDeliveries.endpointId})
    .from(webhookDeliveries)
    .innerJoin(webhookEndpoints, eq(webhookEndpoints.id, webhookDeliveries.endpointId))
    .where(
      and(
        eq(webhookDeliveries.status, "queued"),
        eq(webhookEndpoints.status, "disabled"),
      ),
    )
    .limit(limit);
  for (const row of disabledWithQueued) {
    findings.push({
      code: "QUEUED_DELIVERY_FOR_DISABLED_ENDPOINT",
      endpointId: row.endpointId,
      detail: row.id,
    });
    if (!dryRun) {
      await db
        .update(webhookDeliveries)
        .set({status: "cancelled", updatedAt: new Date()})
        .where(eq(webhookDeliveries.id, row.id));
      repaired += 1;
    }
  }

  return {dryRun, findings, repaired};
}
