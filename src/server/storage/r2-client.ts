import {S3Client} from "@aws-sdk/client-s3";
import {getServerEnv, isR2Configured} from "@/lib/env";
import {StorageDomainError} from "@/server/storage/errors";
import {StorageNotConfiguredError} from "@/server/storage/provider";

export type R2ClientConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;
let cachedEndpoint: string | null = null;

export function getR2ClientConfig(env = getServerEnv()): R2ClientConfig {
  if (!isR2Configured(env)) {
    throw new StorageNotConfiguredError();
  }
  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    endpoint: env.R2_ENDPOINT.replace(/\/$/, ""),
  };
}

export function getR2Client(config = getR2ClientConfig()): S3Client {
  if (cachedClient && cachedEndpoint === config.endpoint) {
    return cachedClient;
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedEndpoint = config.endpoint;
  return cachedClient;
}

export function mapR2SdkError(error: unknown): StorageDomainError {
  console.error("[r2] storage operation failed");
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  if (name === "NotFound" || name === "NoSuchKey") {
    return new StorageDomainError("OBJECT_NOT_FOUND");
  }
  return new StorageDomainError("STORAGE_UNAVAILABLE");
}

/** Test helper */
export function __resetR2ClientForTests(): void {
  cachedClient = null;
  cachedEndpoint = null;
}
