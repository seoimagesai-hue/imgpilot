/**
 * Prompt 32 — collaboration policy (plain-text comments, safe activity metadata).
 */

export const COMMENT_BODY_MAX = 4000;
export const ACTIVITY_FEED_LIMIT_DEFAULT = 50;
export const ACTIVITY_FEED_LIMIT_MAX = 100;
export const ACTIVITY_PAGE_LIMIT = ACTIVITY_FEED_LIMIT_DEFAULT;
export const COMMENTS_PAGE_LIMIT = 100;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG = /<[^>]*>/g;
const WHITESPACE_RUN = /\s+/g;

/** Plain text only: trim, strip control chars and HTML tags, collapse whitespace, length bound. */
export function sanitizeCommentBody(raw: string): string {
  const stripped = raw.replace(CONTROL_CHARS, "").replace(HTML_TAG, "").replace(WHITESPACE_RUN, " ").trim();
  if (stripped.length <= COMMENT_BODY_MAX) return stripped;
  return stripped.slice(0, COMMENT_BODY_MAX);
}

const MENTION_EMAIL = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

/** Extract unique @email mention tokens from a comment body (lowercase email). */
export function extractMentionTokens(body: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of body.matchAll(MENTION_EMAIL)) {
    const email = match[1]?.toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export function clampActivityPageLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit)) return ACTIVITY_FEED_LIMIT_DEFAULT;
  const n = Math.floor(limit);
  if (n < 1) return 1;
  if (n > ACTIVITY_FEED_LIMIT_MAX) return ACTIVITY_FEED_LIMIT_MAX;
  return n;
}

/** @deprecated Use clampActivityPageLimit */
export const clampActivityFeedLimit = clampActivityPageLimit;

export function clampCommentsPageLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit)) return COMMENTS_PAGE_LIMIT;
  const n = Math.floor(limit);
  if (n < 1) return 1;
  if (n > COMMENTS_PAGE_LIMIT) return COMMENTS_PAGE_LIMIT;
  return n;
}

export const COMMENT_SUBJECT_TYPES = [
  "project",
  "image",
  "metadata_generation",
  "ai_metadata_batch",
  "ai_metadata_batch_item",
] as const;

export type CommentSubjectTypeLiteral = (typeof COMMENT_SUBJECT_TYPES)[number];

export function isCommentSubjectType(value: string): value is CommentSubjectTypeLiteral {
  return (COMMENT_SUBJECT_TYPES as readonly string[]).includes(value);
}
