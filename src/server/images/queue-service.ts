/**
 * DB-backed processing queue — Prompt 16.
 * Claims jobs with FOR UPDATE SKIP LOCKED; executes via existing processing engine.
 */
import {and, eq, inArray, isNotNull, lt, sql} from "drizzle-orm";
import {getDb, getPostgresClient} from "@/db";
import {processingJobs, workerHeartbeats, type ProcessingJob} from "@/db/schema";
import {
  QUEUE_CLAIM_BATCH,
  QUEUE_LEASE_TTL_MS,
  QUEUE_WORKER_DEAD_MS,
  getQueuePolicy,
  leaseExpiryDate,
} from "@/server/images/queue-policy";
import {executeProcessingJob} from "@/server/images/processing-service";
import {onProcessingJobTerminalForBulk} from "@/server/images/bulk-queue-sync";

export type ClaimedJob = ProcessingJob;

export async function upsertWorkerHeartbeat(params: {
  workerId: string;
  hostname?: string | null;
  status?: string;
  jobsClaimedDelta?: number;
  jobsCompletedDelta?: number;
  jobsFailedDelta?: number;
  inFlight?: number;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  const existing = await db
    .select()
    .from(workerHeartbeats)
    .where(eq(workerHeartbeats.workerId, params.workerId))
    .limit(1);

  if (!existing[0]) {
    await db.insert(workerHeartbeats).values({
      workerId: params.workerId,
      hostname: params.hostname ?? null,
      startedAt: now,
      lastHeartbeatAt: now,
      status: params.status ?? "running",
      jobsClaimed: params.jobsClaimedDelta ?? 0,
      jobsCompleted: params.jobsCompletedDelta ?? 0,
      jobsFailed: params.jobsFailedDelta ?? 0,
      inFlight: params.inFlight ?? 0,
      updatedAt: now,
    });
    return;
  }

  await db
    .update(workerHeartbeats)
    .set({
      hostname: params.hostname ?? existing[0].hostname,
      lastHeartbeatAt: now,
      status: params.status ?? existing[0].status,
      jobsClaimed: existing[0].jobsClaimed + (params.jobsClaimedDelta ?? 0),
      jobsCompleted: existing[0].jobsCompleted + (params.jobsCompletedDelta ?? 0),
      jobsFailed: existing[0].jobsFailed + (params.jobsFailedDelta ?? 0),
      inFlight: params.inFlight ?? existing[0].inFlight,
      updatedAt: now,
    })
    .where(eq(workerHeartbeats.workerId, params.workerId));
}

export async function markWorkerStopped(workerId: string): Promise<void> {
  const db = getDb();
  await db
    .update(workerHeartbeats)
    .set({status: "stopped", inFlight: 0, lastHeartbeatAt: new Date(), updatedAt: new Date()})
    .where(eq(workerHeartbeats.workerId, workerId));
}

/**
 * Claim up to `limit` queued jobs for this worker.
 * Uses SKIP LOCKED so multiple workers never claim the same row.
 */
export async function claimQueuedJobs(params: {
  workerId: string;
  limit?: number;
}): Promise<ClaimedJob[]> {
  const limit = Math.max(1, Math.min(params.limit ?? QUEUE_CLAIM_BATCH, QUEUE_CLAIM_BATCH));
  const sqlClient = getPostgresClient();
  const expiresAt = leaseExpiryDate().toISOString();

  const rows = await sqlClient<Record<string, unknown>[]>`
    UPDATE processing_jobs AS pj
    SET
      status = 'processing',
      attempt_count = pj.attempt_count + 1,
      started_at = coalesce(pj.started_at, now()),
      lease_owner = ${params.workerId},
      lease_expires_at = ${expiresAt}::timestamp,
      heartbeat_at = now(),
      updated_at = now(),
      last_error_code = null,
      last_error_message_safe = null
    WHERE pj.id IN (
      SELECT id
      FROM processing_jobs
      WHERE status = 'queued'
        AND attempt_count < max_attempts
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING *
  `;

  if (rows.length) {
    await upsertWorkerHeartbeat({
      workerId: params.workerId,
      jobsClaimedDelta: rows.length,
    });
  }

  return rows.map(mapSqlJobRow);
}

function mapSqlJobRow(row: Record<string, unknown>): ProcessingJob {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    imageId: String(row.image_id),
    createdBy: String(row.created_by),
    operation: row.operation as ProcessingJob["operation"],
    preset: (row.preset as string | null) ?? null,
    status: row.status as ProcessingJob["status"],
    sourceStorageKey: String(row.source_storage_key),
    sourceByteSize: Number(row.source_byte_size),
    sourceDetectedFormat: (row.source_detected_format as string | null) ?? null,
    sourceMimeType: (row.source_mime_type as string | null) ?? null,
    sourceWidth: row.source_width == null ? null : Number(row.source_width),
    sourceHeight: row.source_height == null ? null : Number(row.source_height),
    sourceEtag: (row.source_etag as string | null) ?? null,
    outputStorageKey: (row.output_storage_key as string | null) ?? null,
    outputByteSize: row.output_byte_size == null ? null : Number(row.output_byte_size),
    outputDetectedFormat: (row.output_detected_format as string | null) ?? null,
    outputMimeType: (row.output_mime_type as string | null) ?? null,
    outputWidth: row.output_width == null ? null : Number(row.output_width),
    outputHeight: row.output_height == null ? null : Number(row.output_height),
    outputEtag: (row.output_etag as string | null) ?? null,
    outputChecksum: (row.output_checksum as string | null) ?? null,
    processingDurationMs:
      row.processing_duration_ms == null ? null : Number(row.processing_duration_ms),
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
    leaseOwner: (row.lease_owner as string | null) ?? null,
    leaseExpiresAt: row.lease_expires_at ? new Date(String(row.lease_expires_at)) : null,
    heartbeatAt: row.heartbeat_at ? new Date(String(row.heartbeat_at)) : null,
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    failedAt: row.failed_at ? new Date(String(row.failed_at)) : null,
    cancelledAt: row.cancelled_at ? new Date(String(row.cancelled_at)) : null,
    cleanupStartedAt: row.cleanup_started_at ? new Date(String(row.cleanup_started_at)) : null,
    cleanupCompletedAt: row.cleanup_completed_at
      ? new Date(String(row.cleanup_completed_at))
      : null,
    lastErrorCode: (row.last_error_code as string | null) ?? null,
    lastErrorMessageSafe: (row.last_error_message_safe as string | null) ?? null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export async function heartbeatLeasedJob(params: {
  workerId: string;
  jobId: string;
}): Promise<boolean> {
  const db = getDb();
  const expiresAt = leaseExpiryDate();
  const [row] = await db
    .update(processingJobs)
    .set({
      heartbeatAt: new Date(),
      leaseExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processingJobs.id, params.jobId),
        eq(processingJobs.leaseOwner, params.workerId),
        inArray(processingJobs.status, [
          "processing",
          "uploading_output",
          "verifying_output",
        ]),
      ),
    )
    .returning({id: processingJobs.id});
  return Boolean(row);
}

export async function clearLease(params: {
  jobId: string;
  workerId: string;
}): Promise<void> {
  const db = getDb();
  await db
    .update(processingJobs)
    .set({
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(processingJobs.id, params.jobId), eq(processingJobs.leaseOwner, params.workerId)));
}

/** Requeue jobs whose lease expired (worker crash / missed heartbeat). */
export async function recoverExpiredLeases(params?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{scanned: number; recovered: number; jobIds: string[]}> {
  const db = getDb();
  const now = new Date();
  const expired = await db
    .select({id: processingJobs.id, status: processingJobs.status})
    .from(processingJobs)
    .where(
      and(
        inArray(processingJobs.status, [
          "processing",
          "uploading_output",
          "verifying_output",
        ]),
        isNotNull(processingJobs.leaseExpiresAt),
        lt(processingJobs.leaseExpiresAt, now),
      ),
    )
    .limit(params?.limit ?? 50);

  if (params?.dryRun || !expired.length) {
    return {scanned: expired.length, recovered: 0, jobIds: expired.map((r) => r.id)};
  }

  const ids = expired.map((r) => r.id);
  await db
    .update(processingJobs)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      lastErrorCode: "LEASE_EXPIRED",
      lastErrorMessageSafe: "LEASE_EXPIRED",
      updatedAt: new Date(),
    })
    .where(inArray(processingJobs.id, ids));

  return {scanned: expired.length, recovered: ids.length, jobIds: ids};
}

/** Mark dead workers stopped when heartbeat is stale. */
export async function recoverDeadWorkers(params?: {dryRun?: boolean}): Promise<{
  scanned: number;
  markedStopped: number;
}> {
  const db = getDb();
  const cutoff = new Date(Date.now() - QUEUE_WORKER_DEAD_MS);
  const dead = await db
    .select()
    .from(workerHeartbeats)
    .where(
      and(
        eq(workerHeartbeats.status, "running"),
        lt(workerHeartbeats.lastHeartbeatAt, cutoff),
      ),
    )
    .limit(50);

  if (params?.dryRun || !dead.length) {
    return {scanned: dead.length, markedStopped: 0};
  }

  for (const row of dead) {
    await db
      .update(workerHeartbeats)
      .set({status: "dead", inFlight: 0, updatedAt: new Date()})
      .where(eq(workerHeartbeats.workerId, row.workerId));
  }
  return {scanned: dead.length, markedStopped: dead.length};
}

/**
 * Execute a job already claimed by this worker.
 * Reuses executeProcessingJob engine path with alreadyClaimed + workerId.
 */
export async function processClaimedJob(params: {
  workerId: string;
  job: ClaimedJob;
}): Promise<{ok: boolean; terminal: boolean}> {
  const result = await executeProcessingJob({
    userId: params.job.createdBy,
    projectId: params.job.projectId,
    jobId: params.job.id,
    workerId: params.workerId,
    alreadyClaimed: true,
  });

  await clearLease({jobId: params.job.id, workerId: params.workerId}).catch(() => undefined);

  const terminalStatuses = new Set([
    "completed",
    "failed",
    "cancelled",
    "stale",
    "cleanup_pending",
    "cleanup_failed",
  ]);
  const status = result.ok ? result.job.status : "failed";
  const terminal = terminalStatuses.has(status);

  if (terminal) {
    await onProcessingJobTerminalForBulk({
      processingJobId: params.job.id,
      projectId: params.job.projectId,
      status,
      errorCode: result.ok ? result.job.lastErrorCode : "PROCESSING_FAILED",
    }).catch(() => undefined);
  }

  if (result.ok && result.job.status === "completed") {
    await upsertWorkerHeartbeat({workerId: params.workerId, jobsCompletedDelta: 1});
  } else if (!result.ok || result.job.status === "failed" || result.job.status === "stale") {
    await upsertWorkerHeartbeat({workerId: params.workerId, jobsFailedDelta: 1});
  }

  return {ok: result.ok, terminal};
}

export async function releaseInFlightLeasesOnShutdown(params: {
  workerId: string;
  jobIds: string[];
}): Promise<void> {
  if (!params.jobIds.length) return;
  const db = getDb();
  // Only requeue jobs still active under this worker — finished jobs keep terminal status
  await db
    .update(processingJobs)
    .set({
      status: "queued",
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      // Do not increment attempt again on reclaim — decrement if we claimed but didn't finish
      attemptCount: sql`greatest(${processingJobs.attemptCount} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(processingJobs.id, params.jobIds),
        eq(processingJobs.leaseOwner, params.workerId),
        inArray(processingJobs.status, [
          "processing",
          "uploading_output",
          "verifying_output",
        ]),
      ),
    );
}

export {getQueuePolicy, QUEUE_LEASE_TTL_MS};
