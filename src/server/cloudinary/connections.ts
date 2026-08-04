/**
 * Prompt 29 — Cloudinary connection management (create/list/verify/rotate
 * credentials/enable/disable/disconnect/acknowledge public delivery).
 * Connection *management* is gated on `integrations.manage` (owner/admin),
 * matching the locked decision — publishing uses a separate, broader
 * `cloudinary.publish` permission (see `permissions.ts`).
 * Auth is cloud_name + api_key + api_secret; all three are encrypted at rest
 * and only ever decrypted transiently for a verify/publish call. They are
 * never included in any DTO returned to callers — only a display-safe,
 * truncated `cloudNameSafe` (set only after a successful verify) is exposed.
 */
import {and, count, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {
  cloudinaryConnections,
  type ApiWorkspaceType,
  type CloudinaryConnection,
  type CloudinaryConnectionStatus,
  type CloudinaryDeliveryType,
} from "@/db/schema";
import {writeIntegrationAudit} from "@/server/api/audit";
import {requireManageIntegrations, resolveWorkspaceEntitlementUserId} from "@/server/api/permissions";
import {resolveEntitlement} from "@/server/billing/entitlements";
import {verifyCredentials, type CloudinaryCredentials} from "@/server/cloudinary/client";
import {CloudinaryError} from "@/server/cloudinary/errors";
import {decryptCredential, encryptCredential} from "@/server/wordpress/crypto";

export type CloudinaryConnectionSafeDto = Omit<
  CloudinaryConnection,
  "cloudNameCiphertext" | "cloudNameNonce" | "apiKeyCiphertext" | "apiKeyNonce" | "apiSecretCiphertext" | "apiSecretNonce"
>;

export function getConnectionSafeDto(row: CloudinaryConnection): CloudinaryConnectionSafeDto {
  const {
    cloudNameCiphertext,
    cloudNameNonce,
    apiKeyCiphertext,
    apiKeyNonce,
    apiSecretCiphertext,
    apiSecretNonce,
    ...safe
  } = row;
  void cloudNameCiphertext;
  void cloudNameNonce;
  void apiKeyCiphertext;
  void apiKeyNonce;
  void apiSecretCiphertext;
  void apiSecretNonce;
  return safe;
}

/** Display-safe, truncated cloud name — never the full value if unusually long. */
function toCloudNameSafe(cloudName: string): string {
  return cloudName.trim().slice(0, 80);
}

/** Connection statuses that still occupy a plan connection slot. */
const OCCUPYING_STATUSES: CloudinaryConnectionStatus[] = [
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

const VERIFY_FAILURE_STATUS: Record<string, CloudinaryConnectionStatus> = {
  CLOUDINARY_AUTHENTICATION_FAILED: "authentication_failed",
  CLOUDINARY_PERMISSION_DENIED: "permission_failed",
  RATE_LIMITED: "rate_limited",
  CLOUDINARY_API_UNAVAILABLE: "unreachable",
  CLOUDINARY_TIMEOUT: "unreachable",
  CLOUDINARY_NETWORK_ERROR: "unreachable",
  CLOUDINARY_RESPONSE_UNPARSEABLE: "unreachable",
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
): Promise<CloudinaryConnection> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(cloudinaryConnections)
    .where(
      and(
        eq(cloudinaryConnections.id, connectionId),
        eq(cloudinaryConnections.workspaceType, workspaceType),
        eq(cloudinaryConnections.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new CloudinaryError("CONNECTION_NOT_FOUND", "Cloudinary connection not found.");
  }
  return row;
}

export async function createConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  defaultDeliveryType?: CloudinaryDeliveryType;
  defaultFolder?: string | null;
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new CloudinaryError("INVALID_REQUEST", "name must be 1-120 characters.");
  }
  const cloudName = input.cloudName.trim();
  if (!cloudName || cloudName.length > 200) {
    throw new CloudinaryError("INVALID_REQUEST", "cloudName is required.");
  }
  if (!input.apiKey || input.apiKey.length > 200) {
    throw new CloudinaryError("INVALID_REQUEST", "apiKey is required.");
  }
  if (!input.apiSecret || input.apiSecret.length > 500) {
    throw new CloudinaryError("INVALID_REQUEST", "apiSecret is required.");
  }

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(input.workspaceType, input.workspaceId);
  if (!entitlementUserId) {
    throw new CloudinaryError("PROJECT_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.cloudinaryEnabled) {
    throw new CloudinaryError("CLOUDINARY_NOT_ENABLED", "This plan does not include the Cloudinary integration.");
  }

  const db = getDb();
  const [{total: occupied}] = await db
    .select({total: count()})
    .from(cloudinaryConnections)
    .where(
      and(
        eq(cloudinaryConnections.workspaceType, input.workspaceType),
        eq(cloudinaryConnections.workspaceId, input.workspaceId),
        inArray(cloudinaryConnections.status, OCCUPYING_STATUSES),
      ),
    );
  if (Number(occupied) >= entitlement.plan.maxCloudinaryConnections) {
    throw new CloudinaryError(
      "CONNECTION_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxCloudinaryConnections} Cloudinary connections.`,
    );
  }

  const cloudNameEncrypted = encryptCredential(cloudName);
  const apiKeyEncrypted = encryptCredential(input.apiKey);
  const apiSecretEncrypted = encryptCredential(input.apiSecret);
  const [row] = await db
    .insert(cloudinaryConnections)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      status: "pending",
      cloudNameCiphertext: cloudNameEncrypted.ciphertext,
      cloudNameNonce: cloudNameEncrypted.nonce,
      apiKeyCiphertext: apiKeyEncrypted.ciphertext,
      apiKeyNonce: apiKeyEncrypted.nonce,
      apiSecretCiphertext: apiSecretEncrypted.ciphertext,
      apiSecretNonce: apiSecretEncrypted.nonce,
      defaultDeliveryType: input.defaultDeliveryType ?? "upload",
      defaultFolder: input.defaultFolder?.trim() || "seo-tool",
    })
    .returning();
  if (!row) throw new CloudinaryError("INTERNAL_ERROR", "Failed to create Cloudinary connection.");

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.created",
    targetEntityType: "cloudinary_connection",
    targetEntityId: row.id,
    afterSummary: `name=${name}`,
  });

  return getConnectionSafeDto(row);
}

export async function listConnections(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<CloudinaryConnectionSafeDto[]> {
  const {requireViewCloudinary} = await import("@/server/cloudinary/permissions");
  await requireViewCloudinary(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(cloudinaryConnections)
    .where(
      and(
        eq(cloudinaryConnections.workspaceType, input.workspaceType),
        eq(cloudinaryConnections.workspaceId, input.workspaceId),
        inArray(cloudinaryConnections.status, [...OCCUPYING_STATUSES, "disconnected"]),
      ),
    )
    .orderBy(cloudinaryConnections.createdAt);
  return rows.map(getConnectionSafeDto);
}

export async function getConnectionSafe(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<CloudinaryConnectionSafeDto> {
  const {requireViewCloudinary} = await import("@/server/cloudinary/permissions");
  await requireViewCloudinary(input.actorUserId, input.workspaceType, input.workspaceId);
  const row = await getWorkspaceConnectionOrThrow(input.workspaceType, input.workspaceId, input.connectionId);
  return getConnectionSafeDto(row);
}

export async function updateCredentials(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const cloudName = input.cloudName.trim();
  if (!cloudName || cloudName.length > 200) {
    throw new CloudinaryError("INVALID_REQUEST", "cloudName is required.");
  }
  if (!input.apiKey || input.apiKey.length > 200) {
    throw new CloudinaryError("INVALID_REQUEST", "apiKey is required.");
  }
  if (!input.apiSecret || input.apiSecret.length > 500) {
    throw new CloudinaryError("INVALID_REQUEST", "apiSecret is required.");
  }

  const cloudNameEncrypted = encryptCredential(cloudName);
  const apiKeyEncrypted = encryptCredential(input.apiKey);
  const apiSecretEncrypted = encryptCredential(input.apiSecret);
  const db = getDb();
  const [updated] = await db
    .update(cloudinaryConnections)
    .set({
      cloudNameCiphertext: cloudNameEncrypted.ciphertext,
      cloudNameNonce: cloudNameEncrypted.nonce,
      apiKeyCiphertext: apiKeyEncrypted.ciphertext,
      apiKeyNonce: apiKeyEncrypted.nonce,
      apiSecretCiphertext: apiSecretEncrypted.ciphertext,
      apiSecretNonce: apiSecretEncrypted.nonce,
      credentialVersion: connection.credentialVersion + 1,
      cloudNameSafe: null,
      status: "pending",
      lastFailureCode: null,
      consecutiveFailureCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(cloudinaryConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.credentials_updated",
    targetEntityType: "cloudinary_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: "pending"});
}

/** Verify the stored credentials against Cloudinary's Admin API (`/ping`). */
export async function verifyConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }

  const db = getDb();
  await db
    .update(cloudinaryConnections)
    .set({status: "verifying", updatedAt: new Date()})
    .where(eq(cloudinaryConnections.id, connection.id));

  const credentials = await decryptConnectionCredentials(connection);

  try {
    await verifyCredentials(credentials);

    const now = new Date();
    const [updated] = await db
      .update(cloudinaryConnections)
      .set({
        status: "active",
        cloudNameSafe: toCloudNameSafe(credentials.cloudName),
        lastVerifiedAt: now,
        lastSuccessAt: now,
        lastFailureAt: null,
        lastFailureCode: null,
        consecutiveFailureCount: 0,
        updatedAt: now,
      })
      .where(eq(cloudinaryConnections.id, connection.id))
      .returning();

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "cloudinary_connection.verified",
      targetEntityType: "cloudinary_connection",
      targetEntityId: connection.id,
    });

    return getConnectionSafeDto(updated ?? {...connection, status: "active"});
  } catch (error) {
    const code = error instanceof CloudinaryError ? error.code : "INTERNAL_ERROR";
    const newStatus = VERIFY_FAILURE_STATUS[code] ?? "unreachable";
    const now = new Date();
    const nextFailureCount = connection.consecutiveFailureCount + 1;
    await db
      .update(cloudinaryConnections)
      .set({
        status: newStatus,
        lastVerifiedAt: now,
        lastFailureAt: now,
        lastFailureCode: code,
        consecutiveFailureCount: nextFailureCount,
        updatedAt: now,
      })
      .where(eq(cloudinaryConnections.id, connection.id));

    await writeIntegrationAudit({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: "cloudinary_connection.verification_failed",
      targetEntityType: "cloudinary_connection",
      targetEntityId: connection.id,
      afterSummary: code,
    });

    if (nextFailureCount >= 5 || newStatus === "authentication_failed" || newStatus === "permission_failed") {
      const {emitWebhookEvent} = await import("@/server/webhooks/events");
      await emitWebhookEvent({
        workspaceType: input.workspaceType,
        workspaceId: input.workspaceId,
        eventType: "cloudinary.connection.degraded",
        entityType: "cloudinary_connection",
        entityId: connection.id,
        deduplicationKey: `cloudinary.connection.degraded:${connection.id}:${code}:${nextFailureCount}`,
        payload: {connectionId: connection.id, failureCode: code, status: newStatus},
      }).catch(() => undefined);
    }

    if (error instanceof CloudinaryError) throw error;
    throw new CloudinaryError("INTERNAL_ERROR", "Cloudinary connection verification failed.");
  }
}

/** Records that a workspace admin has acknowledged the risk of `upload` (public) delivery for this connection. */
export async function acknowledgePublicDelivery(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const db = getDb();
  const [updated] = await db
    .update(cloudinaryConnections)
    .set({publicDeliveryAcknowledgedAt: new Date(), updatedAt: new Date()})
    .where(eq(cloudinaryConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.public_delivery_acknowledged",
    targetEntityType: "cloudinary_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? connection);
}

export async function disableConnection(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  connectionId: string;
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status === "disconnected") {
    throw new CloudinaryError("CONNECTION_DISCONNECTED", "This connection has been disconnected.");
  }
  const db = getDb();
  const [updated] = await db
    .update(cloudinaryConnections)
    .set({status: "disabled", disabledAt: new Date(), updatedAt: new Date()})
    .where(eq(cloudinaryConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.disabled",
    targetEntityType: "cloudinary_connection",
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
}): Promise<CloudinaryConnectionSafeDto> {
  await requireManage(input.actorUserId, input.workspaceType, input.workspaceId);
  const connection = await getWorkspaceConnectionOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.connectionId,
  );
  if (connection.status !== "disabled") {
    throw new CloudinaryError("CONNECTION_NOT_ACTIVE", "Only a disabled connection can be re-enabled.");
  }
  const nextStatus: CloudinaryConnectionStatus = connection.cloudNameSafe ? "active" : "pending";
  const db = getDb();
  const [updated] = await db
    .update(cloudinaryConnections)
    .set({status: nextStatus, disabledAt: null, updatedAt: new Date()})
    .where(eq(cloudinaryConnections.id, connection.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.enabled",
    targetEntityType: "cloudinary_connection",
    targetEntityId: connection.id,
  });

  return getConnectionSafeDto(updated ?? {...connection, status: nextStatus});
}

/** Permanently disconnects a connection and destroys the stored credential ciphertexts. */
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

  const destroyedCloudName = encryptCredential("");
  const destroyedApiKey = encryptCredential("");
  const destroyedApiSecret = encryptCredential("");
  const db = getDb();
  await db
    .update(cloudinaryConnections)
    .set({
      status: "disconnected",
      disconnectedAt: new Date(),
      cloudNameCiphertext: destroyedCloudName.ciphertext,
      cloudNameNonce: destroyedCloudName.nonce,
      apiKeyCiphertext: destroyedApiKey.ciphertext,
      apiKeyNonce: destroyedApiKey.nonce,
      apiSecretCiphertext: destroyedApiSecret.ciphertext,
      apiSecretNonce: destroyedApiSecret.nonce,
      updatedAt: new Date(),
    })
    .where(eq(cloudinaryConnections.id, connection.id));

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "cloudinary_connection.disconnected",
    targetEntityType: "cloudinary_connection",
    targetEntityId: connection.id,
  });
}

/** Internal helper for publish-service — returns the decrypted credentials for one call. Never logs them. */
export async function decryptConnectionCredentials(connection: CloudinaryConnection): Promise<CloudinaryCredentials> {
  return {
    cloudName: decryptCredential(connection.cloudNameCiphertext, connection.cloudNameNonce),
    apiKey: decryptCredential(connection.apiKeyCiphertext, connection.apiKeyNonce),
    apiSecret: decryptCredential(connection.apiSecretCiphertext, connection.apiSecretNonce),
  };
}

export async function getConnectionRowForPublish(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  connectionId: string,
): Promise<CloudinaryConnection> {
  return getWorkspaceConnectionOrThrow(workspaceType, workspaceId, connectionId);
}
