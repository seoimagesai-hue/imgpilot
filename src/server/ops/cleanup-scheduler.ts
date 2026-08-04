import {mkdirSync, readFileSync, writeFileSync, existsSync} from "node:fs";
import {join} from "node:path";
import {timingSafeEqual} from "node:crypto";
import {getServerEnv} from "@/lib/env";

const HEARTBEAT_REL = join(".data", "ops", "cleanup-scheduler.json");

export type CleanupSchedulerHeartbeat = {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastStatus: "ok" | "failed" | "skipped";
  reconciled?: number;
  processed?: number;
  succeeded?: number;
  failed?: number;
};

function heartbeatPath(): string {
  return join(process.cwd(), HEARTBEAT_REL);
}

export function readCleanupSchedulerHeartbeat(): CleanupSchedulerHeartbeat {
  const path = heartbeatPath();
  if (!existsSync(path)) {
    return {
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastStatus: "skipped",
    };
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CleanupSchedulerHeartbeat;
  } catch {
    return {
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastStatus: "failed",
    };
  }
}

export function writeCleanupSchedulerHeartbeat(data: CleanupSchedulerHeartbeat): void {
  const path = heartbeatPath();
  mkdirSync(join(process.cwd(), ".data", "ops"), {recursive: true});
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

export function getCronSecret(): string {
  const env = getServerEnv();
  return (env.CRON_SECRET || env.CLEANUP_CRON_SECRET || "").trim();
}

export function verifyCronSecret(headerValue: string | null): boolean {
  const expected = getCronSecret();
  if (!expected || !headerValue) return false;
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

let inFlight = false;

export async function runAuthenticatedCleanupJob(): Promise<{
  ok: boolean;
  reconciled: number;
  processed: number;
  succeeded: number;
  failed: number;
  overlap: boolean;
}> {
  if (inFlight) {
    return {ok: false, reconciled: 0, processed: 0, succeeded: 0, failed: 0, overlap: true};
  }
  inFlight = true;
  const attemptedAt = new Date().toISOString();
  try {
    const {processGuestCleanupBatch, reconcileExpiredGuestAssets} = await import(
      "@/server/guest/cleanup-service"
    );
    const reconciled = await reconcileExpiredGuestAssets(100);
    const batch = await processGuestCleanupBatch();
    writeCleanupSchedulerHeartbeat({
      lastSuccessAt: new Date().toISOString(),
      lastAttemptAt: attemptedAt,
      lastStatus: "ok",
      reconciled,
      processed: batch.processed,
      succeeded: batch.succeeded,
      failed: batch.failed,
    });
    return {
      ok: true,
      reconciled,
      processed: batch.processed,
      succeeded: batch.succeeded,
      failed: batch.failed,
      overlap: false,
    };
  } catch {
    writeCleanupSchedulerHeartbeat({
      lastSuccessAt: readCleanupSchedulerHeartbeat().lastSuccessAt,
      lastAttemptAt: attemptedAt,
      lastStatus: "failed",
    });
    throw new Error("CLEANUP_JOB_FAILED");
  } finally {
    inFlight = false;
  }
}

export function cleanupSchedulerProbe(maxAgeMs = 20 * 60 * 1000): {
  status: "ok" | "fail" | "skipped" | "degraded";
  latencyMs: number;
  detail?: string;
} {
  const hb = readCleanupSchedulerHeartbeat();
  if (!hb.lastSuccessAt) {
    return {status: "skipped", latencyMs: 0, detail: "no_successful_run_yet"};
  }
  const age = Date.now() - new Date(hb.lastSuccessAt).getTime();
  if (Number.isNaN(age)) {
    return {status: "fail", latencyMs: 0, detail: "invalid_heartbeat"};
  }
  if (age <= maxAgeMs) {
    return {status: "ok", latencyMs: 0, detail: "heartbeat_fresh"};
  }
  return {status: "degraded", latencyMs: 0, detail: "heartbeat_stale"};
}
