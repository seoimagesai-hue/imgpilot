/**
 * Prompt 28 — Webflow CMS integration error taxonomy.
 * Codes are safe to surface to the UI; never leak Webflow response bodies,
 * site access tokens, or internal stack traces.
 */
export type WebflowErrorCode =
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
  | "WEBFLOW_NOT_ENABLED"
  | "WEBFLOW_PUBLISH_LIMIT_REACHED"
  | "WEBFLOW_BULK_SIZE_EXCEEDED"
  | "WEBFLOW_SITE_NOT_FOUND"
  | "WEBFLOW_COLLECTION_NOT_FOUND"
  | "WEBFLOW_CMS_ITEM_NOT_FOUND"
  | "FIELD_MAPPING_NOT_FOUND"
  | "FIELD_MAPPING_INVALID"
  | "MAPPING_STALE"
  | "WEBFLOW_AUTHENTICATION_FAILED"
  | "WEBFLOW_PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "ASSET_UPLOAD_FAILED"
  | "ASSET_VERIFY_FAILED"
  | "ASSET_TOO_LARGE"
  | "ASSET_UNSUPPORTED_FORMAT"
  | "CMS_UPDATE_FAILED"
  | "CMS_VERIFY_FAILED"
  | "WEBFLOW_API_UNAVAILABLE"
  | "WEBFLOW_UPLOAD_URL_UNSAFE"
  | "WEBFLOW_RESPONSE_TOO_LARGE"
  | "WEBFLOW_RESPONSE_UNPARSEABLE"
  | "WEBFLOW_TIMEOUT"
  | "WEBFLOW_NETWORK_ERROR"
  | "SUBSCRIPTION_RESTRICTED"
  | "JOB_NOT_FOUND"
  | "JOB_CONFLICT"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_OBJECT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class WebflowError extends Error {
  readonly code: WebflowErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: WebflowErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = "WebflowError";
    this.code = code;
    this.details = details;
  }
}

/** Failure codes that should never be retried automatically. */
export const NON_RETRYABLE_WEBFLOW_FAILURE_CODES = new Set<WebflowErrorCode>([
  "INVALID_REQUEST",
  "IMAGE_NOT_ELIGIBLE",
  "DERIVATIVE_NOT_FOUND",
  "DERIVATIVE_NOT_ACTIVE",
  "APPROVED_METADATA_NOT_FOUND",
  "APPROVED_METADATA_STALE",
  "CONNECTION_NOT_FOUND",
  "CONNECTION_DISABLED",
  "CONNECTION_DISCONNECTED",
  "WEBFLOW_NOT_ENABLED",
  "WEBFLOW_PUBLISH_LIMIT_REACHED",
  "WEBFLOW_SITE_NOT_FOUND",
  "WEBFLOW_COLLECTION_NOT_FOUND",
  "WEBFLOW_CMS_ITEM_NOT_FOUND",
  "FIELD_MAPPING_NOT_FOUND",
  "FIELD_MAPPING_INVALID",
  "MAPPING_STALE",
  "WEBFLOW_AUTHENTICATION_FAILED",
  "WEBFLOW_PERMISSION_DENIED",
  "WEBFLOW_RESPONSE_TOO_LARGE",
  "ASSET_TOO_LARGE",
  "ASSET_UNSUPPORTED_FORMAT",
  "SUBSCRIPTION_RESTRICTED",
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_OBJECT_UNAVAILABLE",
]);

export function isRetryableWebflowFailure(code: string): boolean {
  return !NON_RETRYABLE_WEBFLOW_FAILURE_CODES.has(code as WebflowErrorCode);
}

export function httpStatusForWebflowError(code: WebflowErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
    case "WEBFLOW_NOT_ENABLED":
    case "SUBSCRIPTION_RESTRICTED":
      return 403;
    case "PROJECT_NOT_FOUND":
    case "IMAGE_NOT_FOUND":
    case "DERIVATIVE_NOT_FOUND":
    case "APPROVED_METADATA_NOT_FOUND":
    case "CONNECTION_NOT_FOUND":
    case "WEBFLOW_SITE_NOT_FOUND":
    case "WEBFLOW_COLLECTION_NOT_FOUND":
    case "WEBFLOW_CMS_ITEM_NOT_FOUND":
    case "FIELD_MAPPING_NOT_FOUND":
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
    case "WEBFLOW_PUBLISH_LIMIT_REACHED":
    case "WEBFLOW_BULK_SIZE_EXCEEDED":
    case "FIELD_MAPPING_INVALID":
    case "MAPPING_STALE":
    case "ASSET_TOO_LARGE":
    case "ASSET_UNSUPPORTED_FORMAT":
    case "WEBFLOW_UPLOAD_URL_UNSAFE":
      return 422;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
