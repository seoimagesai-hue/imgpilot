/**
 * Prompt 25 — outbound webhook delivery worker.
 * Lease pattern mirrors the image processing queue (`FOR UPDATE SKIP LOCKED`):
 * a worker claims a batch, executes each delivery, and either completes it or
 * schedules a backed-off retry. URL safety + DNS are re-checked immediately
 * before every network call (DNS rebinding protection).
 */
import {and, eq, inArray, isNotNull, lt} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {
  webhookDeliveries,
  webhookEndpoints,
  webhookEvents,
  type ApiWorkspaceType,
  type WebhookDelivery,
  type WebhookEndpointStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {decryptSecret, signWebhookPayload} from "@/server/webhooks/crypto";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";

export const DELIVERY_CLAIM_BATCH = 20;
export const DELIVERY_LEASE_TTL_MS = 2 * 60 * 1000;
const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 8 * 1024;
export const MAX_DELIVERY_ATTEMPTS = 7;
export const CONSECUTIVE_FAILURE_DISABLE_THRESHOLD = 15;

const BACKOFF_SCHEDULE_MS = [
  60_000, // 1m
  5 * 60_000, // 5m
  30 * 60_000, // 30m
  2 * 60 * 60_000, // 2h
  8 * 60 * 60_000, // 8h
  24 * 60 * 60_000, // 24h
];

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429]);

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status) || status >= 500;
}

function computeNextAttemptAt(attemptNumberJustFailed: number): Date {
  const index = Math.min(attemptNumberJustFailed - 1, BACKOFF_SCHEDULE_MS.length - 1);
  const base = BACKOFF_SCHEDULE_MS[Math.max(0, index)];
  const jitterFraction = 0.8 + Math.random() * 0.4; // ±20%
  const delayMs = Math.round(base * jitterFraction);
  return new Date(Date.now() + delayMs);
}

function leaseExpiryDate(): Date {
  return new Date(Date.now() + DELIVERY_LEASE_TTL_MS);
}

/** Claim up to `limit` due deliveries for this worker via SKIP LOCKED. */
export async function claimQueuedDeliveries(params: {
  workerId: string;
  limit?: number;
}): Promise<WebhookDelivery[]> {
  const limit = Math.max(1, Math.min(params.limit ?? DELIVERY_CLAIM_BATCH, DELIVERY_CLAIM_BATCH));
  const sqlClient = getPostgresClient();
  const leaseExpiresAt = leaseExpiryDate().toISOString();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE webhook_deliveries AS wd
    SET
      status = 'delivering',
      started_at = coalesce(wd.started_at, now()),
      lease_owner = ${params.workerId},
      lease_expires_at = ${leaseExpiresAt}::timestamptz,
      updated_at = now()
    WHERE wd.id IN (
      SELECT id
      FROM webhook_deliveries
      WHERE status IN ('queued', 'retry_scheduled')
        AND scheduled_at <= now()
      ORDER BY scheduled_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING *
  `;

  return rows.map(mapDeliveryRow);
}

function mapDeliveryRow(row: Record<string, unknown>): WebhookDelivery {
  return {
    id: String(row.id),
    webhookEventId: String(row.webhook_event_id),
    endpointId: String(row.endpoint_id),
    attemptNumber: Number(row.attempt_number),
    status: row.status as WebhookDelivery["status"],
    scheduledAt: new Date(String(row.scheduled_at)),
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    responseStatus: row.response_status == null ? null : Number(row.response_status),
    responseDurationMs: row.response_duration_ms == null ? null : Number(row.response_duration_ms),
    safeFailureCode: (row.safe_failure_code as string | null) ?? null,
    nextAttemptAt: row.next_attempt_at ? new Date(String(row.next_attempt_at)) : null,
    leaseOwner: (row.lease_owner as string | null) ?? null,
    leaseExpiresAt: row.lease_expires_at ? new Date(String(row.lease_expires_at)) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  let total = 0;
  try {
    while (total < maxBytes) {
      const {done, value} = await reader.read();
      if (done) break;
      if (value) total += value.byteLength;
      if (total >= maxBytes) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // best-effort
    }
  }
}

export type ExecuteDeliveryOutcome =
  | {result: "succeeded"; statusCode: number; durationMs: number}
  | {result: "retry_scheduled"; nextAttemptAt: Date; safeFailureCode: string}
  | {result: "exhausted"; safeFailureCode: string}
  | {result: "failed"; safeFailureCode: string}
  | {result: "cancelled"; reason: string}
  | {result: "lease_lost"};

/** Execute (or terminally fail) one claimed delivery. Idempotent w.r.t. lease ownership. */
export async function executeDelivery(
  deliveryId: string,
  workerId: string,
): Promise<ExecuteDeliveryOutcome> {
  const db = getDb();
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);
  if (!delivery || delivery.leaseOwner !== workerId || delivery.status !== "delivering") {
    return {result: "lease_lost"};
  }

  const [endpoint] = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, delivery.endpointId))
    .limit(1);
  const [event] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, delivery.webhookEventId))
    .limit(1);

  if (!endpoint || !event || endpoint.status === "deleted" || endpoint.status === "disabled") {
    await db
      .update(webhookDeliveries)
      .set({
        status: "cancelled",
        completedAt: new Date(),
        leaseOwner: null,
        leaseExpiresAt: null,
        safeFailureCode: "ENDPOINT_UNAVAILABLE",
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, delivery.id));
    return {result: "cancelled", reason: "endpoint_unavailable"};
  }

  try {
    await assertSafeWebhookUrl(endpoint.url);
  } catch {
    return finalizeFailure(delivery, endpoint, "URL_UNSAFE", false);
  }

  const secret = decryptSecret(endpoint.secretCiphertext, endpoint.secretNonce);
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    id: event.id,
    type: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    occurredAt: event.occurredAt.toISOString(),
    data: event.payload,
  });
  const signature = signWebhookPayload(secret, timestamp, rawBody);

  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": signature,
          "x-webhook-timestamp": String(timestamp),
          "x-webhook-event-type": event.eventType,
          "x-webhook-delivery-id": delivery.id,
          "user-agent": "ImgPilot-Webhooks/1.0",
        },
        body: rawBody,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    await readLimitedBody(response, MAX_RESPONSE_BYTES);
    const durationMs = Date.now() - startedAt;

    // redirect (3xx) with `redirect: "manual"` surfaces as an opaqueredirect with status 0.
    const status = response.type === "opaqueredirect" ? 0 : response.status;

    if (status >= 200 && status < 300) {
      await db
        .update(webhookDeliveries)
        .set({
          status: "succeeded",
          completedAt: new Date(),
          responseStatus: status,
          responseDurationMs: durationMs,
          leaseOwner: null,
          leaseExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhookEndpoints)
        .set({
          consecutiveFailures: 0,
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: "succeeded",
          status: endpoint.status === "failing" ? "active" : endpoint.status,
          updatedAt: new Date(),
        })
        .where(eq(webhookEndpoints.id, endpoint.id));

      return {result: "succeeded", statusCode: status, durationMs};
    }

    const retryable = status === 0 ? false : isRetryableStatus(status);
    return finalizeFailure(delivery, endpoint, `HTTP_${status}`, retryable, status, durationMs);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return finalizeFailure(delivery, endpoint, timedOut ? "TIMEOUT" : "NETWORK_ERROR", true);
  }
}

async function finalizeFailure(
  delivery: WebhookDelivery,
  endpoint: {
    id: string;
    workspaceType: ApiWorkspaceType;
    workspaceId: string;
    consecutiveFailures: number;
    status: WebhookEndpointStatus;
  },
  safeFailureCode: string,
  retryable: boolean,
  responseStatus?: number,
  durationMs?: number,
): Promise<ExecuteDeliveryOutcome> {
  const db = getDb();
  const newConsecutiveFailures = endpoint.consecutiveFailures + 1;
  const shouldDisable = newConsecutiveFailures >= CONSECUTIVE_FAILURE_DISABLE_THRESHOLD;

  await db
    .update(webhookEndpoints)
    .set({
      consecutiveFailures: newConsecutiveFailures,
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: "failed",
      status: shouldDisable ? "disabled" : endpoint.status === "active" ? "failing" : endpoint.status,
      ...(shouldDisable ? {disabledAt: new Date()} : {}),
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, endpoint.id));

  if (shouldDisable) {
    await writeIntegrationAudit({
      workspaceType: endpoint.workspaceType,
      workspaceId: endpoint.workspaceId,
      actorUserId: null,
      action: "webhook_endpoint.auto_disabled",
      targetEntityType: "webhook_endpoint",
      targetEntityId: endpoint.id,
      afterSummary: `consecutiveFailures=${newConsecutiveFailures}`,
    });
  }

  const canRetry = retryable && !shouldDisable && delivery.attemptNumber < MAX_DELIVERY_ATTEMPTS;

  if (canRetry) {
    const nextAttemptAt = computeNextAttemptAt(delivery.attemptNumber);
    await db
      .update(webhookDeliveries)
      .set({
        status: "retry_scheduled",
        attemptNumber: delivery.attemptNumber + 1,
        responseStatus: responseStatus ?? null,
        responseDurationMs: durationMs ?? null,
        safeFailureCode,
        nextAttemptAt,
        scheduledAt: nextAttemptAt,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, delivery.id));
    return {result: "retry_scheduled", nextAttemptAt, safeFailureCode};
  }

  const terminalStatus = retryable ? "exhausted" : "failed";
  await db
    .update(webhookDeliveries)
    .set({
      status: terminalStatus,
      completedAt: new Date(),
      responseStatus: responseStatus ?? null,
      responseDurationMs: durationMs ?? null,
      safeFailureCode,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(webhookDeliveries.id, delivery.id));

  return terminalStatus === "exhausted"
    ? {result: "exhausted", safeFailureCode}
    : {result: "failed", safeFailureCode};
}

/** Requeue deliveries whose worker lease expired (crash / missed heartbeat). */
export async function recoverExpiredDeliveryLeases(params?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{scanned: number; recovered: number; deliveryIds: string[]}> {
  const db = getDb();
  const now = new Date();
  const expired = await db
    .select({id: webhookDeliveries.id})
    .from(webhookDeliveries)
    .where(
      and(
        eq(webhookDeliveries.status, "delivering"),
        isNotNull(webhookDeliveries.leaseExpiresAt),
        lt(webhookDeliveries.leaseExpiresAt, now),
      ),
    )
    .limit(params?.limit ?? 100);

  if (params?.dryRun || expired.length === 0) {
    return {scanned: expired.length, recovered: 0, deliveryIds: expired.map((r) => r.id)};
  }

  const ids = expired.map((r) => r.id);
  await db
    .update(webhookDeliveries)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      safeFailureCode: "LEASE_EXPIRED",
      updatedAt: new Date(),
    })
    .where(inArray(webhookDeliveries.id, ids));

  return {scanned: expired.length, recovered: ids.length, deliveryIds: ids};
}
