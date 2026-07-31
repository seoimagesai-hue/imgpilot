import {beforeEach, describe, expect, it, vi} from "vitest";
import {StorageDomainError} from "@/server/storage/errors";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const replacementId = "33333333-3333-4333-8333-333333333333";
const trustedKey = `users/${userId}/projects/${projectId}/originals/${imageId}/photo.jpg`;
const oldKey = `users/${userId}/projects/${projectId}/originals/${imageId}/old.jpg`;
const newKey = `users/${userId}/projects/${projectId}/originals/${imageId}/r-${replacementId}-new.jpg`;

const mockEnv = vi.hoisted(() => ({
  isR2Configured: vi.fn(() => true),
}));

const mockProjects = vi.hoisted(() => ({
  getOwnedProject: vi.fn(async () => ({id: projectId, userId, name: "Test"})),
}));

const mockDeleteQueries = vi.hoisted(() => ({
  acquireImageDeletion: vi.fn(),
  getOwnedImageForLifecycle: vi.fn(),
  markStorageDeleting: vi.fn(async () => true),
  markDeletionFailed: vi.fn(async () => true),
  markImageDeletedComplete: vi.fn(async () => true),
}));

const mockReplaceQueries = vi.hoisted(() => ({
  hasOpenReplacementForImage: vi.fn(async () => false),
  promoteReplacementInTransaction: vi.fn(),
  getOwnedReplacement: vi.fn(),
  getOwnedImageRow: vi.fn(),
  markOldStorageCleanupFailed: vi.fn(async () => true),
  markOldStorageDeleting: vi.fn(async () => true),
  markReplacementComplete: vi.fn(async () => true),
}));

const mockStorageFns = vi.hoisted(() => ({
  deleteObject: vi.fn(async () => undefined),
  objectExists: vi.fn(async () => false),
}));

const mockStorageProvider = vi.hoisted(() => ({
  name: "r2" as const,
  createUploadTarget: vi.fn(),
  confirmUpload: vi.fn(),
  readObjectMetadata: vi.fn(),
  getObjectBuffer: vi.fn(),
  createSignedReadUrl: vi.fn(),
  deleteObject: mockStorageFns.deleteObject,
  objectExists: mockStorageFns.objectExists,
}));

const mockStorageModule = vi.hoisted(() => ({
  StorageNotConfiguredError: class StorageNotConfiguredError extends Error {
    readonly code = "STORAGE_NOT_CONFIGURED" as const;
    constructor(message = "Object storage is not configured") {
      super(message);
      this.name = "StorageNotConfiguredError";
    }
  },
  getObjectStorageProvider: vi.fn(async () => mockStorageProvider),
}));

vi.mock("@/lib/env", () => ({
  isR2Configured: mockEnv.isR2Configured,
  getR2SignedUrlTtlSeconds: () => 3600,
}));

vi.mock("@/server/projects/queries", () => ({
  getOwnedProject: mockProjects.getOwnedProject,
}));

vi.mock("@/server/images/delete-queries", () => mockDeleteQueries);

vi.mock("@/server/images/replace-queries", () => mockReplaceQueries);

vi.mock("@/server/storage/provider", () => mockStorageModule);

import {deleteOwnedImage, retryDeletionCleanup} from "@/server/images/delete-service";
import {promoteOwnedReplacement, retryOldStorageCleanup, toReplacementClientDto} from "@/server/images/replace-service";

function replacementRow(overrides: Record<string, unknown> = {}) {
  return {
    id: replacementId,
    imageId,
    status: "validated",
    newOriginalFilename: "new.jpg",
    newDeclaredMime: "image/jpeg",
    newDetectedMime: "image/jpeg",
    newDetectedFormat: "jpeg",
    newByteSize: 2048,
    newWidth: 100,
    newHeight: 80,
    newPixelCount: 8000,
    newAnimated: false,
    newFrameCount: 1,
    failureCode: null,
    validatedAt: new Date("2026-01-01T00:00:00.000Z"),
    promotedAt: null,
    newStorageKey: newKey,
    oldStorageKey: oldKey,
    ...overrides,
  };
}

describe("toReplacementClientDto", () => {
  it("never includes storage keys in the public DTO", () => {
    const dto = toReplacementClientDto(replacementRow());
    expect(dto).toMatchObject({
      id: replacementId,
      imageId,
      status: "validated",
      originalFilename: "new.jpg",
      declaredMime: "image/jpeg",
      detectedMime: "image/jpeg",
      byteSize: 2048,
      width: 100,
      height: 80,
      validatedAt: "2026-01-01T00:00:00.000Z",
      promotedAt: null,
    });
    expect(dto).not.toHaveProperty("newStorageKey");
    expect(dto).not.toHaveProperty("oldStorageKey");
    expect(dto).not.toHaveProperty("storageKey");
    expect(Object.keys(dto).some((k) => /storage/i.test(k))).toBe(false);
  });
});

describe("deleteOwnedImage storage cleanup (mocked provider)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.isR2Configured.mockReturnValue(true);
    mockReplaceQueries.hasOpenReplacementForImage.mockResolvedValue(false);
    mockDeleteQueries.markStorageDeleting.mockResolvedValue(true);
    mockStorageFns.deleteObject.mockResolvedValue(undefined);
    mockStorageFns.objectExists.mockResolvedValue(false);
  });

  it("calls deleteObject with the trusted server storage key", async () => {
    mockDeleteQueries.acquireImageDeletion.mockResolvedValue({
      kind: "ready",
      storageKey: trustedKey,
    });

    const result = await deleteOwnedImage({userId, projectId, imageId});

    expect(result).toEqual({ok: true, imageId, status: "deleted"});
    expect(mockStorageFns.deleteObject).toHaveBeenCalledTimes(1);
    expect(mockStorageFns.deleteObject).toHaveBeenCalledWith(trustedKey);
    expect(mockDeleteQueries.markImageDeletedComplete).toHaveBeenCalledWith(imageId, projectId);
  });

  it("treats objectExists false after delete as successful cleanup", async () => {
    mockDeleteQueries.acquireImageDeletion.mockResolvedValue({
      kind: "ready",
      storageKey: trustedKey,
    });
    mockStorageFns.objectExists.mockResolvedValue(false);

    const result = await deleteOwnedImage({userId, projectId, imageId});

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("deleted");
    expect(mockDeleteQueries.markDeletionFailed).not.toHaveBeenCalled();
    expect(mockDeleteQueries.markImageDeletedComplete).toHaveBeenCalled();
  });

  it("marks deletion_failed when object still exists after delete", async () => {
    mockDeleteQueries.acquireImageDeletion.mockResolvedValue({
      kind: "ready",
      storageKey: trustedKey,
    });
    mockStorageFns.objectExists.mockResolvedValue(true);

    const result = await deleteOwnedImage({userId, projectId, imageId});

    expect(result).toEqual({
      ok: true,
      imageId,
      status: "deletion_failed",
      cleanupPending: true,
    });
    expect(mockDeleteQueries.markDeletionFailed).toHaveBeenCalledWith(
      imageId,
      projectId,
      "STORAGE_CLEANUP_FAILED",
    );
  });

  it("treats OBJECT_NOT_FOUND from delete as idempotent success", async () => {
    mockDeleteQueries.acquireImageDeletion.mockResolvedValue({
      kind: "ready",
      storageKey: trustedKey,
    });
    mockStorageFns.deleteObject.mockRejectedValue(new StorageDomainError("OBJECT_NOT_FOUND"));

    const result = await deleteOwnedImage({userId, projectId, imageId});

    expect(result).toEqual({ok: true, imageId, status: "deleted", idempotent: true});
    expect(mockDeleteQueries.markImageDeletedComplete).toHaveBeenCalled();
  });

  it("retryDeletionCleanup reuses trusted key from lifecycle row", async () => {
    mockDeleteQueries.getOwnedImageForLifecycle.mockResolvedValue({
      id: imageId,
      status: "deletion_failed",
      storageKey: trustedKey,
    });

    const result = await retryDeletionCleanup({userId, projectId, imageId});

    expect(result.ok).toBe(true);
    expect(mockStorageFns.deleteObject).toHaveBeenCalledWith(trustedKey);
  });

  it("blocks delete when an open replacement exists", async () => {
    mockReplaceQueries.hasOpenReplacementForImage.mockResolvedValue(true);

    const result = await deleteOwnedImage({userId, projectId, imageId});

    expect(result).toEqual({ok: false, error: "IMAGE_NOT_DELETABLE"});
    expect(mockDeleteQueries.acquireImageDeletion).not.toHaveBeenCalled();
    expect(mockStorageFns.deleteObject).not.toHaveBeenCalled();
  });
});

describe("replacement old-object cleanup (mocked provider)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.isR2Configured.mockReturnValue(true);
    mockStorageFns.deleteObject.mockResolvedValue(undefined);
    mockStorageFns.objectExists.mockResolvedValue(false);
  });

  it("promote deletes old key with trusted keys and completes when object is gone", async () => {
    mockReplaceQueries.promoteReplacementInTransaction.mockResolvedValue({
      ok: true,
      image: {id: imageId, storageKey: newKey},
      replacement: {id: replacementId},
      oldStorageKey: oldKey,
    });

    const result = await promoteOwnedReplacement({userId, projectId, imageId, replacementId});

    expect(result).toEqual({
      ok: true,
      imageId,
      replacementId,
      status: "complete",
    });
    expect(mockStorageFns.deleteObject).toHaveBeenCalledWith(oldKey);
    expect(mockReplaceQueries.markReplacementComplete).toHaveBeenCalledWith(replacementId);
    expect(mockReplaceQueries.markOldStorageCleanupFailed).not.toHaveBeenCalled();
  });

  it("does not delete when old key equals active key (active-key safety)", async () => {
    mockReplaceQueries.promoteReplacementInTransaction.mockResolvedValue({
      ok: true,
      image: {id: imageId, storageKey: oldKey},
      replacement: {id: replacementId},
      oldStorageKey: oldKey,
    });

    const result = await promoteOwnedReplacement({userId, projectId, imageId, replacementId});

    expect(result).toEqual({
      ok: true,
      imageId,
      replacementId,
      status: "old_storage_cleanup_failed",
      cleanupPending: true,
    });
    expect(mockStorageFns.deleteObject).not.toHaveBeenCalled();
    expect(mockReplaceQueries.markOldStorageCleanupFailed).toHaveBeenCalledWith(
      replacementId,
      "STORAGE_CLEANUP_FAILED",
    );
    expect(mockReplaceQueries.markOldStorageDeleting).not.toHaveBeenCalled();
  });

  it("retryOldStorageCleanup rejects when old key still matches active image key", async () => {
    mockReplaceQueries.getOwnedReplacement.mockResolvedValue(
      replacementRow({status: "old_storage_cleanup_failed", oldStorageKey: oldKey}),
    );
    mockReplaceQueries.getOwnedImageRow.mockResolvedValue({
      id: imageId,
      storageKey: oldKey,
    });

    const result = await retryOldStorageCleanup({userId, projectId, imageId, replacementId});

    expect(result).toEqual({ok: false, error: "STORAGE_CLEANUP_FAILED"});
    expect(mockStorageFns.deleteObject).not.toHaveBeenCalled();
  });

  it("retryOldStorageCleanup deletes old key when active key has moved forward", async () => {
    mockReplaceQueries.getOwnedReplacement.mockResolvedValue(
      replacementRow({status: "old_storage_cleanup_failed", oldStorageKey: oldKey}),
    );
    mockReplaceQueries.getOwnedImageRow.mockResolvedValue({
      id: imageId,
      storageKey: newKey,
    });

    const result = await retryOldStorageCleanup({userId, projectId, imageId, replacementId});

    expect(result).toEqual({
      ok: true,
      imageId,
      replacementId,
      status: "complete",
    });
    expect(mockStorageFns.deleteObject).toHaveBeenCalledWith(oldKey);
  });
});
