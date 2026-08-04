/**
 * Prompt 25 — request idempotency for public API writes.
 *
 * Two-phase: `beginOrReplayIdempotency` inserts a placeholder row (unique on
 * apiKeyId+routeKey+idempotencyKey) before the handler runs. If another
 * request with the same key is mid-flight, callers get IDEMPOTENCY_IN_PROGRESS.
 * Once the handler finishes, `commitIdempotency` fills in the real response
 * so retried requests can safely replay it. Records expire after 24h.
 */
import {createHash} from "node:crypto";
import {and, eq, lt} from "drizzle-orm";
import {getDb} from "@/db";
import {apiIdempotencyRecords, type ApiWorkspaceType} from "@/db/schema";
import {ApiError} from "@/server/api/errors";

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** Sentinel HTTP status used for the placeholder row while a request is in flight. */
const IN_PROGRESS_STATUS = 0;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, canonicalize(v)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

export function computeRequestFingerprint(body: unknown): string {
  const stable = JSON.stringify(canonicalize(body ?? null));
  return createHash("sha256").update(stable, "utf8").digest("hex");
}

export type IdempotencyBeginResult =
  | {state: "start"; recordId: string}
  | {state: "replay"; responseStatus: number; responseBody: Record<string, unknown>};

export async function beginOrReplayIdempotency(params: {
  apiKeyId: string;
  workspaceType: ApiWorkspaceType;
  workspaceId: string;
  routeKey: string;
  idempotencyKey: string;
  requestBody: unknown;
}): Promise<IdempotencyBeginResult> {
  const fingerprint = computeRequestFingerprint(params.requestBody);
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS);

  const [inserted] = await db
    .insert(apiIdempotencyRecords)
    .values({
      apiKeyId: params.apiKeyId,
      workspaceType: params.workspaceType,
      workspaceId: params.workspaceId,
      routeKey: params.routeKey,
      idempotencyKey: params.idempotencyKey,
      requestFingerprint: fingerprint,
      responseStatus: IN_PROGRESS_STATUS,
      responseBody: {},
      expiresAt,
    })
    .onConflictDoNothing()
    .returning({id: apiIdempotencyRecords.id});

  if (inserted) {
    return {state: "start", recordId: inserted.id};
  }

  const [existing] = await db
    .select()
    .from(apiIdempotencyRecords)
    .where(
      and(
        eq(apiIdempotencyRecords.apiKeyId, params.apiKeyId),
        eq(apiIdempotencyRecords.routeKey, params.routeKey),
        eq(apiIdempotencyRecords.idempotencyKey, params.idempotencyKey),
      ),
    )
    .limit(1);

  if (!existing) {
    // Extremely unlikely race: conflicted then vanished (expired cleanup). Treat as fresh start.
    return beginOrReplayIdempotency(params);
  }

  if (existing.expiresAt.getTime() < now.getTime()) {
    // Expired — allow a fresh attempt by replacing the placeholder.
    await db.delete(apiIdempotencyRecords).where(eq(apiIdempotencyRecords.id, existing.id));
    return beginOrReplayIdempotency(params);
  }

  if (existing.requestFingerprint !== fingerprint) {
    throw new ApiError(
      "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY",
      "This Idempotency-Key was already used with a different request body.",
    );
  }

  if (existing.responseStatus === IN_PROGRESS_STATUS) {
    throw new ApiError(
      "IDEMPOTENCY_IN_PROGRESS",
      "A request with this Idempotency-Key is still being processed.",
    );
  }

  return {
    state: "replay",
    responseStatus: existing.responseStatus,
    responseBody: existing.responseBody,
  };
}

export async function commitIdempotency(params: {
  recordId: string;
  responseStatus: number;
  responseBody: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db
    .update(apiIdempotencyRecords)
    .set({
      responseStatus: params.responseStatus,
      responseBody: params.responseBody,
    })
    .where(eq(apiIdempotencyRecords.id, params.recordId));
}

/** Release the in-flight placeholder if the handler throws before committing. */
export async function abandonIdempotency(recordId: string): Promise<void> {
  const db = getDb();
  await db.delete(apiIdempotencyRecords).where(eq(apiIdempotencyRecords.id, recordId));
}

export async function pruneExpiredIdempotencyRecords(limit = 500): Promise<number> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({id: apiIdempotencyRecords.id})
    .from(apiIdempotencyRecords)
    .where(lt(apiIdempotencyRecords.expiresAt, now))
    .limit(limit);
  if (!rows.length) return 0;
  await db.delete(apiIdempotencyRecords).where(
    lt(apiIdempotencyRecords.expiresAt, now),
  );
  return rows.length;
}
