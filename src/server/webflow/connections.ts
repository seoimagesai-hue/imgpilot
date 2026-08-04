/**
 * Prompt 28 — Webflow connection management (create/list/verify/select site/
 * enable/disable/disconnect). Connection *management* is gated on
 * `integrations.manage` (owner/admin), matching the locked decision —
 * publishing uses a separate, broader `webflow.publish` permission (see
 * `permissions.ts`).
 * Auth is a Site access token only (never OAuth; `authType` is always
 * `site_token`). The token is only ever decrypted transiently for a
 * verification/publish call and is never included in any DTO returned to
 * callers.
 */
import {and, count, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  webflowConnections,
  type ApiWorkspaceType,
  type WebflowConnection,
  type WebflowConnectionStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {requireManageIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {getSite, listSites} from "@/server/webflow/client";
import {decryptCredential, encryptCredential} from "@/server/wordpress/crypto";
import {WebflowError} from "@/server/webflow/errors";

export type WebflowConnectionSafeDto = Omit<WebflowConnection, "accessTokenCiphertext" | "accessTokenNonce">;

export function getConnectionSafeDto(row: WebflowConnection): WebflowConnectionSafeDto {
  const {accessTokenCiphertext, accessTokenNonce, ...safe} = row;
  void accessTokenCiphertext;
  void accessTokenNonce;
  return safe;
}

/** Connection statuses that still occupy a plan connection slot. */
const OCCUPYING_STATUSES: WebflowConnectionStatus[] = [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "rate_limited",
  "unreachable",
  "disabled",
];

const VERIFY_FAILURE_STATUS: Record<string, WebflowConnectionStatus> = {
  WEBFLOW_AUTHENTICATION_FAILED: "authentication_failed",
  WEBFLOW_PERMISSION_DENIED: "permission_failed",
  RATE_LIMITED: "rate_limited",
  WEBFLOW_SITE_NOT_FOUND: "unreachable",
  WEBFLOW_API_UNAVAILABLE: "unreachable",
  WEBFLOW_TIMEOUT: "unreachable",
  WEBFLOW_NETWORK_ERROR: "unreachable",
  WEBFLOW_RESPONSE_UNPARSEABLE: "unreachable",
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
): Promise<WebflowConnection> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(webflowConnections)
    .where(
      and(
        eq(webflowConnections.id, connectionId),
        eq(webflowConnections.workspaceType, workspaceType),
        eq(webflowConnections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new WebflowError("CONNECTION_NOT_FOUND", "Webflow connection not found.");
  }
  return row;
}

export async function createConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  accessToken: string;
  siteId?: string | null;
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new WebflowError("INVALID_REQUEST", "name must be 1-120 characters.");
  }
  if (!input.accessToken || input.accessToken.length > 500) {
    throw new WebflowError("INVALID_REQUEST", "accessToken is required.");
  }

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(input.workspaceType, input.workspaceId);
  if (!entitlementUserId) {
    throw new WebflowError("PROJECT_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.webflowEnabled) {
    throw new WebflowError("WEBFLOW_NOT_ENABLED", "This plan does not include the Webflow integration.");
  }

  const db = getDb();
  const [{total: occupied}] = await db
    .select({total: count()})
    .from(webflowConnections)
    .where(
      and(
        eq(webflowConnections.workspaceType, input.workspaceType),
        eq(webflowConnections.workspaceId, input.workspaceId),
        inArray(webflowConnections.status, OCCUPYING_STATUSES),
      ),
    );
  if (Number(occupied) >= entitlement.plan.maxWebflowConnections) {
    throw new WebflowError(
      "CONNECTION_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxWebflowConnections} Webflow connections.`,
    );
  }

  const encrypted = encryptCredential(input.accessToken);
  const [row] = await db
    .insert(webflowConnections)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      authType: "site_token",
      status: "pending",
      accessTokenCiphertext: encrypted.ciphertext,
      accessTokenNonce: encrypted.nonce,
      remoteSiteId: input.siteId?.trim() || null,
    })
    .returning();
  if (!row) throw new WebflowError("INTERNAL_ERROR", "Failed to create Webflow connection.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.created",
    targetEntityType: "webflow_connection",
    targetEntityId: row.id,
    afterSummary: `name=${name}`,
  });

  return getConnectionSafeDto(row);
}

export async function listConnections(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<WebflowConnectionSafeDto[]> {
  const {requireViewWebflow} = await import("@/server/webflow/permissions");
  await requireViewWebflow(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(webflowConnections)
    .where(
      and(
        eq(webflowConnections.workspaceType, input.workspaceType),
        eq(webflowConnections.workspaceId, input.workspaceId),
        inArray(webflowConnections.status, [...OCCUPYING_STATUSES, "disconnected"]),
      ),
    )
    .orderBy(webflowConnections.createdAt);
  return rows.map(getConnectionSafeDto);
}

export async function getConnectionSafe(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WebflowConnectionSafeDto> {
  const {requireViewWebflow} = await import("@/server/webflow/permissions");
  await requireViewWebflow(input.actorUserId, input.workspaceType, input.workspaceId);
  const row = await getWorkspaceConnectionOrThrow(input.workspaceType, input.workspaceId, input.connectionId);
  return getConnectionSafeDto(row);
}

export async function updateToken(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  accessToken: string;
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  if (!input.accessToken || input.accessToken.length > 500) {
    throw new WebflowError("INVALID_REQUEST", "accessToken is required.");
  }

  const encrypted = encryptCredential(input.accessToken);
  const db = getDb();
  const [updated] = await db
    .update(webflowConnections)
    .set({
      accessTokenCiphertext: encrypted.ciphertext,
      accessTokenNonce: encrypted.nonce,
      credentialVersion: connection.credentialVersion + 1,
      status: "pending",
      lastFailureCode: null,
      consecutiveFailureCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(webflowConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.credentials_updated",
    targetEntityType: "webflow_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: "pending"});
}

/** Select (or change) the Webflow site this connection targets. Re-verification is required afterward. */
export async function selectSite(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  siteId: string;
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const siteId = input.siteId.trim();
  if (!siteId) {
    throw new WebflowError("INVALID_REQUEST", "siteId is required.");
  }

  const db = getDb();
  const [updated] = await db
    .update(webflowConnections)
    .set({
      remoteSiteId: siteId,
      remoteSiteNameSafe: null,
      remoteSiteHostnameSafe: null,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(webflowConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.site_selected",
    targetEntityType: "webflow_connection",
    targetEntityId: connection.id,
    afterSummary: `siteId=${siteId}`,
  });

  return getConnectionSafeDto(updated ?? {...connection, remoteSiteId: siteId, status: "pending"});
}

/**
 * Verify the stored token: list accessible sites (confirms the token is
 * valid); if a site is already selected, also confirm continued access to
 * that specific site before marking the connection active.
 */
export async function verifyConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }

  const db = getDb();
  await db
    .update(webflowConnections)
    .set({status: "verifying", updatedAt: new Date()})
    .where(eq(webflowConnections.id, connection.id));

  const accessToken = decryptCredential(connection.accessTokenCiphertext, connection.accessTokenNonce);

  try {
    const sites = await listSites(accessToken);

    let siteNameSafe: string | null = null;
    let siteHostnameSafe: string | null = null;
    if (connection.remoteSiteId) {
      const matched = sites.find((s) => s.siteId === connection.remoteSiteId);
      const site = matched ?? (await getSite(accessToken, connection.remoteSiteId));
      siteNameSafe = site.displayNameSafe || null;
      siteHostnameSafe = site.defaultHostnameSafe || null;
    }

    const now = new Date();
    const [updated] = await db
      .update(webflowConnections)
      .set({
        status: "active",
        remoteSiteNameSafe: siteNameSafe,
        remoteSiteHostnameSafe: siteHostnameSafe,
        lastVerifiedAt: now,
        lastSuccessAt: now,
        lastFailureAt: null,
        lastFailureCode: null,
        consecutiveFailureCount: 0,
        updatedAt: now,
      })
      .where(eq(webflowConnections.id, connection.id))
      .returning();

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "webflow_connection.verified",
      targetEntityType: "webflow_connection",
      targetEntityId: connection.id,
    });

    return getConnectionSafeDto(updated ?? {...connection, status: "active"});
  } catch (error) {
    const code = error instanceof WebflowError ? error.code : "INTERNAL_ERROR";
    const newStatus = VERIFY_FAILURE_STATUS[code] ?? "unreachable";
    const now = new Date();
    const nextFailureCount = connection.consecutiveFailureCount + 1;
    await db
      .update(webflowConnections)
      .set({
        status: newStatus,
        lastVerifiedAt: now,
        lastFailureAt: now,
        lastFailureCode: code,
        consecutiveFailureCount: nextFailureCount,
        updatedAt: now,
      })
      .where(eq(webflowConnections.id, connection.id));

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "webflow_connection.verification_failed",
      targetEntityType: "webflow_connection",
      targetEntityId: connection.id,
      afterSummary: code,
    });

    if (nextFailureCount >= 5 || newStatus === "authentication_failed" || newStatus === "permission_failed") {
      const {emitWebhookEvent} = await import("@/server/webhooks/events");
      await emitWebhookEvent({
        workspaceType: input.workspaceType,
        workspaceId: input.workspaceId,
        eventType: "webflow.connection.degraded",
        entityType: "webflow_connection",
        entityId: connection.id,
        deduplicationKey: `webflow.connection.degraded:${connection.id}:${code}:${nextFailureCount}`,
        payload: {connectionId: connection.id, failureCode: code, status: newStatus},
      }).catch(() => undefined);
    }

    if (error instanceof WebflowError) throw error;
    throw new WebflowError("INTERNAL_ERROR", "Webflow connection verification failed.");
  }
}

export async function disableConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WebflowError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const db = getDb();
  const [updated] = await db
    .update(webflowConnections)
    .set({status: "disabled", disabledAt: new Date(), updatedAt: new Date()})
    .where(eq(webflowConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.disabled",
    targetEntityType: "webflow_connection",
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
}): Promise<WebflowConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status !== "disabled") {
    throw new WebflowError("CONNECTION_NOT_ACTIVE", "Only a disabled connection can be re-enabled.");
  }
  const nextStatus: WebflowConnectionStatus = connection.remoteSiteId ? "active" : "pending";
  const db = getDb();
  const [updated] = await db
    .update(webflowConnections)
    .set({status: nextStatus, disabledAt: null, updatedAt: new Date()})
    .where(eq(webflowConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.enabled",
    targetEntityType: "webflow_connection",
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
    .update(webflowConnections)
    .set({
      status: "disconnected",
      disconnectedAt: new Date(),
      accessTokenCiphertext: destroyed.ciphertext,
      accessTokenNonce: destroyed.nonce,
      updatedAt: new Date(),
    })
    .where(eq(webflowConnections.id, connection.id));

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "webflow_connection.disconnected",
    targetEntityType: "webflow_connection",
    targetEntityId: connection.id,
  });
}

/** Internal helper for publish-service / field-mappings — returns the decrypted access token for one call. */
export async function decryptConnectionCredentials(connection: WebflowConnection): Promise<{accessToken: string}> {
  return {accessToken: decryptCredential(connection.accessTokenCiphertext, connection.accessTokenNonce)};
}

export async function getConnectionRowForPublish(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  connectionId: string,
): Promise<WebflowConnection> {
  return getWorkspaceConnectionOrThrow(workspaceType, workspaceId, connectionId);
}
