/**
 * Prompt 27 — Shopify connection management (create/list/verify/enable/
 * disable/disconnect). Connection *management* is gated on `integrations.manage`
 * (owner/admin), matching the locked decision — publishing uses a separate,
 * broader `shopify.publish` permission (see `permissions.ts`).
 * Auth is a Custom App Admin API access token only (never OAuth). The token is
 * only ever decrypted transiently for a verification/publish call and is
 * never included in any DTO returned to callers.
 */
import {and, count, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  shopifyConnections,
  type ApiWorkspaceType,
  type ShopifyConnection,
  type ShopifyConnectionStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {requireManageIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {verifyShop} from "@/server/shopify/client";
import {decryptCredential, encryptCredential} from "@/server/wordpress/crypto";
import {ShopifyError} from "@/server/shopify/errors";
import {normalizeShopDomain} from "@/server/shopify/url";

export type ShopifyConnectionSafeDto = Omit<ShopifyConnection, "accessTokenCiphertext" | "accessTokenNonce">;

export function getConnectionSafeDto(row: ShopifyConnection): ShopifyConnectionSafeDto {
  const {accessTokenCiphertext, accessTokenNonce, ...safe} = row;
  void accessTokenCiphertext;
  void accessTokenNonce;
  return safe;
}

/** Connection statuses that still occupy a plan connection slot. */
const OCCUPYING_STATUSES: ShopifyConnectionStatus[] = [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "unreachable",
  "disabled",
];

const VERIFY_FAILURE_STATUS: Record<string, ShopifyConnectionStatus> = {
  SHOPIFY_AUTHENTICATION_FAILED: "authentication_failed",
  SHOPIFY_PERMISSION_DENIED: "permission_failed",
  SHOPIFY_SHOP_UNSAFE: "unreachable",
  SHOPIFY_SHOP_UNREACHABLE: "unreachable",
  SHOPIFY_REST_UNAVAILABLE: "unreachable",
  SHOPIFY_TIMEOUT: "unreachable",
  SHOPIFY_NETWORK_ERROR: "unreachable",
  SHOPIFY_RESPONSE_UNPARSEABLE: "unreachable",
};

export async function requireManage(
  actorUserId: string,
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<void> {
  await requireManageIntegrations(actorUserId, workspaceType, workspaceId);
}

async function getWorkspaceConnectionOrThrow(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  connectionId: string,
): Promise<ShopifyConnection> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(shopifyConnections)
    .where(
      and(
        eq(shopifyConnections.id, connectionId),
        eq(shopifyConnections.workspaceType, workspaceType),
        eq(shopifyConnections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new ShopifyError("CONNECTION_NOT_FOUND", "Shopify connection not found.");
  }
  return row;
}

export async function createConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  shop: string;
  accessToken: string;
}): Promise<ShopifyConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new ShopifyError("INVALID_REQUEST", "name must be 1-120 characters.");
  }
  if (!input.accessToken || input.accessToken.length > 500) {
    throw new ShopifyError("INVALID_REQUEST", "accessToken is required.");
  }
  const {shopDomain} = normalizeShopDomain(input.shop);

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(input.workspaceType, input.workspaceId);
  if (!entitlementUserId) {
    throw new ShopifyError("PROJECT_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.shopifyEnabled) {
    throw new ShopifyError("SHOPIFY_NOT_ENABLED", "This plan does not include the Shopify integration.");
  }

  const db = getDb();
  const [{total: occupied}] = await db
    .select({total: count()})
    .from(shopifyConnections)
    .where(
      and(
        eq(shopifyConnections.workspaceType, input.workspaceType),
        eq(shopifyConnections.workspaceId, input.workspaceId),
        inArray(shopifyConnections.status, OCCUPYING_STATUSES),
      ),
    );
  if (Number(occupied) >= entitlement.plan.maxShopifyConnections) {
    throw new ShopifyError(
      "CONNECTION_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxShopifyConnections} Shopify connections.`,
    );
  }

  const encrypted = encryptCredential(input.accessToken);
  const [row] = await db
    .insert(shopifyConnections)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      shopDomain,
      status: "pending",
      accessTokenCiphertext: encrypted.ciphertext,
      accessTokenNonce: encrypted.nonce,
    })
    .returning();
  if (!row) throw new ShopifyError("INTERNAL_ERROR", "Failed to create Shopify connection.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "shopify_connection.created",
    targetEntityType: "shopify_connection",
    targetEntityId: row.id,
    afterSummary: `name=${name} shop=${shopDomain}`,
  });

  return getConnectionSafeDto(row);
}

export async function listConnections(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<ShopifyConnectionSafeDto[]> {
  const {requireViewShopify} = await import("@/server/shopify/permissions");
  await requireViewShopify(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(shopifyConnections)
    .where(
      and(
        eq(shopifyConnections.workspaceType, input.workspaceType),
        eq(shopifyConnections.workspaceId, input.workspaceId),
        inArray(shopifyConnections.status, [...OCCUPYING_STATUSES, "disconnected"]),
      ),
    )
    .orderBy(shopifyConnections.createdAt);
  return rows.map(getConnectionSafeDto);
}

export async function getConnectionSafe(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<ShopifyConnectionSafeDto> {
  const {requireViewShopify} = await import("@/server/shopify/permissions");
  await requireViewShopify(input.actorUserId, input.workspaceType, input.workspaceId);
  const row = await getWorkspaceConnectionOrThrow(input.workspaceType, input.workspaceId, input.connectionId);
  return getConnectionSafeDto(row);
}

export async function updateToken(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  accessToken: string;
}): Promise<ShopifyConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new ShopifyError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  if (!input.accessToken || input.accessToken.length > 500) {
    throw new ShopifyError("INVALID_REQUEST", "accessToken is required.");
  }

  const encrypted = encryptCredential(input.accessToken);
  const db = getDb();
  const [updated] = await db
    .update(shopifyConnections)
    .set({
      accessTokenCiphertext: encrypted.ciphertext,
      accessTokenNonce: encrypted.nonce,
      credentialVersion: connection.credentialVersion + 1,
      status: "pending",
      lastFailureCode: null,
      consecutiveFailureCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(shopifyConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "shopify_connection.credentials_updated",
    targetEntityType: "shopify_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: "pending"});
}

export async function verifyConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<ShopifyConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new ShopifyError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }

  const db = getDb();
  await db
    .update(shopifyConnections)
    .set({status: "verifying", updatedAt: new Date()})
    .where(eq(shopifyConnections.id, connection.id));

  const accessToken = decryptCredential(connection.accessTokenCiphertext, connection.accessTokenNonce);

  try {
    const shop = await verifyShop({shopDomain: connection.shopDomain, accessToken});

    const now = new Date();
    const [updated] = await db
      .update(shopifyConnections)
      .set({
        status: "active",
        shopId: shop.shopId || null,
        shopNameSafe: shop.shopNameSafe || null,
        shopifyPlanNameSafe: shop.planNameSafe || null,
        lastVerifiedAt: now,
        lastSuccessAt: now,
        lastFailureAt: null,
        lastFailureCode: null,
        consecutiveFailureCount: 0,
        updatedAt: now,
      })
      .where(eq(shopifyConnections.id, connection.id))
      .returning();

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "shopify_connection.verified",
      targetEntityType: "shopify_connection",
      targetEntityId: connection.id,
    });

    return getConnectionSafeDto(updated ?? {...connection, status: "active"});
  } catch (error) {
    const code = error instanceof ShopifyError ? error.code : "INTERNAL_ERROR";
    const newStatus = VERIFY_FAILURE_STATUS[code] ?? "unreachable";
    const now = new Date();
    const nextFailureCount = connection.consecutiveFailureCount + 1;
    await db
      .update(shopifyConnections)
      .set({
        status: newStatus,
        lastVerifiedAt: now,
        lastFailureAt: now,
        lastFailureCode: code,
        consecutiveFailureCount: nextFailureCount,
        updatedAt: now,
      })
      .where(eq(shopifyConnections.id, connection.id));

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "shopify_connection.verification_failed",
      targetEntityType: "shopify_connection",
      targetEntityId: connection.id,
      afterSummary: code,
    });

    if (nextFailureCount >= 5 || newStatus === "authentication_failed" || newStatus === "permission_failed") {
      const {emitWebhookEvent} = await import("@/server/webhooks/events");
      await emitWebhookEvent({
        workspaceType: input.workspaceType,
        workspaceId: input.workspaceId,
        eventType: "shopify.connection.degraded",
        entityType: "shopify_connection",
        entityId: connection.id,
        deduplicationKey: `shopify.connection.degraded:${connection.id}:${code}:${nextFailureCount}`,
        payload: {connectionId: connection.id, failureCode: code, status: newStatus},
      }).catch(() => undefined);
    }

    if (error instanceof ShopifyError) throw error;
    throw new ShopifyError("INTERNAL_ERROR", "Shopify connection verification failed.");
  }
}

export async function disableConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<ShopifyConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new ShopifyError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const db = getDb();
  const [updated] = await db
    .update(shopifyConnections)
    .set({status: "disabled", disabledAt: new Date(), updatedAt: new Date()})
    .where(eq(shopifyConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "shopify_connection.disabled",
    targetEntityType: "shopify_connection",
    targetEntityId: connection.id,
    beforeSummary: `status=${connection.status}`,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: "disabled"});
}

export async function enableConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<ShopifyConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status !== "disabled") {
    throw new ShopifyError("CONNECTION_NOT_ACTIVE", "Only a disabled connection can be re-enabled.");
  }
  const nextStatus: ShopifyConnectionStatus = connection.shopId ? "active" : "pending";
  const db = getDb();
  const [updated] = await db
    .update(shopifyConnections)
    .set({status: nextStatus, disabledAt: null, updatedAt: new Date()})
    .where(eq(shopifyConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "shopify_connection.enabled",
    targetEntityType: "shopify_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: nextStatus});
}

/** Permanently disconnects a connection and destroys the stored access-token ciphertext. */
export async function disconnectConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<void> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") return;

  const destroyed = encryptCredential("");
  const db = getDb();
  await db
    .update(shopifyConnections)
    .set({
      status: "disconnected",
      disconnectedAt: new Date(),
      accessTokenCiphertext: destroyed.ciphertext,
      accessTokenNonce: destroyed.nonce,
      updatedAt: new Date(),
    })
    .where(eq(shopifyConnections.id, connection.id));

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "shopify_connection.disconnected",
    targetEntityType: "shopify_connection",
    targetEntityId: connection.id,
  });
}

/** Internal helper for publish-service — returns the decrypted access token for one publish attempt. */
export async function decryptConnectionCredentials(connection: ShopifyConnection): Promise<{accessToken: string}> {
  return {accessToken: decryptCredential(connection.accessTokenCiphertext, connection.accessTokenNonce)};
}

export async function getConnectionRowForPublish(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  connectionId: string,
): Promise<ShopifyConnection> {
  return getWorkspaceConnectionOrThrow(workspaceType, workspaceId, connectionId);
}
