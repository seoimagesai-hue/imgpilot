/**
 * Prompt 25 — shared HTTP envelope helpers for the public API.
 * Framework-agnostic (Web Request/Response) so it works from Next.js route handlers.
 */
import {ApiError, httpStatusForApiError, type ApiErrorCode} from "@/server/api/errors";

export function newRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId: string;
};

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
};

export function successJson<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
  requestId: string = newRequestId(),
): Response {
  const body: ApiSuccessBody<T> = {ok: true, data, requestId, ...(meta ? {meta} : {})};
  return Response.json(body, {
    status,
    headers: {"X-Request-Id": requestId},
  });
}

export function errorJson(
  error: ApiError | ApiErrorCode,
  requestId: string = newRequestId(),
  status?: number,
): Response {
  const apiError = error instanceof ApiError ? error : new ApiError(error);
  const body: ApiErrorBody = {
    ok: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? {details: apiError.details} : {}),
    },
    requestId,
  };
  return Response.json(body, {
    status: status ?? httpStatusForApiError(apiError.code),
    headers: {"X-Request-Id": requestId},
  });
}

const BEARER_RE = /^Bearer\s+(\S+)$/i;

/**
 * Parse `Authorization: Bearer <key>`. API keys must never be accepted via
 * query string — callers should reject requests carrying key-like query params.
 */
export function parseBearerAuthorization(
  header: string | null | undefined,
): {ok: true; token: string} | {ok: false} {
  if (!header) return {ok: false};
  const match = BEARER_RE.exec(header.trim());
  if (!match) return {ok: false};
  const token = match[1]?.trim();
  if (!token) return {ok: false};
  return {ok: true, token};
}

const DISALLOWED_QUERY_KEY_PATTERNS = [
  /^api[_-]?key$/i,
  /^apikey$/i,
  /^key$/i,
  /^token$/i,
  /^access[_-]?token$/i,
  /^secret$/i,
  /^bearer$/i,
];

/**
 * Defense-in-depth: API keys/secrets must never travel in the query string
 * (logged in access logs, proxies, browser history). Throws if detected.
 */
export function assertNoApiKeyInQueryString(url: URL | string): void {
  const parsed = typeof url === "string" ? new URL(url) : url;
  for (const key of parsed.searchParams.keys()) {
    if (DISALLOWED_QUERY_KEY_PATTERNS.some((re) => re.test(key))) {
      throw new ApiError(
        "INVALID_REQUEST",
        "API keys must be sent via the Authorization header, never as a query parameter.",
      );
    }
  }
}

const IDEMPOTENCY_HEADER = "Idempotency-Key";
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_.:-]{8,128}$/;

/**
 * Writes (POST/PUT/PATCH/DELETE with side effects) must carry a caller-supplied
 * idempotency key so retried requests are safe.
 */
export function requireIdempotencyKey(request: Request): string {
  const raw = request.headers.get(IDEMPOTENCY_HEADER);
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new ApiError(
      "IDEMPOTENCY_KEY_REQUIRED",
      `${IDEMPOTENCY_HEADER} header is required for this request.`,
    );
  }
  if (!IDEMPOTENCY_KEY_RE.test(trimmed)) {
    throw new ApiError(
      "INVALID_REQUEST",
      `${IDEMPOTENCY_HEADER} must be 8-128 chars of letters, numbers, '_', '.', ':' or '-'.`,
    );
  }
  return trimmed;
}
