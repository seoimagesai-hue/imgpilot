/**
 * Safe application error codes for project quota enforcement.
 * Never expose bucket names, keys, SDK IDs, SQL, or internal counters to clients.
 */

export type SafeQuotaErrorCode =
  | "PROJECT_IMAGE_LIMIT_REACHED"
  | "PROJECT_STORAGE_LIMIT_REACHED"
  | "FILE_SIZE_LIMIT_EXCEEDED"
  | "UPLOAD_BATCH_LIMIT_EXCEEDED"
  | "INSUFFICIENT_STORAGE_FOR_REPLACEMENT"
  | "QUOTA_RESERVATION_NOT_FOUND"
  | "QUOTA_RESERVATION_EXPIRED"
  | "QUOTA_RESERVATION_ALREADY_CONSUMED"
  | "QUOTA_RESERVATION_CONFLICT"
  | "TRUSTED_SIZE_EXCEEDS_RESERVED_SIZE"
  | "UPLOAD_REJECTED_BY_QUOTA"
  | "QUOTA_ACCOUNTING_CONFLICT"
  | "QUOTA_RECONCILIATION_REQUIRED"
  | "PROJECT_NOT_FOUND"
  | "IMAGE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_REQUEST";

export class QuotaDomainError extends Error {
  readonly code: SafeQuotaErrorCode;

  constructor(code: SafeQuotaErrorCode, message?: string) {
    super(message ?? code);
    this.name = "QuotaDomainError";
    this.code = code;
  }
}

export function isQuotaErrorCode(code: string): code is SafeQuotaErrorCode {
  return (
    code === "PROJECT_IMAGE_LIMIT_REACHED" ||
    code === "PROJECT_STORAGE_LIMIT_REACHED" ||
    code === "FILE_SIZE_LIMIT_EXCEEDED" ||
    code === "UPLOAD_BATCH_LIMIT_EXCEEDED" ||
    code === "INSUFFICIENT_STORAGE_FOR_REPLACEMENT" ||
    code === "QUOTA_RESERVATION_NOT_FOUND" ||
    code === "QUOTA_RESERVATION_EXPIRED" ||
    code === "QUOTA_RESERVATION_ALREADY_CONSUMED" ||
    code === "QUOTA_RESERVATION_CONFLICT" ||
    code === "TRUSTED_SIZE_EXCEEDS_RESERVED_SIZE" ||
    code === "UPLOAD_REJECTED_BY_QUOTA" ||
    code === "QUOTA_ACCOUNTING_CONFLICT" ||
    code === "QUOTA_RECONCILIATION_REQUIRED" ||
    code === "PROJECT_NOT_FOUND" ||
    code === "IMAGE_NOT_FOUND" ||
    code === "UNAUTHORIZED" ||
    code === "INVALID_REQUEST"
  );
}
