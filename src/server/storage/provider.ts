/**
 * Server-only object storage contract.
 * Implementations: DisabledObjectStorageProvider | R2ObjectStorageProvider
 * Never fall back to local disk or PostgreSQL blobs.
 */

import {isR2Configured} from "@/lib/env";

export type StorageProviderName = "r2";

export class StorageNotConfiguredError extends Error {
  readonly code = "STORAGE_NOT_CONFIGURED" as const;

  constructor(message = "Object storage is not configured") {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

export type CreateUploadTargetInput = {
  projectId: string;
  userId: string;
  imageId: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  /** Trusted server-generated key — never accept from the browser. */
  storageKey: string;
};

export type CreateUploadTargetResult = {
  provider: StorageProviderName;
  storageKey: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: Date;
};

export type ObjectMetadata = {
  storageKey: string;
  sizeBytes: number;
  contentType?: string;
  etag?: string;
};

export type SignedReadUrlResult = {
  url: string;
  expiresAt: Date;
};

export type ObjectBytesResult = {
  storageKey: string;
  body: Buffer;
  sizeBytes: number;
  contentType?: string;
  etag?: string;
};

export interface ObjectStorageProvider {
  readonly name: StorageProviderName;
  createUploadTarget(input: CreateUploadTargetInput): Promise<CreateUploadTargetResult>;
  confirmUpload(storageKey: string): Promise<ObjectMetadata>;
  objectExists(storageKey: string): Promise<boolean>;
  readObjectMetadata(storageKey: string): Promise<ObjectMetadata | null>;
  /** Server-only GetObject with hard maxBytes cap. Never accept browser keys. */
  getObjectBuffer(storageKey: string, maxBytes: number): Promise<ObjectBytesResult>;
  deleteObject(storageKey: string): Promise<void>;
  createSignedReadUrl(storageKey: string, ttlSeconds: number): Promise<SignedReadUrlResult>;
}

export class DisabledObjectStorageProvider implements ObjectStorageProvider {
  readonly name = "r2" as const;

  async createUploadTarget(input: CreateUploadTargetInput): Promise<CreateUploadTargetResult> {
    void input;
    throw new StorageNotConfiguredError();
  }

  async confirmUpload(storageKey: string): Promise<ObjectMetadata> {
    void storageKey;
    throw new StorageNotConfiguredError();
  }

  async objectExists(storageKey: string): Promise<boolean> {
    void storageKey;
    throw new StorageNotConfiguredError();
  }

  async readObjectMetadata(storageKey: string): Promise<ObjectMetadata | null> {
    void storageKey;
    throw new StorageNotConfiguredError();
  }

  async getObjectBuffer(storageKey: string, maxBytes: number): Promise<ObjectBytesResult> {
    void storageKey;
    void maxBytes;
    throw new StorageNotConfiguredError();
  }

  async deleteObject(storageKey: string): Promise<void> {
    void storageKey;
    throw new StorageNotConfiguredError();
  }

  async createSignedReadUrl(storageKey: string, ttlSeconds: number): Promise<SignedReadUrlResult> {
    void storageKey;
    void ttlSeconds;
    throw new StorageNotConfiguredError();
  }
}

let cachedProvider: ObjectStorageProvider | null = null;

export async function getObjectStorageProvider(): Promise<ObjectStorageProvider> {
  if (!cachedProvider) {
    if (isR2Configured()) {
      const {R2ObjectStorageProvider} = await import("@/server/storage/r2-provider");
      cachedProvider = new R2ObjectStorageProvider();
    } else {
      cachedProvider = new DisabledObjectStorageProvider();
    }
  }
  return cachedProvider;
}

export function getObjectStorageProviderSync(): ObjectStorageProvider {
  if (!cachedProvider) {
    if (isR2Configured()) {
      throw new Error("Call getObjectStorageProvider() asynchronously when R2 is configured");
    }
    cachedProvider = new DisabledObjectStorageProvider();
  }
  return cachedProvider;
}

export function __resetObjectStorageProviderForTests(): void {
  cachedProvider = null;
}
