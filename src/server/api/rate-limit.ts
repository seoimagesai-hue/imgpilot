/**
 * Prompt 25 — DB-backed fixed-window rate limiter for the public API.
 *
 * TEMPORARY multi-instance strategy: correctness across horizontally-scaled
 * instances relies entirely on the shared Postgres database (single atomic
 * INSERT ... ON CONFLICT ... UPDATE per request). This avoids needing Redis
 * for now but adds one DB round-trip per request; revisit with a Redis/edge
 * limiter if request volume or DB load makes this a bottleneck.
 */
import {getPostgresClient} from "@/db";

export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
};

function currentWindowStart(now: Date): Date {
  return new Date(Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS);
}

/**
 * Atomically increment the counter for `bucketKey` in the current 60s window
 * and report whether the caller is still within `limit`.
 * `bucketKey` should already encode workspace/key/route granularity, e.g.
 * `apikey:<apiKeyId>` or `apikey:<apiKeyId>:route:<routeKey>`.
 */
export async function consumeRateLimit(bucketKey: string, limit: number): Promise<RateLimitResult> {
  const sqlClient = getPostgresClient();
  const now = new Date();
  const windowStart = currentWindowStart(now);
  const resetAt = new Date(windowStart.getTime() + RATE_LIMIT_WINDOW_MS);
  const id = crypto.randomUUID();

  const rows = await sqlClient<{count: number}[]>`
    INSERT INTO api_rate_limit_buckets (id, bucket_key, window_started_at, count, updated_at)
    VALUES (${id}, ${bucketKey}, ${windowStart.toISOString()}::timestamptz, 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE
        WHEN api_rate_limit_buckets.window_started_at = ${windowStart.toISOString()}::timestamptz
          THEN api_rate_limit_buckets.count + 1
        ELSE 1
      END,
      window_started_at = ${windowStart.toISOString()}::timestamptz,
      updated_at = now()
    RETURNING count
  `;

  const currentCount = Number(rows[0]?.count ?? 1);
  const safeLimit = Math.max(1, limit);
  const ok = currentCount <= safeLimit;
  return {
    ok,
    remaining: Math.max(0, safeLimit - currentCount),
    limit: safeLimit,
    resetAt,
  };
}

/** Best-effort cleanup of old buckets — safe to run periodically from reconcile. */
export async function pruneExpiredRateLimitBuckets(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
  const sqlClient = getPostgresClient();
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();
  const rows = await sqlClient<{id: string}[]>`
    DELETE FROM api_rate_limit_buckets WHERE updated_at < ${cutoff}::timestamptz RETURNING id
  `;
  return rows.length;
}
