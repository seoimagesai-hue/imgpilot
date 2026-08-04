"use client";

const TERMINAL = new Set([
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export type MetadataBatchPollDto = {
  id: string;
  status: string;
  queuedCount: number;
  runningCount: number;
  draftCount: number;
  failedCount: number;
  cancelledCount: number;
  staleCount: number;
  skippedCount: number;
  approvedCount: number;
  rejectedCount: number;
  reviewedCount: number;
  totalCount: number;
  eligibleCount: number;
  cancelRequested: boolean;
};

export function isTerminalBatchStatus(status: string): boolean {
  return TERMINAL.has(status);
}

/** Poll batch GET until terminal or no active items remain. */
export async function pollMetadataBatch(params: {
  projectId: string;
  batchId: string;
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (batch: MetadataBatchPollDto) => void;
}): Promise<MetadataBatchPollDto | null> {
  const intervalMs = params.intervalMs ?? 1500;
  const timeoutMs = params.timeoutMs ?? 300_000;
  const started = Date.now();
  let last: MetadataBatchPollDto | null = null;

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `/api/projects/${params.projectId}/metadata/batches/${params.batchId}`,
    );
    const json = (await res.json()) as {ok?: boolean; batch?: MetadataBatchPollDto};
    if (json.ok && json.batch) {
      last = json.batch;
      params.onUpdate?.(json.batch);
      const active = json.batch.queuedCount + json.batch.runningCount;
      if (isTerminalBatchStatus(json.batch.status) && active === 0) {
        return json.batch;
      }
      if (
        json.batch.status === "cancelling" &&
        active === 0 &&
        json.batch.draftCount + json.batch.failedCount + json.batch.skippedCount > 0
      ) {
        return json.batch;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}
