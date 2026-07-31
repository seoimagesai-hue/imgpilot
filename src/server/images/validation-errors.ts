/**
 * Safe validation failure codes — never expose Sharp/R2 internals to clients.
 */

export type SafeValidationErrorCode =
  | "OBJECT_NOT_FOUND"
  | "OBJECT_TOO_LARGE"
  | "OBJECT_SIZE_MISMATCH"
  | "OBJECT_READ_FAILED"
  | "EMPTY_OBJECT"
  | "UNSUPPORTED_FORMAT"
  | "MIME_MISMATCH"
  | "EXTENSION_MISMATCH"
  | "INVALID_IMAGE"
  | "CORRUPT_IMAGE"
  | "DIMENSIONS_MISSING"
  | "WIDTH_LIMIT_EXCEEDED"
  | "HEIGHT_LIMIT_EXCEEDED"
  | "PIXEL_LIMIT_EXCEEDED"
  | "FRAME_LIMIT_EXCEEDED"
  | "ANIMATED_PIXEL_LIMIT_EXCEEDED"
  | "UNSUPPORTED_ANIMATION"
  | "DECODE_FAILED"
  | "VALIDATION_TIMEOUT"
  | "VALIDATION_UNAVAILABLE"
  | "VALIDATION_CONFLICT"
  | "VALIDATION_RETRY_LIMIT"
  | "VALIDATION_COOLDOWN"
  | "IMAGE_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "STORAGE_NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "UPLOAD_NOT_READY";

export class ValidationDomainError extends Error {
  readonly code: SafeValidationErrorCode;

  constructor(code: SafeValidationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ValidationDomainError";
    this.code = code;
  }
}
