import type {GuestSession} from "@/db/schema";

/** Fields safe to expose in admin guest session lists. */
export type ScrubbedGuestSession = {
  id: string;
  publicId: string;
  cohort: string;
  locale: string;
  toolCode: string;
  operationsUsed: number;
  createdAt: Date;
  expiresAt: Date;
  scrubbedAt: Date | null;
  expired: boolean;
};

const SECRET_PATTERNS = [
  /sk_(live|test)_/i,
  /whsec_/i,
  /https?:\/\/[^\s]*[?&]X-Amz-/i,
  /token_hash/i,
  /password/i,
  /storage_key/i,
  /signed/i,
] as const;

export function containsLikelySecret(value: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(value));
}

/** Reject audit summaries that look like they contain secrets or storage keys. */
export function assertSafeAuditText(value: string | undefined | null, field: string): void {
  if (value == null || value === "") return;
  if (containsLikelySecret(value)) {
    throw new Error(`Unsafe ${field} for admin audit log`);
  }
}

export function scrubGuestSessionRow(
  row: Pick<
    GuestSession,
    | "id"
    | "publicId"
    | "cohort"
    | "locale"
    | "toolCode"
    | "operationsUsed"
    | "createdAt"
    | "expiresAt"
    | "scrubbedAt"
  >,
  now = new Date(),
): ScrubbedGuestSession {
  return {
    id: row.id,
    publicId: row.publicId,
    cohort: row.cohort,
    locale: row.locale,
    toolCode: row.toolCode,
    operationsUsed: row.operationsUsed,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    scrubbedAt: row.scrubbedAt,
    expired: row.expiresAt.getTime() <= now.getTime(),
  };
}

export function redactStorageKeyHint(key: string | null | undefined): string | null {
  if (!key) return null;
  const parts = key.split("/");
  const tail = parts[parts.length - 1] ?? key;
  if (tail.length <= 8) return "[redacted]";
  return `[redacted]…${tail.slice(-6)}`;
}
