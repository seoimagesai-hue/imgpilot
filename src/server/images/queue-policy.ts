/**
 * Queue / worker policy — Prompt 16.
 * Processing engine (Sharp) remains unchanged; only execution transport changes.
 */
export const QUEUE_LEASE_TTL_MS = 60_000;
export const QUEUE_HEARTBEAT_INTERVAL_MS = 15_000;
export const QUEUE_POLL_INTERVAL_MS = 1_000;
export const QUEUE_WORKER_PARALLEL_JOBS = 3;
export const QUEUE_CLAIM_BATCH = 3;
export const QUEUE_STALE_LEASE_MS = QUEUE_LEASE_TTL_MS;
export const QUEUE_WORKER_DEAD_MS = 2 * QUEUE_LEASE_TTL_MS;

export type QueuePolicySummary = {
  leaseTtlMs: number;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
  parallelJobsPerWorker: number;
  claimBatch: number;
  browserExecutesProcessing: false;
  reusesProcessingEngine: true;
  fakeProgressAllowed: false;
};

export function getQueuePolicy(): QueuePolicySummary {
  return {
    leaseTtlMs: QUEUE_LEASE_TTL_MS,
    heartbeatIntervalMs: QUEUE_HEARTBEAT_INTERVAL_MS,
    pollIntervalMs: QUEUE_POLL_INTERVAL_MS,
    parallelJobsPerWorker: QUEUE_WORKER_PARALLEL_JOBS,
    claimBatch: QUEUE_CLAIM_BATCH,
    browserExecutesProcessing: false,
    reusesProcessingEngine: true,
    fakeProgressAllowed: false,
  };
}

export function leaseExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + QUEUE_LEASE_TTL_MS);
}
