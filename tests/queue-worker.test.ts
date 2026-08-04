import {describe, expect, it} from "vitest";
import {
  QUEUE_LEASE_TTL_MS,
  QUEUE_WORKER_PARALLEL_JOBS,
  getQueuePolicy,
  leaseExpiryDate,
} from "@/server/images/queue-policy";

describe("queue policy", () => {
  it("bounds worker parallelism and lease TTL centrally", () => {
    const policy = getQueuePolicy();
    expect(policy.parallelJobsPerWorker).toBe(QUEUE_WORKER_PARALLEL_JOBS);
    expect(policy.parallelJobsPerWorker).toBeLessThanOrEqual(5);
    expect(policy.leaseTtlMs).toBe(QUEUE_LEASE_TTL_MS);
    expect(policy.browserExecutesProcessing).toBe(false);
    expect(policy.reusesProcessingEngine).toBe(true);
    expect(policy.fakeProgressAllowed).toBe(false);
  });

  it("lease expiry is in the future", () => {
    const from = new Date("2026-07-31T00:00:00.000Z");
    expect(leaseExpiryDate(from).getTime()).toBe(from.getTime() + QUEUE_LEASE_TTL_MS);
  });
});
