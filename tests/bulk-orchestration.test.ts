import {describe, expect, it} from "vitest";
import {
  BULK_MAX_CONCURRENCY,
  BULK_MAX_IMAGES,
  getBulkPolicy,
  mapWithConcurrency,
} from "@/server/images/bulk-policy";

describe("bulk policy", () => {
  it("bounds concurrency and selection size centrally", () => {
    const policy = getBulkPolicy();
    expect(policy.maxImages).toBe(BULK_MAX_IMAGES);
    expect(policy.maxConcurrency).toBe(BULK_MAX_CONCURRENCY);
    expect(policy.maxConcurrency).toBeLessThanOrEqual(5);
    expect(policy.mixedOperationsAllowed).toBe(false);
    expect(policy.reusesSingleImageEngine).toBe(true);
    expect(policy.fakeProgressAllowed).toBe(false);
  });

  it("mapWithConcurrency never exceeds the bound", async () => {
    let inFlight = 0;
    let peak = 0;
    const items = Array.from({length: 12}, (_, i) => i);
    await mapWithConcurrency(items, 3, async (n) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return n * 2;
    });
    expect(peak).toBeLessThanOrEqual(3);
  });

  it("mapWithConcurrency preserves order of results", async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n + 10);
    expect(results).toEqual([11, 12, 13, 14]);
  });
});
