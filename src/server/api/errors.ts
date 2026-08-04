/**
 * Prompt 25 — public API error taxonomy.
 * Codes are safe to return to external API callers; never leak internal detail.
 */
export type ApiErrorCode =
  | "API_KEY_MISSING"
  | "API_KEY_INVALID"
  | "API_KEY_REVOKED"
  | "API_KEY_EXPIRED"
  | "API_KEY_SUSPENDED"
  | "API_KEY_SCOPE_INSUFFICIENT"
  | "API_KEY_LIMIT_REACHED"
  | "API_ACCESS_NOT_ENABLED"
  | "API_WORKSPACE_INACTIVE"
  | "API_RATE_LIMITED"
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_CONFLICT"
  | "RESOURCE_GONE"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY"
  | "IDEMPOTENCY_IN_PROGRESS"
  | "INVALID_REQUEST"
  | "INVALID_CURSOR"
  | "INVALID_SCOPE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "WEBHOOK_ENDPOINT_NOT_FOUND"
  | "WEBHOOK_ENDPOINT_LIMIT_REACHED"
  | "WEBHOOK_URL_UNSAFE"
  | "WEBHOOK_URL_UNREACHABLE"
  | "WEBHOOK_NOT_VERIFIED"
  | "WEBHOOKS_NOT_ENABLED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export function httpStatusForApiError(code: ApiErrorCode): number {
  switch (code) {
    case "API_KEY_MISSING":
    case "UNAUTHORIZED":
      return 401;
    case "API_KEY_INVALID":
    case "API_KEY_REVOKED":
    case "API_KEY_EXPIRED":
    case "API_KEY_SUSPENDED":
      return 401;
    case "API_KEY_SCOPE_INSUFFICIENT":
    case "FORBIDDEN":
    case "API_ACCESS_NOT_ENABLED":
    case "WEBHOOKS_NOT_ENABLED":
    case "API_WORKSPACE_INACTIVE":
      return 403;
    case "RESOURCE_NOT_FOUND":
    case "WEBHOOK_ENDPOINT_NOT_FOUND":
      return 404;
    case "RESOURCE_CONFLICT":
    case "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY":
    case "IDEMPOTENCY_IN_PROGRESS":
      return 409;
    case "RESOURCE_GONE":
      return 410;
    case "INVALID_REQUEST":
    case "INVALID_CURSOR":
    case "INVALID_SCOPE":
    case "IDEMPOTENCY_KEY_REQUIRED":
    case "WEBHOOK_URL_UNSAFE":
    case "WEBHOOK_URL_UNREACHABLE":
    case "WEBHOOK_NOT_VERIFIED":
    case "API_KEY_LIMIT_REACHED":
    case "WEBHOOK_ENDPOINT_LIMIT_REACHED":
      return 422;
    case "API_RATE_LIMITED":
      return 429;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
