import {z} from "zod";

export const R2_TTL_MIN_SECONDS = 60;
export const R2_TTL_MAX_SECONDS = 900;
export const R2_TTL_DEFAULT_SECONDS = 300;

export const UPLOAD_CONCURRENCY = 4;

export type SafeUploadErrorCode =
  | "STORAGE_NOT_CONFIGURED"
  | "INVALID_UPLOAD_REQUEST"
  | "PROJECT_NOT_FOUND"
  | "IMAGE_NOT_FOUND"
  | "UPLOAD_EXPIRED"
  | "UPLOAD_NOT_PENDING"
  | "OBJECT_NOT_FOUND"
  | "OBJECT_SIZE_MISMATCH"
  | "OBJECT_TYPE_MISMATCH"
  | "OBJECT_TOO_LARGE"
  | "STORAGE_UNAVAILABLE"
  | "UPLOAD_CANCELLED"
  | "UPLOAD_FAILED"
  | "CONFIRMATION_FAILED"
  | "UNAUTHORIZED"
  | "PROJECT_IMAGE_LIMIT_REACHED"
  | "PROJECT_STORAGE_LIMIT_REACHED"
  | "FILE_SIZE_LIMIT_EXCEEDED"
  | "UPLOAD_BATCH_LIMIT_EXCEEDED"
  | "UPLOAD_REJECTED_BY_QUOTA";

export class StorageDomainError extends Error {
  readonly code: SafeUploadErrorCode;

  constructor(code: SafeUploadErrorCode, message?: string) {
    super(message ?? code);
    this.name = "StorageDomainError";
    this.code = code;
  }
}

export function parseSignedUrlTtlSeconds(raw: string | undefined, fallback = R2_TTL_DEFAULT_SECONDS): number {
  if (!raw || !raw.trim()) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) {
    throw new StorageDomainError("INVALID_UPLOAD_REQUEST", "Invalid R2_SIGNED_URL_TTL_SECONDS");
  }
  if (value < R2_TTL_MIN_SECONDS) {
    throw new StorageDomainError("INVALID_UPLOAD_REQUEST", "R2_SIGNED_URL_TTL_SECONDS below minimum");
  }
  if (value > R2_TTL_MAX_SECONDS) {
    throw new StorageDomainError("INVALID_UPLOAD_REQUEST", "R2_SIGNED_URL_TTL_SECONDS above maximum");
  }
  return value;
}

export function countSetR2Fields(env: {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ENDPOINT: string;
}): number {
  return [
    env.R2_ACCOUNT_ID,
    env.R2_ACCESS_KEY_ID,
    env.R2_SECRET_ACCESS_KEY,
    env.R2_BUCKET_NAME,
    env.R2_ENDPOINT,
  ].filter((value) => Boolean(value)).length;
}

export function assertCompleteOrEmptyR2Config(env: {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ENDPOINT: string;
}): void {
  const count = countSetR2Fields(env);
  if (count !== 0 && count !== 5) {
    throw new Error(
      "Partial R2 configuration is not allowed. Set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT, or leave all empty.",
    );
  }
}

export const authorizeFileDescriptorSchema = z.object({
  clientId: z.string().trim().min(1).max(128),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  sizeBytes: z.number().int(),
});

export const authorizeUploadBodySchema = z.object({
  files: z.array(authorizeFileDescriptorSchema).min(1).max(500),
});

export const r2EndpointSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "R2_ENDPOINT must be https")
  .refine((value) => !value.includes(" "), "R2_ENDPOINT invalid");
