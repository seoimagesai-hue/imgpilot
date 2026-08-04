"use client";

const TERMINAL = new Set([
  "completed",
  "failed",
  "cancelled",
  "stale",
  "cleanup_pending",
  "cleanup_failed",
]);

export function isTerminalJobStatus(status: string): boolean {
  return TERMINAL.has(status);
}

/** Poll GET job until terminal. Real status only — no fake progress. */
export async function pollProcessingJob<T extends {status: string}>(params: {
  projectId: string;
  jobId: string;
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (job: T) => void;
}): Promise<T | null> {
  const intervalMs = params.intervalMs ?? 1000;
  const timeoutMs = params.timeoutMs ?? 120_000;
  const started = Date.now();
  let last: T | null = null;

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`/api/projects/${params.projectId}/processing/jobs/${params.jobId}`);
    const json = (await res.json()) as {ok?: boolean; job?: T};
    if (json.ok && json.job) {
      last = json.job;
      params.onUpdate?.(json.job);
      if (isTerminalJobStatus(json.job.status)) return json.job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}

export async function pollBulkJob<T extends {status: string; pendingCount: number; runningCount: number}>(params: {
  projectId: string;
  bulkJobId: string;
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (job: T) => void;
}): Promise<T | null> {
  const intervalMs = params.intervalMs ?? 1000;
  const timeoutMs = params.timeoutMs ?? 180_000;
  const started = Date.now();
  let last: T | null = null;
  const terminal = new Set([
    "completed",
    "partially_completed",
    "failed",
    "cancelled",
  ]);

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `/api/projects/${params.projectId}/processing/bulk/${params.bulkJobId}`,
    );
    const json = (await res.json()) as {ok?: boolean; job?: T};
    if (json.ok && json.job) {
      last = json.job;
      params.onUpdate?.(json.job);
      if (
        terminal.has(json.job.status) &&
        json.job.pendingCount === 0 &&
        json.job.runningCount === 0
      ) {
        return json.job;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}
