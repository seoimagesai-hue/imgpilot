import {getR2SignedUrlTtlSeconds, isR2Configured} from "@/lib/env";
import {MAX_BYTES_PER_IMAGE, getExtension} from "@/server/images/policy";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import {
  consumeNewUploadReservation,
  releaseReservation,
  reserveNewUploads,
} from "@/server/images/quota-service";
import type {SafeQuotaErrorCode} from "@/server/images/quota-errors";
import {
  buildSafeFilenameSuffix,
  fileDescriptorSchema,
} from "@/server/images/validation";
import {
  getImageForOwnedProject,
  insertPendingImage,
  markImageUploadFailed,
  markImageUploaded,
} from "@/server/images/queries";
import {getOwnedProject} from "@/server/projects/queries";
import {StorageDomainError, type SafeUploadErrorCode} from "@/server/storage/errors";
import {buildOriginalStorageKey} from "@/server/storage/keys";
import {
  StorageNotConfiguredError,
  getObjectStorageProvider,
} from "@/server/storage/provider";

export type AuthorizeFileInput = {
  clientId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export type AuthorizeFileSuccess = {
  ok: true;
  clientId: string;
  imageId: string;
  method: "PUT";
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type AuthorizeFileFailure = {
  ok: false;
  clientId: string;
  error: SafeUploadErrorCode;
};

export type AuthorizeUploadsResult = {
  ok: true;
  results: Array<AuthorizeFileSuccess | AuthorizeFileFailure>;
};

function mapQuotaToUploadError(code: SafeQuotaErrorCode): SafeUploadErrorCode {
  if (
    code === "PROJECT_IMAGE_LIMIT_REACHED" ||
    code === "PROJECT_STORAGE_LIMIT_REACHED" ||
    code === "FILE_SIZE_LIMIT_EXCEEDED" ||
    code === "UPLOAD_BATCH_LIMIT_EXCEEDED" ||
    code === "UPLOAD_REJECTED_BY_QUOTA"
  ) {
    return code;
  }
  if (code === "PROJECT_NOT_FOUND") return "PROJECT_NOT_FOUND";
  return "STORAGE_UNAVAILABLE";
}

export async function authorizeProjectUploads(params: {
  userId: string;
  projectId: string;
  files: AuthorizeFileInput[];
}): Promise<AuthorizeUploadsResult | {ok: false; error: SafeUploadErrorCode}> {
  if (!isR2Configured()) {
    return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  }

  const project = await getOwnedProject(params.userId, params.projectId, "images.upload");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const storage = await getObjectStorageProvider();
  const ttlSeconds = getR2SignedUrlTtlSeconds();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const results: Array<AuthorizeFileSuccess | AuthorizeFileFailure> = [];

  type ValidatedFile = {
    clientId: string;
    imageId: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    fileExtension: string;
    storageKey: string;
  };

  const validated: ValidatedFile[] = [];

  for (const file of params.files) {
    const parsed = fileDescriptorSchema.safeParse({
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    });
    if (!parsed.success) {
      results.push({
        ok: false,
        clientId: file.clientId,
        error: "INVALID_UPLOAD_REQUEST",
      });
      continue;
    }

    const imageId = crypto.randomUUID();
    const fileExtension = getExtension(parsed.data.originalFilename);
    const storageKey = buildOriginalStorageKey({
      userId: params.userId,
      projectId: project.id,
      imageId,
      safeFilenameSuffix: buildSafeFilenameSuffix(parsed.data.originalFilename),
    });

    validated.push({
      clientId: file.clientId,
      imageId,
      originalFilename: parsed.data.originalFilename.trim(),
      mimeType: parsed.data.mimeType.toLowerCase(),
      sizeBytes: parsed.data.sizeBytes,
      fileExtension,
      storageKey,
    });
  }

  if (validated.length === 0) {
    return {ok: true, results};
  }

  const reserveResult = await reserveNewUploads(
    params.userId,
    project.id,
    validated.map((file) => ({
      clientId: file.clientId,
      imageId: file.imageId,
      declaredBytes: file.sizeBytes,
      expiresAt,
    })),
  );

  if (!reserveResult.ok) {
    const mapped = mapQuotaToUploadError(reserveResult.error);
    if (
      reserveResult.error === "PROJECT_IMAGE_LIMIT_REACHED" ||
      reserveResult.error === "PROJECT_STORAGE_LIMIT_REACHED" ||
      reserveResult.error === "UPLOAD_BATCH_LIMIT_EXCEEDED"
    ) {
      for (const file of validated) {
        results.push({ok: false, clientId: file.clientId, error: mapped});
      }
      return {ok: true, results};
    }

    if (reserveResult.error === "FILE_SIZE_LIMIT_EXCEEDED" && reserveResult.clientId) {
      const failingClientId = reserveResult.clientId;
      for (const file of validated) {
        results.push({
          ok: false,
          clientId: file.clientId,
          error: file.clientId === failingClientId ? mapped : "INVALID_UPLOAD_REQUEST",
        });
      }
      return {ok: true, results};
    }

    return {ok: false, error: mapped};
  }

  const reservationByImageId = new Map(
    reserveResult.reservations.map((row) => [row.imageId, row.reservationId]),
  );

  for (const file of validated) {
    const reservationId = reservationByImageId.get(file.imageId);
    if (!reservationId) {
      results.push({ok: false, clientId: file.clientId, error: "STORAGE_UNAVAILABLE"});
      continue;
    }

    try {
      await insertPendingImage({
        id: file.imageId,
        projectId: project.id,
        originalFilename: file.originalFilename,
        storageKey: file.storageKey,
        storageProvider: "r2",
        mimeType: file.mimeType,
        fileExtension: file.fileExtension,
        sizeBytes: file.sizeBytes,
        status: "pending_upload",
        uploadExpiresAt: expiresAt,
      });

      const target = await storage.createUploadTarget({
        projectId: project.id,
        userId: params.userId,
        imageId: file.imageId,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        originalFilename: file.originalFilename,
        storageKey: file.storageKey,
      });

      results.push({
        ok: true,
        clientId: file.clientId,
        imageId: file.imageId,
        method: "PUT",
        uploadUrl: target.uploadUrl,
        headers: target.headers,
        expiresAt: target.expiresAt.toISOString(),
      });
    } catch (error) {
      await releaseReservation({
        projectId: project.id,
        reservationId,
        reason: "cancelled",
      }).catch(() => {
        console.error("[images] release reservation after authorize failure");
      });

      try {
        await markImageUploadFailed(file.imageId, project.id, "UPLOAD_FAILED");
      } catch {
        /* row may not exist if insert failed */
      }

      if (error instanceof StorageNotConfiguredError) {
        results.push({ok: false, clientId: file.clientId, error: "STORAGE_NOT_CONFIGURED"});
      } else if (error instanceof StorageDomainError) {
        results.push({ok: false, clientId: file.clientId, error: error.code});
      } else {
        console.error("[images] authorize failed");
        results.push({ok: false, clientId: file.clientId, error: "STORAGE_UNAVAILABLE"});
      }
    }
  }

  return {ok: true, results};
}

export type ConfirmUploadResult =
  | {
      ok: true;
      imageId: string;
      status: "uploaded";
      idempotent?: boolean;
    }
  | {ok: false; error: SafeUploadErrorCode};

export async function confirmProjectUpload(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<ConfirmUploadResult> {
  if (!isR2Configured()) {
    return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  }

  const project = await getOwnedProject(params.userId, params.projectId, "images.upload");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const image = await getImageForOwnedProject(params.userId, project.id, params.imageId);
  if (!image) return {ok: false, error: "IMAGE_NOT_FOUND"};

  if (
    image.status === "uploaded" ||
    image.status === "validating" ||
    image.status === "validated" ||
    image.status === "ready_for_processing" ||
    image.status === "validation_failed"
  ) {
    return {ok: true, imageId: image.id, status: "uploaded", idempotent: true};
  }

  if (image.status !== "pending_upload") {
    return {ok: false, error: "UPLOAD_NOT_PENDING"};
  }

  if (image.uploadExpiresAt && image.uploadExpiresAt.getTime() < Date.now()) {
    await markImageUploadFailed(image.id, project.id, "UPLOAD_EXPIRED");
    return {ok: false, error: "UPLOAD_EXPIRED"};
  }

  const storage = await getObjectStorageProvider();

  try {
    const meta = await storage.readObjectMetadata(image.storageKey);
    if (!meta) {
      await markImageUploadFailed(image.id, project.id, "OBJECT_NOT_FOUND");
      return {ok: false, error: "OBJECT_NOT_FOUND"};
    }

    if (meta.sizeBytes <= 0) {
      await markImageUploadFailed(image.id, project.id, "OBJECT_SIZE_MISMATCH");
      try {
        await storage.deleteObject(image.storageKey);
      } catch {
        console.error("[images] cleanup zero-byte object failed");
      }
      return {ok: false, error: "OBJECT_SIZE_MISMATCH"};
    }

    if (meta.sizeBytes > MAX_BYTES_PER_IMAGE) {
      await markImageUploadFailed(image.id, project.id, "OBJECT_TOO_LARGE");
      try {
        await storage.deleteObject(image.storageKey);
      } catch {
        console.error("[images] cleanup oversized object failed");
      }
      return {ok: false, error: "OBJECT_TOO_LARGE"};
    }

    if (meta.contentType && meta.contentType.toLowerCase() !== image.mimeType.toLowerCase()) {
      await markImageUploadFailed(image.id, project.id, "OBJECT_TYPE_MISMATCH");
      try {
        await storage.deleteObject(image.storageKey);
      } catch {
        console.error("[images] cleanup type-mismatch object failed");
      }
      return {ok: false, error: "OBJECT_TYPE_MISMATCH"};
    }

    const quotaConsume = await consumeNewUploadReservation({
      projectId: project.id,
      imageId: image.id,
      trustedBytes: meta.sizeBytes,
    });

    if (!quotaConsume.ok) {
      await markImageUploadFailed(image.id, project.id, quotaConsume.error);
      try {
        await storage.deleteObject(image.storageKey);
      } catch {
        console.error("[images] cleanup quota-rejected object failed");
      }
      const mapped = mapQuotaToUploadError(quotaConsume.error);
      return {ok: false, error: mapped === "STORAGE_UNAVAILABLE" ? "UPLOAD_REJECTED_BY_QUOTA" : mapped};
    }

    const updated = await markImageUploaded(image.id, project.id, {
      etag: meta.etag,
      storageSizeBytes: meta.sizeBytes,
      storageContentType: meta.contentType,
    });
    if (!updated) return {ok: false, error: "CONFIRMATION_FAILED"};

    return {ok: true, imageId: updated.id, status: "uploaded"};
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
    }
    if (error instanceof StorageDomainError) {
      await markImageUploadFailed(image.id, project.id, error.code);
      return {ok: false, error: error.code};
    }
    console.error("[images] confirm failed");
    await markImageUploadFailed(image.id, project.id, "CONFIRMATION_FAILED");
    return {ok: false, error: "CONFIRMATION_FAILED"};
  }
}

export async function createOwnedImageReadUrl(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<{ok: true; url: string; expiresAt: string} | {ok: false; error: SafeUploadErrorCode}> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  const image = await getImageForOwnedProject(params.userId, params.projectId, params.imageId);
  if (!image || image.deletedAt || isDeletionUnavailableStatus(image.status)) {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }
  if (image.status !== "validated" && image.status !== "ready_for_processing") {
    return {ok: false, error: "IMAGE_NOT_FOUND"};
  }

  try {
    const storage = await getObjectStorageProvider();
    const ttl = Math.min(getR2SignedUrlTtlSeconds(), 300);
    const signed = await storage.createSignedReadUrl(image.storageKey, ttl);
    return {ok: true, url: signed.url, expiresAt: signed.expiresAt.toISOString()};
  } catch {
    return {ok: false, error: "STORAGE_UNAVAILABLE"};
  }
}
