/**
 * Prompt 27 — Shopify integration error taxonomy.
 * Codes are safe to surface to the UI; never leak Shopify response bodies,
 * access tokens, or internal stack traces.
 */
export type ShopifyErrorCode =
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
  | "SHOPIFY_NOT_ENABLED"
  | "SHOPIFY_PUBLISH_LIMIT_REACHED"
  | "SHOPIFY_BULK_SIZE_EXCEEDED"
  | "SHOPIFY_SHOP_UNSAFE"
  | "SHOPIFY_SHOP_UNREACHABLE"
  | "SHOPIFY_PRODUCT_NOT_FOUND"
  | "SHOPIFY_REST_UNAVAILABLE"
  | "SHOPIFY_AUTHENTICATION_FAILED"
  | "SHOPIFY_PERMISSION_DENIED"
  | "SHOPIFY_UPLOAD_FAILED"
  | "SHOPIFY_METADATA_UPDATE_FAILED"
  | "SHOPIFY_VERIFY_FAILED"
  | "SHOPIFY_RESPONSE_TOO_LARGE"
  | "SHOPIFY_RESPONSE_UNPARSEABLE"
  | "SHOPIFY_TIMEOUT"
  | "SHOPIFY_NETWORK_ERROR"
  | "SUBSCRIPTION_RESTRICTED"
  | "JOB_NOT_FOUND"
  | "JOB_CONFLICT"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_OBJECT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ShopifyError extends Error {
  readonly code: ShopifyErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ShopifyErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = "ShopifyError";
    this.code = code;
    this.details = details;
  }
}

/** Failure codes that should never be retried automatically. */
export const NON_RETRYABLE_SHOPIFY_FAILURE_CODES = new Set<ShopifyErrorCode>([
  "IMAGE_NOT_ELIGIBLE",
  "DERIVATIVE_NOT_FOUND",
  "DERIVATIVE_NOT_ACTIVE",
  "APPROVED_METADATA_NOT_FOUND",
  "APPROVED_METADATA_STALE",
  "CONNECTION_NOT_FOUND",
  "CONNECTION_DISABLED",
  "CONNECTION_DISCONNECTED",
  "SHOPIFY_NOT_ENABLED",
  "SHOPIFY_PUBLISH_LIMIT_REACHED",
  "SHOPIFY_SHOP_UNSAFE",
  "SHOPIFY_PRODUCT_NOT_FOUND",
  "SHOPIFY_AUTHENTICATION_FAILED",
  "SHOPIFY_PERMISSION_DENIED",
  "SHOPIFY_RESPONSE_TOO_LARGE",
  "SUBSCRIPTION_RESTRICTED",
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_OBJECT_UNAVAILABLE",
  "INVALID_REQUEST",
]);

export function isRetryableShopifyFailure(code: string): boolean {
  return !NON_RETRYABLE_SHOPIFY_FAILURE_CODES.has(code as ShopifyErrorCode);
}

export function httpStatusForShopifyError(code: ShopifyErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
    case "SHOPIFY_NOT_ENABLED":
    case "SUBSCRIPTION_RESTRICTED":
      return 403;
    case "PROJECT_NOT_FOUND":
    case "IMAGE_NOT_FOUND":
    case "DERIVATIVE_NOT_FOUND":
    case "APPROVED_METADATA_NOT_FOUND":
    case "CONNECTION_NOT_FOUND":
    case "SHOPIFY_PRODUCT_NOT_FOUND":
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
    case "SHOPIFY_PUBLISH_LIMIT_REACHED":
    case "SHOPIFY_BULK_SIZE_EXCEEDED":
    case "SHOPIFY_SHOP_UNSAFE":
    case "SHOPIFY_SHOP_UNREACHABLE":
      return 422;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
