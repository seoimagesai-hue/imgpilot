import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {getR2SignedUrlTtlSeconds} from "@/lib/env";
import {StorageDomainError} from "@/server/storage/errors";
import {getR2Client, getR2ClientConfig, mapR2SdkError} from "@/server/storage/r2-client";
import type {
  CreateUploadTargetInput,
  CreateUploadTargetResult,
  ObjectBytesResult,
  ObjectMetadata,
  ObjectStorageProvider,
  SignedReadUrlResult,
} from "@/server/storage/provider";

/**
 * Cloudflare R2 implementation of the storage abstraction.
 * Uses S3-compatible PutObject presigning and HeadObject confirmation.
 */
export class R2ObjectStorageProvider implements ObjectStorageProvider {
  readonly name = "r2" as const;

  async createUploadTarget(input: CreateUploadTargetInput): Promise<CreateUploadTargetResult> {
    const config = getR2ClientConfig();
    const client = getR2Client(config);
    const ttl = getR2SignedUrlTtlSeconds();
    const storageKey = input.storageKey;

    try {
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
        ContentType: input.mimeType,
      });
      const uploadUrl = await getSignedUrl(client, command, {expiresIn: ttl});
      const expiresAt = new Date(Date.now() + ttl * 1000);
      return {
        provider: "r2",
        storageKey,
        uploadUrl,
        headers: {"Content-Type": input.mimeType},
        expiresAt,
      };
    } catch (error) {
      throw mapR2SdkError(error);
    }
  }

  async confirmUpload(storageKey: string): Promise<ObjectMetadata> {
    const meta = await this.readObjectMetadata(storageKey);
    if (!meta) {
      throw new StorageDomainError("OBJECT_NOT_FOUND");
    }
    return meta;
  }

  async objectExists(storageKey: string): Promise<boolean> {
    const meta = await this.readObjectMetadata(storageKey);
    return Boolean(meta);
  }

  async readObjectMetadata(storageKey: string): Promise<ObjectMetadata | null> {
    const config = getR2ClientConfig();
    const client = getR2Client(config);
    try {
      const head = await client.send(
        new HeadObjectCommand({
          Bucket: config.bucketName,
          Key: storageKey,
        }),
      );
      return {
        storageKey,
        sizeBytes: head.ContentLength ?? 0,
        contentType: head.ContentType,
        etag: head.ETag?.replaceAll('"', ""),
      };
    } catch (error) {
      const mapped = mapR2SdkError(error);
      if (mapped.code === "OBJECT_NOT_FOUND") return null;
      // S3 NotFound often comes as 404 metadata
      if (
        error &&
        typeof error === "object" &&
        "$metadata" in error &&
        (error as {$metadata?: {httpStatusCode?: number}}).$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw mapped;
    }
  }

  async getObjectBuffer(storageKey: string, maxBytes: number): Promise<ObjectBytesResult> {
    if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
      throw new StorageDomainError("OBJECT_TOO_LARGE");
    }

    const head = await this.readObjectMetadata(storageKey);
    if (!head) throw new StorageDomainError("OBJECT_NOT_FOUND");
    if (head.sizeBytes <= 0) throw new StorageDomainError("OBJECT_SIZE_MISMATCH");
    if (head.sizeBytes > maxBytes) throw new StorageDomainError("OBJECT_TOO_LARGE");

    const config = getR2ClientConfig();
    const client = getR2Client(config);
    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: storageKey,
        }),
      );
      if (!response.Body) {
        throw new StorageDomainError("OBJECT_NOT_FOUND");
      }

      const bytes = await response.Body.transformToByteArray();
      if (bytes.byteLength > maxBytes) {
        throw new StorageDomainError("OBJECT_TOO_LARGE");
      }
      if (bytes.byteLength !== head.sizeBytes) {
        throw new StorageDomainError("OBJECT_SIZE_MISMATCH");
      }

      return {
        storageKey,
        body: Buffer.from(bytes),
        sizeBytes: bytes.byteLength,
        contentType: response.ContentType ?? head.contentType,
        etag: (response.ETag ?? head.etag)?.replaceAll('"', ""),
      };
    } catch (error) {
      if (error instanceof StorageDomainError) throw error;
      throw mapR2SdkError(error);
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    const config = getR2ClientConfig();
    const client = getR2Client(config);
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: storageKey,
        }),
      );
    } catch (error) {
      throw mapR2SdkError(error);
    }
  }

  async createSignedReadUrl(storageKey: string, ttlSeconds: number): Promise<SignedReadUrlResult> {
    const config = getR2ClientConfig();
    const client = getR2Client(config);
    try {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: storageKey,
        }),
        {expiresIn: ttlSeconds},
      );
      return {url, expiresAt: new Date(Date.now() + ttlSeconds * 1000)};
    } catch (error) {
      throw mapR2SdkError(error);
    }
  }
}
