/**
 * Prompt 25 — public API key lifecycle.
 * Raw keys are only ever returned once, at creation/rotation time, and are
 * never persisted or logged. The database stores only a SHA-256 hash.
 */
import {createHash, randomBytes, timingSafeEqual} from "node:crypto";
import {and, count, eq, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {apiKeys, apiUsageCounters, type ApiKey, type ApiWorkspaceType} from "@/db/schema";
import {ApiError} from "@/server/api/errors";
import {ALL_API_SCOPES, parseScopes, type ApiScope} from "@/server/api/scopes";
import {
  requireManageIntegrations,
  resolveWorkspaceEntitlementUserId,
} from "@/server/api/permissions";
import {writeIntegrationAudit} from "@/server/api/audit";
import {resolveEntitlement} from "@/server/billing/entitlements";

export type ApiKeyEnvironment = "live" | "test";

export type ApiKeySafeDto = Omit<ApiKey, "secretHash">;

const KEY_PREFIX_BYTES = 4; // 8 hex chars
const KEY_SECRET_BYTES = 32; // base64url-encoded
const KEY_FORMAT_RE =
  /^si_(live|test)_([0-9a-f]{8})_([A-Za-z0-9_-]{32,64})$/;

export function getApiKeySafeDto(row: ApiKey): ApiKeySafeDto {
  const {secretHash, ...safe} = row;
  void secretHash;
  return safe;
}

/** Generate a new raw API key + the pieces persisted server-side. */
export function generateApiKey(env: ApiKeyEnvironment): {
  rawKey: string;
  publicPrefix: string;
  secretHash: string;
  environment: ApiKeyEnvironment;
} {
  const prefix = randomBytes(KEY_PREFIX_BYTES).toString("hex");
  const secret = randomBytes(KEY_SECRET_BYTES).toString("base64url");
  const rawKey = `si_${env}_${prefix}_${secret}`;
  return {
    rawKey,
    publicPrefix: `si_${env}_${prefix}`,
    secretHash: hashApiKey(rawKey),
    environment: env,
  };
}

/** Parse a raw key's structure without verifying it exists / is valid. */
export function parseApiKeyFormat(
  raw: string,
): {environment: ApiKeyEnvironment; publicPrefix: string} | null {
  const match = KEY_FORMAT_RE.exec(raw.trim());
  if (!match) return null;
  const [, env, prefix] = match;
  return {environment: env as ApiKeyEnvironment, publicPrefix: `si_${env}_${prefix}`};
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Constant-time comparison against the stored hash. */
export function verifyApiKey(raw: string, hash: string): boolean {
  const computed = Buffer.from(hashApiKey(raw), "hex");
  const stored = Buffer.from(hash, "hex");
  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}

const ACTIVE_STATUSES = ["active"] as const;

async function countActiveApiKeys(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({total: count()})
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.workspaceType, workspaceType),
        eq(apiKeys.workspaceId, workspaceId),
        inArray(apiKeys.status, ACTIVE_STATUSES),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function createApiKey(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
  environment?: ApiKeyEnvironment;
}): Promise<{key: ApiKeySafeDto; rawKey: string}> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new ApiError("INVALID_REQUEST", "name must be 1-120 characters.");
  }

  const {valid: scopes, invalid} = parseScopes(input.scopes);
  if (invalid.length > 0) {
    throw new ApiError("INVALID_SCOPE", `Unknown scopes: ${invalid.join(", ")}`, {invalid});
  }
  if (scopes.length === 0) {
    throw new ApiError("INVALID_REQUEST", "At least one scope is required.");
  }

  const entitlementUserId = await resolveWorkspaceEntitlementUserId(
    input.workspaceType,
    input.workspaceId,
  );
  if (!entitlementUserId) {
    throw new ApiError("RESOURCE_NOT_FOUND", "Workspace not found.");
  }
  const entitlement = await resolveEntitlement(entitlementUserId);
  if (!entitlement.plan.apiAccessEnabled) {
    throw new ApiError("API_ACCESS_NOT_ENABLED", "This plan does not include API access.");
  }

  const activeCount = await countActiveApiKeys(input.workspaceType, input.workspaceId);
  if (activeCount >= entitlement.plan.maxApiKeys) {
    throw new ApiError(
      "API_KEY_LIMIT_REACHED",
      `This workspace already has the maximum of ${entitlement.plan.maxApiKeys} active API keys.`,
    );
  }

  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw new ApiError("INVALID_REQUEST", "expiresAt must be in the future.");
  }

  const generated = generateApiKey(input.environment ?? "live");
  const db = getDb();
  const [row] = await db
    .insert(apiKeys)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      createdByUserId: input.actorUserId,
      name,
      environment: generated.environment,
      publicPrefix: generated.publicPrefix,
      secretHash: generated.secretHash,
      scopes,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();
  if (!row) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create API key.");
  }

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "api_key.created",
    targetEntityType: "api_key",
    targetEntityId: row.id,
    afterSummary: `name=${name} publicPrefix=${row.publicPrefix} scopes=${scopes.join(",")}`,
  });

  return {key: getApiKeySafeDto(row), rawKey: generated.rawKey};
}

export async function listApiKeys(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<ApiKeySafeDto[]> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const db = getDb();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.workspaceType, input.workspaceType),
        eq(apiKeys.workspaceId, input.workspaceId),
      ),
    )
    .orderBy(apiKeys.createdAt);
  return rows.map(getApiKeySafeDto);
}

async function getWorkspaceApiKeyOrThrow(
  workspaceType: ApiWorkspaceType,
  workspaceId: string,
  apiKeyId: string,
): Promise<ApiKey> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, apiKeyId),
        eq(apiKeys.workspaceType, workspaceType),
        eq(apiKeys.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!row) throw new ApiError("RESOURCE_NOT_FOUND", "API key not found.");
  return row;
}

export async function revokeApiKey(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  apiKeyId: string;
}): Promise<ApiKeySafeDto> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const existing = await getWorkspaceApiKeyOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.apiKeyId,
  );
  if (existing.status === "revoked") return getApiKeySafeDto(existing);

  const db = getDb();
  const [row] = await db
    .update(apiKeys)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      revokedByUserId: input.actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, existing.id))
    .returning();

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "api_key.revoked",
    targetEntityType: "api_key",
    targetEntityId: existing.id,
    beforeSummary: `status=${existing.status}`,
    afterSummary: "status=revoked",
  });

  return getApiKeySafeDto(row ?? existing);
}

/**
 * Create a replacement key with the same name/scopes/expiry, then immediately
 * revoke the previous key (status=rotated) linking it via rotatedFromKeyId.
 */
export async function rotateApiKey(input: {
  actorUserId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  apiKeyId: string;
}): Promise<{key: ApiKeySafeDto; rawKey: string}> {
  await requireManageIntegrations(input.actorUserId, input.workspaceType, input.workspaceId);
  const existing = await getWorkspaceApiKeyOrThrow(
    input.workspaceType,
    input.workspaceId,
    input.apiKeyId,
  );
  if (existing.status !== "active") {
    throw new ApiError("RESOURCE_CONFLICT", "Only active API keys can be rotated.");
  }

  const generated = generateApiKey(existing.environment as ApiKeyEnvironment);
  const db = getDb();

  const [created] = await db
    .insert(apiKeys)
    .values({
      workspaceType: existing.workspaceType,
      workspaceId: existing.workspaceId,
      createdByUserId: input.actorUserId,
      name: existing.name,
      environment: generated.environment,
      publicPrefix: generated.publicPrefix,
      secretHash: generated.secretHash,
      scopes: existing.scopes as ApiScope[],
      expiresAt: existing.expiresAt,
      rotatedFromKeyId: existing.id,
    })
    .returning();
  if (!created) {
    throw new ApiError("INTERNAL_ERROR", "Failed to rotate API key.");
  }

  await db
    .update(apiKeys)
    .set({
      status: "rotated",
      revokedAt: new Date(),
      revokedByUserId: input.actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, existing.id));

  await writeIntegrationAudit({
    workspaceType: input.workspaceType,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "api_key.rotated",
    targetEntityType: "api_key",
    targetEntityId: created.id,
    beforeSummary: `rotatedFrom=${existing.id}`,
    afterSummary: `publicPrefix=${created.publicPrefix}`,
  });

  return {key: getApiKeySafeDto(created), rawKey: generated.rawKey};
}

export {ALL_API_SCOPES};

/**
 * Look up a key by its public prefix regardless of status — auth.ts is
 * responsible for mapping status/expiry to the correct ApiError code.
 */
export async function findApiKeyByPublicPrefix(publicPrefix: string): Promise<ApiKey | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.publicPrefix, publicPrefix))
    .limit(1);
  return row ?? null;
}

export async function recordApiKeyUsage(input: {
  apiKeyId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(apiKeys)
    .set({
      lastUsedAt: now,
      requestCount: sql`${apiKeys.requestCount} + 1`,
      updatedAt: now,
    })
    .where(eq(apiKeys.id, input.apiKeyId));

  const periodYyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await db
    .insert(apiUsageCounters)
    .values({
      workspaceType: input.workspaceType,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      periodYyyyMm,
      category: "requests",
      quantity: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        apiUsageCounters.workspaceType,
        apiUsageCounters.workspaceId,
        apiUsageCounters.apiKeyId,
        apiUsageCounters.periodYyyyMm,
        apiUsageCounters.category,
      ],
      set: {
        quantity: sql`${apiUsageCounters.quantity} + 1`,
        updatedAt: now,
      },
    });
}
