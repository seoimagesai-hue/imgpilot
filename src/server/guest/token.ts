import {createHmac, randomBytes, timingSafeEqual} from "node:crypto";
import {requireAuthSecret} from "@/lib/env";

/** Generate a high-entropy raw guest token (never store this value). */
export function generateGuestRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashGuestToken(rawToken: string, secret = requireAuthSecret()): string {
  return createHmac("sha256", secret).update(rawToken, "utf8").digest("hex");
}

export function verifyGuestTokenHash(
  rawToken: string,
  expectedHash: string,
  secret = requireAuthSecret(),
): boolean {
  const actual = hashGuestToken(rawToken, secret);
  const a = Buffer.from(actual, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
