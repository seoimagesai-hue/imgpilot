/**
 * Prompt 31 — safe AI metadata batch error codes.
 */
export type SafeAiBatchErrorCode =
  | "AI_BATCH_NOT_FOUND"
  | "AI_BATCH_CONFLICT"
  | "AI_BATCH_EMPTY_SELECTION"
  | "AI_BATCH_TOO_LARGE"
  | "AI_BATCH_ACTIVE_LIMIT"
  | "AI_BATCH_TEMPLATE_INVALID"
  | "AI_BATCH_LANGUAGE_UNSUPPORTED"
  | "AI_BATCH_CANCELLED"
  | "AI_BATCH_USAGE_INSUFFICIENT"
  | "AI_BATCH_ALREADY_TERMINAL"
  | "AI_BATCH_ITEM_NOT_FOUND"
  | "AI_BATCH_REVIEW_CONFIRMATION_REQUIRED"
  | "PROJECT_NOT_FOUND"
  | "STORAGE_NOT_CONFIGURED"
  | "AI_NOT_CONFIGURED"
  | "FEATURE_NOT_INCLUDED"
  | "SUBSCRIPTION_RESTRICTED"
  | "AI_LIMIT_REACHED"
  | "INVALID_REQUEST";

export class AiBatchError extends Error {
  readonly code: SafeAiBatchErrorCode;

  constructor(code: SafeAiBatchErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AiBatchError";
    this.code = code;
  }
}
