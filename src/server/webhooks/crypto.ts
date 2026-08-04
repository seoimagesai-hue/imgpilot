/**
 * Prompt 25 — webhook secret encryption at rest + outbound payload signing.
 * Encryption key is derived from AUTH_SECRET (sha256), never stored separately.
 * Decrypted secrets must never be logged.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import {requireAuthSecret} from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function deriveEncryptionKey(): Buffer {
  return createHash("sha256").update(requireAuthSecret(), "utf8").digest();
}

export type EncryptedSecret = {
  ciphertext: string;
  nonce: string;
};

/** AES-256-GCM encrypt a webhook secret for storage (ciphertext includes the auth tag). */
export function encryptSecret(plaintext: string): EncryptedSecret {
  const key = deriveEncryptionKey();
  const nonce = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64url"),
    nonce: nonce.toString("base64url"),
  };
}

/** Reverses `encryptSecret`. Throws if the ciphertext/nonce/key do not match (tampered or wrong key). */
export function decryptSecret(ciphertext: string, nonce: string): string {
  const key = deriveEncryptionKey();
  const combined = Buffer.from(ciphertext, "base64url");
  if (combined.length <= AUTH_TAG_BYTES) {
    throw new Error("Webhook secret ciphertext is malformed.");
  }
  const authTag = combined.subarray(combined.length - AUTH_TAG_BYTES);
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(nonce, "base64url"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Generate a new outbound webhook signing secret shown once to the caller. */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("base64url")}`;
}

/**
 * Stripe-style signature: `v1=<hex hmac>` over `${timestamp}.${rawBody}`.
 * Receivers should recompute using the same secret + timestamp + raw body
 * and compare with a constant-time check, and reject stale timestamps.
 */
export function signWebhookPayload(
  secret: string,
  timestamp: number | string,
  rawBody: string,
): string {
  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `v1=${digest}`;
}
