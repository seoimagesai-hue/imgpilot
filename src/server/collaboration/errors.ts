/**
 * Prompt 32 — safe collaboration error codes.
 */
export type CollaborationErrorCode =
  | "COLLABORATION_PERMISSION_DENIED"
  | "PROJECT_NOT_FOUND"
  | "THREAD_NOT_FOUND"
  | "COMMENT_NOT_FOUND"
  | "COMMENT_BODY_INVALID"
  | "COMMENT_BODY_TOO_LONG"
  | "SUBJECT_INVALID"
  | "THREAD_ALREADY_RESOLVED"
  | "THREAD_NOT_RESOLVED"
  | "INVALID_REQUEST";

export class CollaborationError extends Error {
  readonly code: CollaborationErrorCode;
  constructor(code: CollaborationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CollaborationError";
    this.code = code;
  }
}

export function httpStatusForCollaborationError(code: CollaborationErrorCode): number {
  switch (code) {
    case "PROJECT_NOT_FOUND":
    case "THREAD_NOT_FOUND":
    case "COMMENT_NOT_FOUND":
      return 404;
    case "COLLABORATION_PERMISSION_DENIED":
      return 403;
    case "COMMENT_BODY_INVALID":
    case "COMMENT_BODY_TOO_LONG":
    case "SUBJECT_INVALID":
    case "THREAD_ALREADY_RESOLVED":
    case "THREAD_NOT_RESOLVED":
    case "INVALID_REQUEST":
      return 400;
  }
}
