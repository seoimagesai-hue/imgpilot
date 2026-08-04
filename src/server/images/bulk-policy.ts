/**
 * Bulk orchestration policy — Prompt 15.
 * Reuses Prompt 12–14 engines; does not duplicate Sharp options.
 */
export const BULK_MAX_IMAGES = 100;
export const BULK_MAX_CONCURRENCY = 3;
export const BULK_STALE_RUNNING_MS = 30 * 60 * 1000;

export type BulkOperationSpec =
  | {operation: "optimize_same_format"; preset: null}
  | {operation: "resize"; preset: "px_256" | "px_512" | "px_1024" | "px_2048"}
  | {operation: "convert_format"; preset: "to_jpeg" | "to_png" | "to_webp" | "to_avif"};

export type BulkPolicySummary = {
  maxImages: number;
  maxConcurrency: number;
  mixedOperationsAllowed: false;
  reusesSingleImageEngine: true;
  fakeProgressAllowed: false;
};

export function getBulkPolicy(): BulkPolicySummary {
  return {
    maxImages: BULK_MAX_IMAGES,
    maxConcurrency: BULK_MAX_CONCURRENCY,
    mixedOperationsAllowed: false,
    reusesSingleImageEngine: true,
    fakeProgressAllowed: false,
  };
}

/** Run async work over items with a fixed concurrency bound. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runOne(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({length: Math.min(limit, items.length)}, () => runOne()));
  return results;
}
