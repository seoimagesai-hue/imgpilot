/**
 * Prompt 26 — WordPress credential encryption at rest.
 * Reuses the webhooks AES-256-GCM primitive, but derives the key from
 * `INTEGRATION_ENCRYPTION_KEY` when configured (falls back to the
 * AUTH_SECRET-derived key otherwise, matching `webhooks/crypto.ts`).
 * Decrypted usernames/passwords must never be logged.
 */
import {createCipheriv, createDecipheriv, createHash, randomBytes} from "node:crypto";
import {getIntegrationEncryptionKeyMaterial} from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function deriveEncryptionKey(): Buffer {
  const material = getIntegrationEncryptionKeyMaterial();
  if (material.source === "integration_key") {
    // Accept either a raw base64 key or arbitrary secret text; hash to 32 bytes either way.
    return createHash("sha256").update(material.value, "utf8").digest();
  }
  return createHash("sha256").update(material.value, "utf8").digest();
}

export type EncryptedField = {
  ciphertext: string;
  nonce: string;
};

/** AES-256-GCM encrypt a WordPress credential field for storage (ciphertext includes the auth tag). */
export function encryptCredential(plaintext: string): EncryptedField {
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

/** Reverses `encryptCredential`. Throws if the ciphertext/nonce/key do not match (tampered or wrong key). */
export function decryptCredential(ciphertext: string, nonce: string): string {
  const key = deriveEncryptionKey();
  const combined = Buffer.from(ciphertext, "base64url");
  if (combined.length <= AUTH_TAG_BYTES) {
    throw new Error("WordPress credential ciphertext is malformed.");
  }
  const authTag = combined.subarray(combined.length - AUTH_TAG_BYTES);
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(nonce, "base64url"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export type EncryptedCredentialPair = {
  username: EncryptedField;
  applicationPassword: EncryptedField;
};

export function encryptCredentialPair(username: string, applicationPassword: string): EncryptedCredentialPair {
  return {
    username: encryptCredential(username),
    applicationPassword: encryptCredential(applicationPassword),
  };
}
