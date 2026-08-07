/**
 * Prompt 25 — outbound webhook endpoint management.
 * The signing secret is only ever returned once, at creation/rotation time.
 * Endpoints start `pending_verification` and only receive real event
 * deliveries once `verifyEndpoint` completes a successful challenge.
 */
import {and, count, desc, eq, inArray} from "drizzle-orm";
import {randomBytes, createHash, timingSafeEqual} from "node:crypto";
import {getDb} from "@/db";
import {
  webhookDeliveries,
  webhookEndpoints,
  webhookEvents,
  type ApiWorkspaceType,
  type WebhookDelivery,
  type WebhookEndpoint,
} from "@/db/schema";
import {ApiError} from "@/server/api/errors";
import {
  requireManageIntegrations,
  requireViewIntegrations,
  resolveWorkspaceEntitlementUserId,
} from "@/server/api/permissions";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {decryptSecret, encryptSecret, generateWebhookSecret, signWebhookPayload} from "@/server/webhooks/crypto";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";
import {WEBHOOK_EVENT_TYPES, isValidWebhookEventType, type WebhookEventType} from "@/server/webhooks/events";

export type WebhookEndpointSafeDto = Omit<
  WebhookEndpoint,
  "secretCiphertext" | "secretNonce" | "verificationTokenHash"
>;

export function getWebhookEndpointSafeDto(row: WebhookEndpoint): WebhookEndpointSafeDto {
  const {secretCiphertext, secretNonce, verificationTokenHash, ...safe} = row;
  void secretCiphertext;
  void secretNonce;
  void verificationTokenHash;
  return safe;
}

const CHALLENGE_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 8 * 1024;

async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const {done, value} = await reader.read();
      if (done) break;
      if (value) {
        const remaining = maxBytes - total;
        const slice = value.byteLength > remaining ? value.subarray(0, remaining) : value;
        chunks.push(slice);
        total += slice.byteLength;
        if (value.byteLength > remaining) break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // best-effort
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

function validateSubscribedEvents(events: string[]): WebhookEventType[] {
  const unique = Array.from(new Set(events));
  const invalid = unique.filter((e) => !isValidWebhookEventType(e));
  if (invalid.length > 0) {
    throw new ApiError("INVALID_REQUEST", `Unknown webhook event types: ${invalid.join(", ")}`);
  }
  if (unique.length === 0) {
    throw new ApiError("INVALID_REQUEST", "At least one subscribed event type is required.");
  }
  return unique as WebhookEventType[];
}

async function getWorkspaceEndpointOrThrow(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  endpointId: string,
): Promise<WebhookEndpoint> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, endpointId),
        eq(webhookEndpoints.workspaceType, workspaceType),
        eq(webhookEndpoints.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row || row.status === "deleted") {
    throw new ApiError("WEBHOOK_ENDPOINT_NOT_FOUND", "Webhook endpoint not found.");
  }
  return row;
}

export async function createEndpoint(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  url: string;
  subscribedEvents: string[];
}): Promise<{endpoint: WebhookEndpointSafeDto; secret: string}> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new ApiError("INVALID_REQUEST", "name must be 1-120 characters.");
  }
  const subscribedEvents = validateSubscribedEvents(input.subscribedEvents);
  await assertSafeWebhookUrl(input.url);

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(
    input.workspaceType,
    input.workspaceId,
  );
  if (!entitlementUserId) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.webhooksEnabled) {
    throw new ApiError("WEBHOOKS_NOT_ENABLED", "This plan does not include webhooks.");
  }

  const db = getDb();
  const [{total: activeCount}] = await db
    .select({total: count()})
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.workspaceType, input.workspaceType),
        eq(webhookEndpoints.workspaceId, input.workspaceId),
        inArray(webhookEndpoints.status, ["pending_verification", "active", "failing"]),
      ),
    );
  if (Number(activeCount) >= entitlement.plan.maxWebhookEndpoints) {
    throw new ApiError(
      "WEBHOOK_ENDPOINT_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxWebhookEndpoints} webhook endpoints.`,
    );
  }

  const rawSecret = generateWebhookSecret();
  const encrypted = encryptSecret(rawSecret);

  const [row] = await db
    .insert(webhookEndpoints)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      url: input.url,
      status: "pending_verification",
      secretCiphertext: encrypted.ciphertext,
      secretNonce: encrypted.nonce,
      subscribedEvents,
    })
    .returning();
  if (!row) throw new ApiError("INTERNAL_ERROR", "Failed to create webhook endpoint.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.created",
    targetEntityType: "webhook_endpoint",
    targetEntityId: row.id,
    afterSummary: `name=${name} url=${maskUrl(input.url)} events=${subscribedEvents.join(",")}`,
  });

  return {endpoint: getWebhookEndpointSafeDto(row), secret: rawSecret};
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

export async function listEndpoints(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<WebhookEndpointSafeDto[]> {
  await requireViewIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.workspaceType, input.workspaceType),
        eq(webhookEndpoints.workspaceId, input.workspaceId),
        inArray(webhookEndpoints.status, ["pending_verification", "active", "failing", "disabled"]),
      ),
    )
    .orderBy(webhookEndpoints.createdAt);
  return rows.map(getWebhookEndpointSafeDto);
}

export async function getEndpoint(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<WebhookEndpointSafeDto> {
  await requireViewIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const row = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  return getWebhookEndpointSafeDto(row);
}

export type WebhookDeliveryHistoryItem = {
  id: string;
  attemptNumber: number;
  status: WebhookDelivery["status"];
  eventType: string;
  scheduledAt: Date;
  completedAt: Date | null;
  responseStatus: number | null;
  responseDurationMs: number | null;
  safeFailureCode: string | null;
};

/** Recent deliveries for the developer-settings detail page (view-only). */
export async function listRecentDeliveriesForEndpoint(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
  limit?: number;
}): Promise<WebhookDeliveryHistoryItem[]> {
  await requireViewIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  await getWorkspaceEndpointOrThrow(input.workspaceType, input.workspaceId, input.endpointId);

  const db = getDb();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const rows = await db
    .select({
      id: webhookDeliveries.id,
      attemptNumber: webhookDeliveries.attemptNumber,
      status: webhookDeliveries.status,
      scheduledAt: webhookDeliveries.scheduledAt,
      completedAt: webhookDeliveries.completedAt,
      responseStatus: webhookDeliveries.responseStatus,
      responseDurationMs: webhookDeliveries.responseDurationMs,
      safeFailureCode: webhookDeliveries.safeFailureCode,
      eventType: webhookEvents.eventType,
    })
    .from(webhookDeliveries)
    .innerJoin(webhookEvents, eq(webhookEvents.id, webhookDeliveries.webhookEventId))
    .where(eq(webhookDeliveries.endpointId, input.endpointId))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit);

  return rows;
}

/**
 * Send a signed challenge to the endpoint URL and require the receiver to
 * echo the challenge token back in a JSON response before activating it.
 */
export async function verifyEndpoint(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<WebhookEndpointSafeDto> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  if (endpoint.status === "active") return getWebhookEndpointSafeDto(endpoint);

  await assertSafeWebhookUrl(endpoint.url);

  const challenge = randomBytes(24).toString("hex");
  const challengeHash = createHash("sha256").update(challenge, "utf8").digest("hex");

  const db = getDb();
  await db
    .update(webhookEndpoints)
    .set({verificationTokenHash: challengeHash, updatedAt: new Date()})
    .where(eq(webhookEndpoints.id, endpoint.id));

  const secret = decryptSecret(endpoint.secretCiphertext, endpoint.secretNonce);
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    type: "endpoint.verification",
    endpointId: endpoint.id,
    challenge,
  });
  const signature = signWebhookPayload(secret, timestamp, rawBody);

  let outcome: {ok: boolean; detail: string};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHALLENGE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": signature,
          "x-webhook-timestamp": String(timestamp),
          "user-agent": "ImgPilot-Webhooks/1.0 (+verification)",
        },
        body: rawBody,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      outcome = {ok: false, detail: `redirect (${response.status}) not followed`};
    } else if (response.status < 200 || response.status >= 300) {
      outcome = {ok: false, detail: `HTTP ${response.status}`};
    } else {
      const bodyText = await readLimitedBody(response, MAX_RESPONSE_BYTES);
      let echoed: unknown;
      try {
        echoed = JSON.parse(bodyText) as {challenge?: unknown};
      } catch {
        echoed = null;
      }
      const echoedChallenge =
        echoed && typeof echoed === "object" && "challenge" in echoed
          ? String((echoed as {challenge: unknown}).challenge)
          : "";
      const expectedBuf = Buffer.from(challenge, "utf8");
      const actualBuf = Buffer.from(echoedChallenge, "utf8");
      const matches =
        expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
      outcome = matches
        ? {ok: true, detail: "challenge echoed"}
        : {ok: false, detail: "challenge not echoed in response body"};
    }
  } catch (error) {
    outcome = {ok: false, detail: error instanceof Error ? error.message.slice(0, 200) : "request failed"};
  }

  if (!outcome.ok) {
    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "webhook_endpoint.verification_failed",
      targetEntityType: "webhook_endpoint",
      targetEntityId: endpoint.id,
      afterSummary: outcome.detail,
    });
    throw new ApiError("WEBHOOK_NOT_VERIFIED", `Verification failed: ${outcome.detail}`);
  }

  const [updated] = await db
    .update(webhookEndpoints)
    .set({
      status: "active",
      verifiedAt: new Date(),
      verificationTokenHash: null,
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, endpoint.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.verified",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
  });

  return getWebhookEndpointSafeDto(updated ?? {...endpoint, status: "active"});
}

export async function rotateSecret(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<{endpoint: WebhookEndpointSafeDto; secret: string}> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );

  const rawSecret = generateWebhookSecret();
  const encrypted = encryptSecret(rawSecret);
  const db = getDb();
  const [updated] = await db
    .update(webhookEndpoints)
    .set({
      secretCiphertext: encrypted.ciphertext,
      secretNonce: encrypted.nonce,
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, endpoint.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.secret_rotated",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
  });

  return {endpoint: getWebhookEndpointSafeDto(updated ?? endpoint), secret: rawSecret};
}

export async function disable(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<WebhookEndpointSafeDto> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  const db = getDb();
  const [updated] = await db
    .update(webhookEndpoints)
    .set({status: "disabled", disabledAt: new Date(), updatedAt: new Date()})
    .where(eq(webhookEndpoints.id, endpoint.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.disabled",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
    beforeSummary: `status=${endpoint.status}`,
  });

  return getWebhookEndpointSafeDto(updated ?? {...endpoint, status: "disabled"});
}

export async function enable(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<WebhookEndpointSafeDto> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  if (!endpoint.verifiedAt) {
    throw new ApiError("WEBHOOK_NOT_VERIFIED", "Endpoint must be verified before it can be enabled.");
  }
  const db = getDb();
  const [updated] = await db
    .update(webhookEndpoints)
    .set({
      status: "active",
      disabledAt: null,
      consecutiveFailures: 0,
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, endpoint.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.enabled",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
    beforeSummary: `status=${endpoint.status}`,
  });

  return getWebhookEndpointSafeDto(updated ?? {...endpoint, status: "active"});
}

export async function softDelete(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<void> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  const db = getDb();
  await db
    .update(webhookEndpoints)
    .set({status: "deleted", deletedAt: new Date(), updatedAt: new Date()})
    .where(eq(webhookEndpoints.id, endpoint.id));
  await db
    .update(webhookDeliveries)
    .set({status: "cancelled", updatedAt: new Date()})
    .where(
      and(eq(webhookDeliveries.endpointId, endpoint.id), inArray(webhookDeliveries.status, ["queued", "retry_scheduled"])),
    );

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_endpoint.deleted",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
  });
}

export async function sendTestEvent(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  endpointId: string;
}): Promise<{statusCode: number | null; success: boolean; detail: string}> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const endpoint = await getWorkspaceEndpointOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.endpointId,
  );
  if (endpoint.status !== "active") {
    throw new ApiError("WEBHOOK_NOT_VERIFIED", "Endpoint must be active to send a test event.");
  }

  await assertSafeWebhookUrl(endpoint.url);
  const secret = decryptSecret(endpoint.secretCiphertext, endpoint.secretNonce);
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    type: "test.ping",
    endpointId: endpoint.id,
    sentAt: new Date().toISOString(),
  });
  const signature = signWebhookPayload(secret, timestamp, rawBody);

  let result: {statusCode: number | null; success: boolean; detail: string};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHALLENGE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-signature": signature,
          "x-webhook-timestamp": String(timestamp),
          "user-agent": "ImgPilot-Webhooks/1.0 (+test)",
        },
        body: rawBody,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    await readLimitedBody(response, MAX_RESPONSE_BYTES);
    const success = response.status >= 200 && response.status < 300;
    result = {statusCode: response.status, success, detail: success ? "delivered" : `HTTP ${response.status}`};
  } catch (error) {
    result = {
      statusCode: null,
      success: false,
      detail: error instanceof Error ? error.message.slice(0, 200) : "request failed",
    };
  }

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webhook_delivery.test_sent",
    targetEntityType: "webhook_endpoint",
    targetEntityId: endpoint.id,
    afterSummary: `statusCode=${result.statusCode ?? "none"} success=${result.success}`,
  });

  return result;
}

export {WEBHOOK_EVENT_TYPES};
