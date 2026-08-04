/**
 * Prompt 26 — WordPress connection management (create/list/verify/enable/
 * disable/disconnect). Connection *management* is gated on `integrations.manage`
 * (owner/admin), matching the locked decision — publishing uses a separate,
 * broader `wordpress.publish` permission (see `permissions.ts`).
 * Credentials are only ever decrypted transiently for a verification/publish
 * call and are never included in any DTO returned to callers.
 */
import {and, count, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  wordpressConnections,
  type ApiWorkspaceType,
  type WordpressConnection,
  type WordpressConnectionStatus,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {requireManageIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {authenticateAndGetUser, checkMediaEndpoint, discoverRest} from "@/server/wordpress/client";
import {decryptCredential, encryptCredentialPair} from "@/server/wordpress/crypto";
import {WordPressError} from "@/server/wordpress/errors";
import {normalizeSiteUrl} from "@/server/wordpress/url";

export type WordpressConnectionSafeDto = Omit<
  WordpressConnection,
  "usernameCiphertext" | "usernameNonce" | "applicationPasswordCiphertext" | "applicationPasswordNonce"
>;

export function getConnectionSafeDto(row: WordpressConnection): WordpressConnectionSafeDto {
  const {usernameCiphertext, usernameNonce, applicationPasswordCiphertext, applicationPasswordNonce, ...safe} = row;
  void usernameCiphertext;
  void usernameNonce;
  void applicationPasswordCiphertext;
  void applicationPasswordNonce;
  return safe;
}

/** Connection statuses that still occupy a plan connection slot. */
const OCCUPYING_STATUSES: WordpressConnectionStatus[] = [
  "pending",
  "verifying",
  "active",
  "degraded",
  "authentication_failed",
  "permission_failed",
  "unreachable",
  "disabled",
];

const VERIFY_FAILURE_STATUS: Record<string, WordpressConnectionStatus> = {
  WORDPRESS_AUTHENTICATION_FAILED: "authentication_failed",
  WORDPRESS_PERMISSION_DENIED: "permission_failed",
  WORDPRESS_MEDIA_ENDPOINT_UNAVAILABLE: "permission_failed",
  WORDPRESS_URL_UNSAFE: "unreachable",
  WORDPRESS_URL_UNREACHABLE: "unreachable",
  WORDPRESS_REST_UNAVAILABLE: "unreachable",
  WORDPRESS_TIMEOUT: "unreachable",
  WORDPRESS_NETWORK_ERROR: "unreachable",
  WORDPRESS_RESPONSE_UNPARSEABLE: "unreachable",
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
): Promise<WordpressConnection> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(wordpressConnections)
    .where(
      and(
        eq(wordpressConnections.id, connectionId),
        eq(wordpressConnections.workspaceType, workspaceType),
        eq(wordpressConnections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new WordPressError("CONNECTION_NOT_FOUND", "WordPress connection not found.");
  }
  return row;
}

export async function createConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): Promise<WordpressConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new WordPressError("INVALID_REQUEST", "name must be 1-120 characters.");
  }
  const username = input.username.trim();
  if (!username || username.length > 200) {
    throw new WordPressError("INVALID_REQUEST", "username must be 1-200 characters.");
  }
  if (!input.applicationPassword || input.applicationPassword.length > 500) {
    throw new WordPressError("INVALID_REQUEST", "applicationPassword is required.");
  }
  const {normalized, host} = normalizeSiteUrl(input.siteUrl);

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(input.workspaceType, input.workspaceId);
  if (!entitlementUserId) {
    throw new WordPressError("PROJECT_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.wordpressEnabled) {
    throw new WordPressError("WORDPRESS_NOT_ENABLED", "This plan does not include the WordPress integration.");
  }

  const db = getDb();
  const [{total: occupied}] = await db
    .select({total: count()})
    .from(wordpressConnections)
    .where(
      and(
        eq(wordpressConnections.workspaceType, input.workspaceType),
        eq(wordpressConnections.workspaceId, input.workspaceId),
        inArray(wordpressConnections.status, OCCUPYING_STATUSES),
      ),
    );
  if (Number(occupied) >= entitlement.plan.maxWordpressConnections) {
    throw new WordPressError(
      "CONNECTION_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxWordpressConnections} WordPress connections.`,
    );
  }

  const encrypted = encryptCredentialPair(username, input.applicationPassword);
  const [row] = await db
    .insert(wordpressConnections)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      siteUrlNormalized: normalized,
      siteHost: host,
      status: "pending",
      usernameCiphertext: encrypted.username.ciphertext,
      usernameNonce: encrypted.username.nonce,
      applicationPasswordCiphertext: encrypted.applicationPassword.ciphertext,
      applicationPasswordNonce: encrypted.applicationPassword.nonce,
    })
    .returning();
  if (!row) throw new WordPressError("INTERNAL_ERROR", "Failed to create WordPress connection.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "wordpress_connection.created",
    targetEntityType: "wordpress_connection",
    targetEntityId: row.id,
    afterSummary: `name=${name} host=${host}`,
  });

  return getConnectionSafeDto(row);
}

export async function listConnections(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<WordpressConnectionSafeDto[]> {
  const {requireViewWordpress} = await import("@/server/wordpress/permissions");
  await requireViewWordpress(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(wordpressConnections)
    .where(
      and(
        eq(wordpressConnections.workspaceType, input.workspaceType),
        eq(wordpressConnections.workspaceId, input.workspaceId),
        inArray(wordpressConnections.status, [...OCCUPYING_STATUSES, "disconnected"]),
      ),
    )
    .orderBy(wordpressConnections.createdAt);
  return rows.map(getConnectionSafeDto);
}

export async function getConnectionSafe(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WordpressConnectionSafeDto> {
  const {requireViewWordpress} = await import("@/server/wordpress/permissions");
  await requireViewWordpress(input.actorUserId, input.workspaceType, input.workspaceId);
  const row = await getWorkspaceConnectionOrThrow(input.workspaceType, input.workspaceId, input.connectionId);
  return getConnectionSafeDto(row);
}

export async function updateCredentials(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  username: string;
  applicationPassword: string;
}): Promise<WordpressConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WordPressError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const username = input.username.trim();
  if (!username || username.length > 200) {
    throw new WordPressError("INVALID_REQUEST", "username must be 1-200 characters.");
  }
  if (!input.applicationPassword || input.applicationPassword.length > 500) {
    throw new WordPressError("INVALID_REQUEST", "applicationPassword is required.");
  }

  const encrypted = encryptCredentialPair(username, input.applicationPassword);
  const db = getDb();
  const [updated] = await db
    .update(wordpressConnections)
    .set({
      usernameCiphertext: encrypted.username.ciphertext,
      usernameNonce: encrypted.username.nonce,
      applicationPasswordCiphertext: encrypted.applicationPassword.ciphertext,
      applicationPasswordNonce: encrypted.applicationPassword.nonce,
      credentialVersion: connection.credentialVersion + 1,
      status: "pending",
      lastFailureCode: null,
      consecutiveFailureCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(wordpressConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "wordpress_connection.credentials_updated",
    targetEntityType: "wordpress_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: "pending"});
}

export async function verifyConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WordpressConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WordPressError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }

  const db = getDb();
  await db
    .update(wordpressConnections)
    .set({status: "verifying", updatedAt: new Date()})
    .where(eq(wordpressConnections.id, connection.id));

  const username = decryptCredential(connection.usernameCiphertext, connection.usernameNonce);
  const applicationPassword = decryptCredential(
    connection.applicationPasswordCiphertext,
    connection.applicationPasswordNonce,
  );

  try {
    const discovery = await discoverRest(connection.siteUrlNormalized);
    const user = await authenticateAndGetUser({
      siteUrlNormalized: connection.siteUrlNormalized,
      username,
      applicationPassword,
    });
    if (user.capabilities.upload_files === false) {
      throw new WordPressError("WORDPRESS_PERMISSION_DENIED", "WordPress account cannot upload media.");
    }
    await checkMediaEndpoint({
      siteUrlNormalized: connection.siteUrlNormalized,
      username,
      applicationPassword,
    });

    const now = new Date();
    const [updated] = await db
      .update(wordpressConnections)
      .set({
        status: "active",
        wordpressUserId: user.wordpressUserId || null,
        wordpressUserDisplayNameSafe: user.displayNameSafe || null,
        siteTitle: discovery.siteTitle,
        capabilities: user.capabilities,
        lastVerifiedAt: now,
        lastSuccessAt: now,
        lastFailureAt: null,
        lastFailureCode: null,
        consecutiveFailureCount: 0,
        updatedAt: now,
      })
      .where(eq(wordpressConnections.id, connection.id))
      .returning();

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "wordpress_connection.verified",
      targetEntityType: "wordpress_connection",
      targetEntityId: connection.id,
    });

    // Note: `analytics_events.project_id` is required (FK). Connection activation is
    // workspace-scoped, so we rely on integration audit here; publish analytics still
    // fire from publish-service with a real projectId.

    return getConnectionSafeDto(updated ?? {...connection, status: "active"});
  } catch (error) {
    const code = error instanceof WordPressError ? error.code : "INTERNAL_ERROR";
    const newStatus = VERIFY_FAILURE_STATUS[code] ?? "unreachable";
    const now = new Date();
    const nextFailureCount = connection.consecutiveFailureCount + 1;
    await db
      .update(wordpressConnections)
      .set({
        status: newStatus,
        lastVerifiedAt: now,
        lastFailureAt: now,
        lastFailureCode: code,
        consecutiveFailureCount: nextFailureCount,
        updatedAt: now,
      })
      .where(eq(wordpressConnections.id, connection.id));

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "wordpress_connection.verification_failed",
      targetEntityType: "wordpress_connection",
      targetEntityId: connection.id,
      afterSummary: code,
    });

    if (nextFailureCount >= 5 || newStatus === "authentication_failed" || newStatus === "permission_failed") {
      const {emitWebhookEvent} = await import("@/server/webhooks/events");
      await emitWebhookEvent({
        workspaceType: input.workspaceType,
        workspaceId: input.workspaceId,
        eventType: "wordpress.connection.degraded",
        entityType: "wordpress_connection",
        entityId: connection.id,
        deduplicationKey: `wordpress.connection.degraded:${connection.id}:${code}:${nextFailureCount}`,
        payload: {connectionId: connection.id, failureCode: code, status: newStatus},
      }).catch(() => undefined);
    }

    if (error instanceof WordPressError) throw error;
    throw new WordPressError("INTERNAL_ERROR", "WordPress connection verification failed.");
  }
}

export async function disableConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<WordpressConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new WordPressError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const db = getDb();
  const [updated] = await db
    .update(wordpressConnections)
    .set({status: "disabled", disabledAt: new Date(), updatedAt: new Date()})
    .where(eq(wordpressConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "wordpress_connection.disabled",
    targetEntityType: "wordpress_connection",
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
}): Promise<WordpressConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status !== "disabled") {
    throw new WordPressError("CONNECTION_NOT_ACTIVE", "Only a disabled connection can be re-enabled.");
  }
  const nextStatus: WordpressConnectionStatus = connection.wordpressUserId ? "active" : "pending";
  const db = getDb();
  const [updated] = await db
    .update(wordpressConnections)
    .set({status: nextStatus, disabledAt: null, updatedAt: new Date()})
    .where(eq(wordpressConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "wordpress_connection.enabled",
    targetEntityType: "wordpress_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: nextStatus});
}

/** Permanently disconnects a connection and destroys the stored credential ciphertext. */
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

  const destroyed = encryptCredentialPair("", "");
  const db = getDb();
  await db
    .update(wordpressConnections)
    .set({
      status: "disconnected",
      disconnectedAt: new Date(),
      usernameCiphertext: destroyed.username.ciphertext,
      usernameNonce: destroyed.username.nonce,
      applicationPasswordCiphertext: destroyed.applicationPassword.ciphertext,
      applicationPasswordNonce: destroyed.applicationPassword.nonce,
      updatedAt: new Date(),
    })
    .where(eq(wordpressConnections.id, connection.id));

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "wordpress_connection.disconnected",
    targetEntityType: "wordpress_connection",
    targetEntityId: connection.id,
  });
}

/** Internal helper for publish-service — returns decrypted credentials for one publish attempt. */
export async function decryptConnectionCredentials(
  connection: WordpressConnection,
): Promise<{username: string; applicationPassword: string}> {
  return {
    username: decryptCredential(connection.usernameCiphertext, connection.usernameNonce),
    applicationPassword: decryptCredential(
      connection.applicationPasswordCiphertext,
      connection.applicationPasswordNonce,
    ),
  };
}

export async function getConnectionRowForPublish(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  connectionId: string,
): Promise<WordpressConnection> {
  return getWorkspaceConnectionOrThrow(workspaceType, workspaceId, connectionId);
}
