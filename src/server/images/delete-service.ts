import {isR2Configured} from "@/lib/env";
import {
  type SafeLifecycleErrorCode,
} from "@/server/images/lifecycle-errors";
import {
  acquireImageDeletion,
  getOwnedImageForLifecycle,
  markDeletionFailed,
  markImageDeletedComplete,
  markStorageDeleting,
} from "@/server/images/delete-queries";
import {hasOpenReplacementForImage} from "@/server/images/replace-queries";
import {
  onDeleteCleanupSuccess,
  onImageDeletionAcquired,
  trustedImageBytes,
} from "@/server/images/quota-service";
import {getOwnedProject} from "@/server/projects/queries";
import {StorageDomainError} from "@/server/storage/errors";
import {
  StorageNotConfiguredError,
  getObjectStorageProvider,
} from "@/server/storage/provider";

export type DeleteImageResult =
  | {
      ok: true;
      imageId: string;
      status: "deleted" | "deletion_pending" | "storage_deleting" | "deletion_failed";
      idempotent?: boolean;
      cleanupPending?: boolean;
    }
  | {ok: false; error: SafeLifecycleErrorCode};

async function runStorageCleanup(params: {
  userId: string;
  projectId: string;
  imageId: string;
  storageKey: string;
}): Promise<DeleteImageResult> {
  const moving = await markStorageDeleting(params.imageId, params.projectId);
  if (!moving) {
    const again = await getOwnedImageForLifecycle(params.userId, params.projectId, params.imageId);
    if (again?.status === "deleted") {
      return {ok: true, imageId: params.imageId, status: "deleted", idempotent: true};
    }
    return {ok: false, error: "IMAGE_DELETION_IN_PROGRESS"};
  }

  const storage = await getObjectStorageProvider();
  try {
    await storage.deleteObject(params.storageKey);
    const exists = await storage.objectExists(params.storageKey);
    if (exists) {
      await markDeletionFailed(params.imageId, params.projectId, "STORAGE_CLEANUP_FAILED");
      return {
        ok: true,
        imageId: params.imageId,
        status: "deletion_failed",
        cleanupPending: true,
      };
    }
    await markImageDeletedComplete(params.imageId, params.projectId);
    const image = await getOwnedImageForLifecycle(params.userId, params.projectId, params.imageId);
    if (image) {
      await onDeleteCleanupSuccess({
        projectId: params.projectId,
        trustedBytes: trustedImageBytes(image),
      }).catch(() => {
        console.error("[quota] onDeleteCleanupSuccess failed");
      });
    }
    return {ok: true, imageId: params.imageId, status: "deleted"};
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      await markDeletionFailed(params.imageId, params.projectId, "STORAGE_NOT_CONFIGURED");
      return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
    }
    const code =
      error instanceof StorageDomainError && error.code === "OBJECT_NOT_FOUND"
        ? null
        : "STORAGE_CLEANUP_FAILED";
    if (code === null) {
      // Idempotent: object already gone.
      await markImageDeletedComplete(params.imageId, params.projectId);
      const image = await getOwnedImageForLifecycle(params.userId, params.projectId, params.imageId);
      if (image) {
        await onDeleteCleanupSuccess({
          projectId: params.projectId,
          trustedBytes: trustedImageBytes(image),
        }).catch(() => {
          console.error("[quota] onDeleteCleanupSuccess failed");
        });
      }
      return {ok: true, imageId: params.imageId, status: "deleted", idempotent: true};
    }
    console.error("[images] delete storage cleanup failed");
    await markDeletionFailed(params.imageId, params.projectId, code);
    return {
      ok: true,
      imageId: params.imageId,
      status: "deletion_failed",
      cleanupPending: true,
    };
  }
}

/**
 * Owner-scoped image deletion saga.
 * DB hide first, then exact-key R2 delete. Never accepts a browser key.
 * Not a distributed atomic transaction across PostgreSQL and R2.
 */
export async function deleteOwnedImage(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<DeleteImageResult> {
  if (!isR2Configured()) {
    return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  }

  const project = await getOwnedProject(params.userId, params.projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const openReplacement = await hasOpenReplacementForImage(project.id, params.imageId);
  if (openReplacement) {
    return {ok: false, error: "IMAGE_NOT_DELETABLE"};
  }

  const acquired = await acquireImageDeletion(params.userId, project.id, params.imageId);

  if (acquired.kind === "not_found") return {ok: false, error: "IMAGE_NOT_FOUND"};
  if (acquired.kind === "already_deleted") {
    return {ok: true, imageId: params.imageId, status: "deleted", idempotent: true};
  }
  if (acquired.kind === "in_progress") {
    if (acquired.image.status === "deletion_failed") {
      return {
        ok: true,
        imageId: params.imageId,
        status: "deletion_failed",
        cleanupPending: true,
      };
    }
    return {
      ok: true,
      imageId: params.imageId,
      status: acquired.image.status as "deletion_pending" | "storage_deleting",
      idempotent: true,
    };
  }
  if (acquired.kind === "deletion_failed") {
    return retryDeletionCleanup(params);
  }
  if (acquired.kind === "not_deletable" || acquired.kind === "replacement_active") {
    return {ok: false, error: "IMAGE_NOT_DELETABLE"};
  }

  if (acquired.kind === "acquired") {
    const wasPendingUpload =
      acquired.image.confirmedAt == null && acquired.image.storageSizeBytes == null;
    await onImageDeletionAcquired({
      projectId: project.id,
      imageId: params.imageId,
      declaredOrTrustedBytes: wasPendingUpload
        ? acquired.image.sizeBytes
        : trustedImageBytes(acquired.image),
      wasPendingUpload,
    }).catch(() => {
      console.error("[quota] onImageDeletionAcquired failed");
    });
  }

  return runStorageCleanup({
    userId: params.userId,
    projectId: project.id,
    imageId: params.imageId,
    storageKey: acquired.storageKey,
  });
}

/** Retry R2 cleanup for deletion_failed images. Image stays product-hidden. */
export async function retryDeletionCleanup(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<DeleteImageResult> {
  if (!isR2Configured()) {
    return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  }

  const project = await getOwnedProject(params.userId, params.projectId);
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const image = await getOwnedImageForLifecycle(params.userId, project.id, params.imageId);
  if (!image) return {ok: false, error: "IMAGE_NOT_FOUND"};

  if (image.status === "deleted") {
    return {ok: true, imageId: image.id, status: "deleted", idempotent: true};
  }

  if (
    image.status !== "deletion_failed" &&
    image.status !== "deletion_pending" &&
    image.status !== "storage_deleting"
  ) {
    return {ok: false, error: "IMAGE_DELETION_IN_PROGRESS"};
  }

  return runStorageCleanup({
    userId: params.userId,
    projectId: project.id,
    imageId: image.id,
    storageKey: image.storageKey,
  });
}
