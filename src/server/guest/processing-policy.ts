/** Shared guest job lifecycle — no tool-specific transforms. */

export const GUEST_JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "expired",
  "cancelled",
] as const;

export type GuestJobStatus = (typeof GUEST_JOB_STATUSES)[number];

const TRANSITIONS: Record<GuestJobStatus, readonly GuestJobStatus[]> = {
  queued: ["running", "cancelled", "expired"],
  running: ["completed", "failed", "cancelled", "expired"],
  completed: ["expired"],
  failed: ["expired", "queued"],
  expired: [],
  cancelled: ["expired"],
};

export function canTransitionGuestJob(from: GuestJobStatus, to: GuestJobStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Phase 1 foundation operation placeholder (diagnostics / passthrough). */
export const GUEST_FOUNDATION_OPERATION = "foundation.noop" as const;

export {GUEST_COMPRESS_OPERATION} from "@/server/guest/compress-policy";

export const GUEST_SUPPORTED_OPERATIONS = [
  GUEST_FOUNDATION_OPERATION,
  "compress.same_format",
  "resize.same_format",
  "crop.same_format",
  "convert.format",
  "geotag.write_gps",
  "metadata.inspect",
  "ai.generate_alt_text",
  "metadata.edit",
] as const;

export type GuestSupportedOperation = (typeof GUEST_SUPPORTED_OPERATIONS)[number];

export function isGuestSupportedOperation(value: string): value is GuestSupportedOperation {
  return (GUEST_SUPPORTED_OPERATIONS as readonly string[]).includes(value);
}
