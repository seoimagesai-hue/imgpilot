/** Guest cleanup / exact-key deletion policy. */

export const GUEST_CLEANUP_MAX_ATTEMPTS = 8;
export const GUEST_CLEANUP_BATCH_SIZE = 25;

/** Exponential backoff base (ms) between cleanup retries. */
export const GUEST_CLEANUP_BACKOFF_BASE_MS = 30_000;
export const GUEST_CLEANUP_BACKOFF_MAX_MS = 60 * 60 * 1000;

export function nextGuestCleanupRetryAt(attempt: number, now = new Date()): Date {
  const exp = Math.min(
    GUEST_CLEANUP_BACKOFF_MAX_MS,
    GUEST_CLEANUP_BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1),
  );
  return new Date(now.getTime() + exp);
}
