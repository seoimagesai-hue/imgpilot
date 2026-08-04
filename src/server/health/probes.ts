/**
 * Minimal ops health probes restored for Consumer Redesign v2 cutover.
 * Shape mirrors the previous live /api/health* responses (no secrets).
 */

import {HeadBucketCommand, ListObjectsV2Command} from "@aws-sdk/client-s3";
import {sql} from "drizzle-orm";
import {checkDatabaseConnection} from "@/db/health";
import {getDb} from "@/db/index";
import {workerHeartbeats} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import {getR2Client, getR2ClientConfig} from "@/server/storage/r2-client";

export type ProbeStatus = "ok" | "fail" | "skipped" | "degraded";

export type ProbeResult = {
  status: ProbeStatus;
  latencyMs: number;
  detail?: string;
};

export type HealthPayload = {
  status: ProbeStatus;
  checkedAt: string;
  probes: Record<string, ProbeResult>;
  metrics?: Record<string, unknown>;
  memory?: NodeJS.MemoryUsage;
};

function ok(latencyMs: number, detail?: string): ProbeResult {
  return {status: "ok", latencyMs, ...(detail ? {detail} : {})};
}

function fail(latencyMs: number, detail?: string): ProbeResult {
  return {status: "fail", latencyMs, ...(detail ? {detail} : {})};
}

function skipped(detail: string): ProbeResult {
  return {status: "skipped", latencyMs: 0, detail};
}

function rollupStatus(probes: ProbeResult[]): ProbeStatus {
  if (probes.some((p) => p.status === "fail")) return "fail";
  if (probes.some((p) => p.status === "degraded")) return "degraded";
  if (probes.every((p) => p.status === "skipped")) return "skipped";
  return "ok";
}

export async function probeLive(): Promise<ProbeResult> {
  return ok(0);
}

export async function probeCache(): Promise<ProbeResult> {
  const t0 = performance.now();
  const okEnv = Boolean(process.env.DATABASE_URL || process.env.AUTH_SECRET);
  const ms = Math.round(performance.now() - t0);
  return okEnv ? ok(ms, "process_env_ok") : fail(ms, "process_env_missing");
}

export async function probeDatabase(): Promise<ProbeResult> {
  const t0 = performance.now();
  const result = await checkDatabaseConnection();
  const ms = Math.round(performance.now() - t0);
  return result.ok ? ok(ms) : fail(ms, "database_unreachable");
}

export async function probeR2(): Promise<ProbeResult> {
  const t0 = performance.now();
  if (!isR2Configured()) {
    return skipped("r2_not_configured");
  }
  try {
    const config = getR2ClientConfig();
    const client = getR2Client(config);
    await client.send(
      new HeadBucketCommand({
        Bucket: config.bucketName,
      }),
    );
    // Lightweight list to prove credentials can read (prefix probe only).
    await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 1,
        Prefix: "__healthcheck/",
      }),
    );
    return ok(Math.round(performance.now() - t0));
  } catch {
    return fail(Math.round(performance.now() - t0), "r2_unreachable");
  }
}

export async function probeQueue(): Promise<ProbeResult> {
  const t0 = performance.now();
  try {
    const db = getDb();
    const rows = await db.execute(sql`
      select
        count(*) filter (where status in ('queued', 'processing', 'uploading_output', 'verifying_output'))::int as activeish,
        count(*) filter (where status = 'queued')::int as queued
      from processing_jobs
    `);
    const row = (rows as unknown as {activeish: number; queued: number}[])[0];
    const active = Number(row?.activeish ?? 0);
    const queued = Number(row?.queued ?? 0);
    const detail = `backlog:${queued > 100 ? "elevated" : "normal"};active:${active > 0 ? "yes" : "no"}`;
    return ok(Math.round(performance.now() - t0), detail);
  } catch {
    return fail(Math.round(performance.now() - t0), "queue_unreachable");
  }
}

const WORKER_FRESH_MS = 5 * 60 * 1000;

export async function probeWorker(): Promise<ProbeResult> {
  const t0 = performance.now();
  try {
    const db = getDb();
    const rows = await db.select().from(workerHeartbeats).limit(20);
    const ms = Math.round(performance.now() - t0);
    if (rows.length === 0) {
      return {status: "degraded", latencyMs: ms, detail: "no_worker_heartbeat"};
    }
    const newest = rows.reduce((a, b) =>
      a.lastHeartbeatAt.getTime() >= b.lastHeartbeatAt.getTime() ? a : b,
    );
    const age = Date.now() - newest.lastHeartbeatAt.getTime();
    if (age <= WORKER_FRESH_MS) {
      return ok(ms, "heartbeat_fresh");
    }
    return {status: "degraded", latencyMs: ms, detail: "heartbeat_stale"};
  } catch {
    return fail(Math.round(performance.now() - t0), "worker_unreachable");
  }
}

export async function probeScheduler(): Promise<ProbeResult> {
  const {cleanupSchedulerProbe} = await import("@/server/ops/cleanup-scheduler");
  const result = cleanupSchedulerProbe();
  return {
    status: result.status,
    latencyMs: result.latencyMs,
    ...(result.detail ? {detail: result.detail} : {}),
  };
}

export async function probeStripe(): Promise<ProbeResult> {
  const t0 = performance.now();
  const {getStripeConfigStatus} = await import("@/server/billing/stripe-client");
  const status = getStripeConfigStatus();
  const ms = Math.round(performance.now() - t0);
  if (!status.configured) return skipped("stripe_not_configured");
  return ok(ms, `mode:${status.mode}`);
}

export async function buildReadyHealth(): Promise<HealthPayload> {
  const [live, database, cache] = await Promise.all([
    probeLive(),
    probeDatabase(),
    probeCache(),
  ]);
  const probes = {live, database, cache};
  return {
    status: rollupStatus(Object.values(probes)),
    checkedAt: new Date().toISOString(),
    probes,
  };
}

export async function buildFullHealth(): Promise<HealthPayload> {
  const [live, database, r2, queue, worker, scheduler, cache, stripe] = await Promise.all([
    probeLive(),
    probeDatabase(),
    probeR2(),
    probeQueue(),
    probeWorker(),
    probeScheduler(),
    probeCache(),
    probeStripe(),
  ]);
  const probes = {live, database, r2, queue, worker, cache, scheduler, stripe};
  return {
    status: rollupStatus(
      Object.values(probes).filter((p) => p.status !== "skipped"),
    ),
    checkedAt: new Date().toISOString(),
    probes,
  };
}

function jsonResponse(payload: HealthPayload, forceOk = false) {
  const httpStatus =
    forceOk || payload.status === "ok" || payload.status === "skipped" || payload.status === "degraded"
      ? 200
      : 503;
  return Response.json(payload, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function healthJson(payload: HealthPayload, options?: {readyStrict?: boolean}) {
  if (options?.readyStrict) {
    const required: ProbeResult[] = [
      payload.probes.live,
      payload.probes.database,
      payload.probes.cache,
    ].filter(Boolean);
    const status = rollupStatus(required);
    const body: HealthPayload = {
      status,
      checkedAt: payload.checkedAt,
      probes: {
        live: payload.probes.live,
        database: payload.probes.database,
        cache: payload.probes.cache,
      },
    };
    return jsonResponse(body);
  }
  return jsonResponse(payload);
}
