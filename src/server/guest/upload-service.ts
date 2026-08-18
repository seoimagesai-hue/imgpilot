import {randomUUID} from "node:crypto";
import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestUploads, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {GuestDomainError} from "@/server/guest/errors";
import {isGuestExpired} from "@/server/guest/guest-policy";
import {
  assertGuestCanAuthorizeUpload,
} from "@/server/guest/session-service";
import {
  validateGuestImageBuffer,
  validateGuestUploadDeclaration,
} from "@/server/guest/validation-service";
import {buildSafeFilenameSuffix} from "@/server/images/validation";
import {
  StorageNotConfiguredError,
  getObjectStorageProvider,
} from "@/server/storage/provider";
import {
  assertGuestStorageKeyOwned,
  buildGuestOriginalStorageKey,
} from "@/server/storage/keys";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {rememberGuestSourceObject} from "@/server/guest/source-cache";

export async function authorizeGuestUpload(params: {
  session: GuestSession;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{
  uploadId: string;
  method: "PUT";
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  await assertGuestCanAuthorizeUpload(params.session);
  validateGuestUploadDeclaration({
    originalFilename: params.originalFilename,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  const uploadId = randomUUID();
  const suffix = buildSafeFilenameSuffix(params.originalFilename);
  const storageKey = buildGuestOriginalStorageKey({
    sessionPublicId: params.session.publicId,
    uploadId,
    safeFilenameSuffix: suffix,
  });

  const provider = await getObjectStorageProvider();
  let target;
  try {
    target = await provider.createUploadTarget({
      projectId: params.session.publicId,
      userId: params.session.id,
      imageId: uploadId,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      originalFilename: params.originalFilename,
      storageKey,
    });
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
    }
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  const db = getDb();
  await db.insert(guestUploads).values({
    id: uploadId,
    sessionId: params.session.id,
    storageKey,
    originalFilename: params.originalFilename.slice(0, 255),
    declaredMimeType: params.mimeType,
    status: "pending_upload",
    expiresAt: params.session.expiresAt,
  });

  return {
    uploadId,
    method: "PUT",
    uploadUrl: target.uploadUrl,
    headers: target.headers,
    expiresAt: target.expiresAt.toISOString(),
  };
}

export async function confirmGuestUpload(params: {
  session: GuestSession;
  uploadId: string;
}): Promise<GuestUpload> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }

  const db = getDb();
  const [upload] = await db
    .select()
    .from(guestUploads)
    .where(
      and(
        eq(guestUploads.id, params.uploadId),
        eq(guestUploads.sessionId, params.session.id),
      ),
    )
    .limit(1);
  if (!upload) throw new GuestDomainError("OBJECT_NOT_FOUND");
  if (!assertGuestStorageKeyOwned({
    storageKey: upload.storageKey,
    sessionPublicId: params.session.publicId,
  })) {
    throw new GuestDomainError("OBJECT_NOT_FOUND");
  }

  const provider = await getObjectStorageProvider();
  let meta;
  try {
    meta = await provider.confirmUpload(upload.storageKey);
  } catch {
    await db
      .update(guestUploads)
      .set({status: "failed", failureCode: "OBJECT_NOT_FOUND"})
      .where(eq(guestUploads.id, upload.id));
    throw new GuestDomainError("OBJECT_NOT_FOUND");
  }

  if (meta.sizeBytes <= 0 || meta.sizeBytes > getGuestMaxFileBytes()) {
    await enqueueGuestCleanup({
      storageKey: upload.storageKey,
      sessionId: params.session.id,
    });
    await db
      .update(guestUploads)
      .set({status: "failed", failureCode: "OBJECT_TOO_LARGE"})
      .where(eq(guestUploads.id, upload.id));
    throw new GuestDomainError("OBJECT_TOO_LARGE");
  }

  let buffer;
  try {
    buffer = await provider.getObjectBuffer(upload.storageKey, getGuestMaxFileBytes());
  } catch {
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  let validated;
  try {
    validated = await validateGuestImageBuffer(buffer.body);
  } catch (error) {
    await enqueueGuestCleanup({
      storageKey: upload.storageKey,
      sessionId: params.session.id,
    });
    await db
      .update(guestUploads)
      .set({
        status: "failed",
        failureCode: error instanceof GuestDomainError ? error.code : "VALIDATION_FAILED",
      })
      .where(eq(guestUploads.id, upload.id));
    throw error instanceof GuestDomainError
      ? error
      : new GuestDomainError("VALIDATION_FAILED");
  }

  rememberGuestSourceObject(buffer);

  const [updated] = await db
    .update(guestUploads)
    .set({
      status: "validated",
      detectedMimeType: validated.mimeType,
      sizeBytes: validated.sizeBytes,
      width: validated.width,
      height: validated.height,
      isAnimated: validated.isAnimated,
      hasAlpha: validated.hasAlpha,
      validatedAt: new Date(),
      // expiresAt unchanged — immutable
    })
    .where(eq(guestUploads.id, upload.id))
    .returning();

  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}
