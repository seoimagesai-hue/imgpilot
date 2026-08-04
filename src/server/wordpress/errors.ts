/**
 * Prompt 26 — WordPress integration error taxonomy.
 * Codes are safe to surface to the UI; never leak WordPress response bodies,
 * credentials, or internal stack traces.
 */
export type WordPressErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "PROJECT_NOT_FOUND"
  | "IMAGE_NOT_FOUND"
  | "IMAGE_NOT_ELIGIBLE"
  | "DERIVATIVE_NOT_FOUND"
  | "DERIVATIVE_NOT_ACTIVE"
  | "APPROVED_METADATA_NOT_FOUND"
  | "APPROVED_METADATA_STALE"
  | "CONNECTION_NOT_FOUND"
  | "CONNECTION_LIMIT_REACHED"
  | "CONNECTION_NOT_ACTIVE"
  | "CONNECTION_DISABLED"
  | "CONNECTION_DISCONNECTED"
  | "WORDPRESS_NOT_ENABLED"
  | "WORDPRESS_PUBLISH_LIMIT_REACHED"
  | "WORDPRESS_BULK_SIZE_EXCEEDED"
  | "WORDPRESS_URL_UNSAFE"
  | "WORDPRESS_URL_UNREACHABLE"
  | "WORDPRESS_REST_UNAVAILABLE"
  | "WORDPRESS_AUTHENTICATION_FAILED"
  | "WORDPRESS_PERMISSION_DENIED"
  | "WORDPRESS_MEDIA_ENDPOINT_UNAVAILABLE"
  | "WORDPRESS_UPLOAD_FAILED"
  | "WORDPRESS_METADATA_UPDATE_FAILED"
  | "WORDPRESS_VERIFY_FAILED"
  | "WORDPRESS_RESPONSE_TOO_LARGE"
  | "WORDPRESS_RESPONSE_UNPARSEABLE"
  | "WORDPRESS_TIMEOUT"
  | "WORDPRESS_NETWORK_ERROR"
  | "SUBSCRIPTION_RESTRICTED"
  | "JOB_NOT_FOUND"
  | "JOB_CONFLICT"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_OBJECT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class WordPressError extends Error {
  readonly code: WordPressErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: WordPressErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = "WordPressError";
    this.code = code;
    this.details = details;
  }
}

/** Failure codes that should never be retried automatically. */
export const NON_RETRYABLE_WORDPRESS_FAILURE_CODES = new Set<WordPressErrorCode>([
  "IMAGE_NOT_ELIGIBLE",
  "DERIVATIVE_NOT_FOUND",
  "DERIVATIVE_NOT_ACTIVE",
  "APPROVED_METADATA_NOT_FOUND",
  "APPROVED_METADATA_STALE",
  "CONNECTION_NOT_FOUND",
  "CONNECTION_DISABLED",
  "CONNECTION_DISCONNECTED",
  "WORDPRESS_NOT_ENABLED",
  "WORDPRESS_PUBLISH_LIMIT_REACHED",
  "WORDPRESS_URL_UNSAFE",
  "WORDPRESS_AUTHENTICATION_FAILED",
  "WORDPRESS_PERMISSION_DENIED",
  "WORDPRESS_RESPONSE_TOO_LARGE",
  "SUBSCRIPTION_RESTRICTED",
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_OBJECT_UNAVAILABLE",
  "INVALID_REQUEST",
]);

export function isRetryableWordPressFailure(code: string): boolean {
  return !NON_RETRYABLE_WORDPRESS_FAILURE_CODES.has(code as WordPressErrorCode);
}

export function httpStatusForWordPressError(code: WordPressErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
    case "WORDPRESS_NOT_ENABLED":
    case "SUBSCRIPTION_RESTRICTED":
      return 403;
    case "PROJECT_NOT_FOUND":
    case "IMAGE_NOT_FOUND":
    case "DERIVATIVE_NOT_FOUND":
    case "APPROVED_METADATA_NOT_FOUND":
    case "CONNECTION_NOT_FOUND":
    case "JOB_NOT_FOUND":
      return 404;
    case "JOB_CONFLICT":
      return 409;
    case "INVALID_REQUEST":
    case "IMAGE_NOT_ELIGIBLE":
    case "DERIVATIVE_NOT_ACTIVE":
    case "APPROVED_METADATA_STALE":
    case "CONNECTION_LIMIT_REACHED":
    case "CONNECTION_NOT_ACTIVE":
    case "CONNECTION_DISABLED":
    case "CONNECTION_DISCONNECTED":
    case "WORDPRESS_PUBLISH_LIMIT_REACHED":
    case "WORDPRESS_BULK_SIZE_EXCEEDED":
    case "WORDPRESS_URL_UNSAFE":
    case "WORDPRESS_URL_UNREACHABLE":
      return 422;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
