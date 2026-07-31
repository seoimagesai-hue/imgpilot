/**
 * Safe application error codes for delete / replace lifecycle.
 * Never expose bucket names, keys, SDK IDs, SQL, or Sharp internals to clients.
 */

export type SafeLifecycleErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "PROJECT_NOT_FOUND"
  | "IMAGE_NOT_FOUND"
  | "IMAGE_ALREADY_DELETED"
  | "IMAGE_DELETION_IN_PROGRESS"
  | "IMAGE_DELETION_FAILED"
  | "IMAGE_NOT_DELETABLE"
  | "IMAGE_NOT_REPLACEABLE"
  | "REPLACEMENT_ALREADY_ACTIVE"
  | "REPLACEMENT_NOT_FOUND"
  | "REPLACEMENT_INVALID_STATE"
  | "REPLACEMENT_UPLOAD_NOT_CONFIRMED"
  | "REPLACEMENT_VALIDATION_FAILED"
  | "REPLACEMENT_NOT_READY"
  | "REPLACEMENT_PROMOTION_CONFLICT"
  | "STORAGE_CLEANUP_FAILED"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_UNAVAILABLE"
  | "UPLOAD_EXPIRED"
  | "OBJECT_NOT_FOUND"
  | "OBJECT_SIZE_MISMATCH"
  | "OBJECT_TYPE_MISMATCH"
  | "OBJECT_TOO_LARGE"
  | "CONFIRMATION_FAILED"
  | "INSUFFICIENT_STORAGE_FOR_REPLACEMENT"
  | "PROJECT_STORAGE_LIMIT_REACHED"
  | "FILE_SIZE_LIMIT_EXCEEDED"
  | "UPLOAD_REJECTED_BY_QUOTA";

export class LifecycleDomainError extends Error {
  readonly code: SafeLifecycleErrorCode;

  constructor(code: SafeLifecycleErrorCode, message?: string) {
    super(message ?? code);
    this.name = "LifecycleDomainError";
    this.code = code;
  }
}

/** Statuses that remove the image from normal product use. */
export const DELETION_UNAVAILABLE_STATUSES = [
  "deletion_pending",
  "storage_deleting",
  "deletion_failed",
  "deleted",
] as const;

export type DeletionUnavailableStatus = (typeof DELETION_UNAVAILABLE_STATUSES)[number];

export function isDeletionUnavailableStatus(status: string): status is DeletionUnavailableStatus {
  return (DELETION_UNAVAILABLE_STATUSES as readonly string[]).includes(status);
}

/** Statuses eligible to begin deletion. */
export const DELETABLE_STATUSES = [
  "pending_upload",
  "uploaded",
  "upload_failed",
  "validating",
  "validated",
  "validation_failed",
  "ready_for_processing",
] as const;

export function isDeletableStatus(status: string): boolean {
  return (DELETABLE_STATUSES as readonly string[]).includes(status);
}

/** Statuses eligible to begin replacement. */
export const REPLACEABLE_STATUSES = ["validated", "validation_failed", "ready_for_processing"] as const;

export function isReplaceableStatus(status: string): boolean {
  return (REPLACEABLE_STATUSES as readonly string[]).includes(status);
}

/** Open replacement statuses that block a second concurrent start. */
export const OPEN_REPLACEMENT_STATUSES = [
  "pending",
  "uploading",
  "uploaded",
  "validating",
  "validated",
  "failed",
  "promotion_pending",
  "cancel_cleanup_failed",
] as const;

export function isOpenReplacementStatus(status: string): boolean {
  return (OPEN_REPLACEMENT_STATUSES as readonly string[]).includes(status);
}

export const STALE_DELETION_MS = 15 * 60 * 1000;
export const STALE_REPLACEMENT_MS = 30 * 60 * 1000;
export const RECOVERY_BATCH_LIMIT = 50;
