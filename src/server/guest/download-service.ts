import {and, eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, guestUploads, type GuestSession} from "@/db/schema";
import {getR2SignedUrlTtlSeconds, isR2Configured} from "@/lib/env";
import {GuestDomainError} from "@/server/guest/errors";
import {isGuestExpired} from "@/server/guest/guest-policy";
import {clampGuestDownloadTtl} from "@/server/guest/download-policy";
import {assertGuestStorageKeyOwned} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";

async function resolveGuestDownloadStorageKey(params: {
  session: GuestSession;
  jobId?: string;
  uploadId?: string;
}): Promise<string> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }

  const db = getDb();
  let storageKey: string | null = null;

  if (params.jobId) {
    const [job] = await db
      .select()
      .from(guestJobs)
      .where(
        and(eq(guestJobs.id, params.jobId), eq(guestJobs.sessionId, params.session.id)),
      )
      .limit(1);
    if (!job) throw new GuestDomainError("JOB_NOT_FOUND");
    if (job.status !== "completed" || !job.outputStorageKey) {
      throw new GuestDomainError("JOB_NOT_READY");
    }
    storageKey = job.outputStorageKey;
  } else if (params.uploadId) {
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
    if (!upload || upload.status !== "validated") {
      throw new GuestDomainError("OBJECT_NOT_FOUND");
    }
    storageKey = upload.storageKey;
  } else {
    throw new GuestDomainError("INVALID_REQUEST");
  }

  if (
    !assertGuestStorageKeyOwned({
      storageKey,
      sessionPublicId: params.session.publicId,
    })
  ) {
    throw new GuestDomainError("OBJECT_NOT_FOUND");
  }

  return storageKey;
}

/**
 * Issue a short-lived signed download. Never extends expiresAt.
 */
export async function createGuestSignedDownload(params: {
  session: GuestSession;
  jobId?: string;
  uploadId?: string;
  downloadFilename?: string;
}): Promise<{url: string; expiresAt: string; storageKey: string}> {
  const storageKey = await resolveGuestDownloadStorageKey(params);
  const ttl = clampGuestDownloadTtl(getR2SignedUrlTtlSeconds());
  const provider = await getObjectStorageProvider();
  const signed = await provider.createSignedReadUrl(storageKey, ttl, {
    downloadFilename: params.downloadFilename,
  });
  return {
    url: signed.url,
    expiresAt: signed.expiresAt.toISOString(),
    storageKey,
  };
}

/** Same-origin file bytes for browser download (avoids cross-origin R2 `<a download>`). */
export async function loadGuestDownloadBytes(params: {
  session: GuestSession;
  jobId?: string;
  uploadId?: string;
}): Promise<{body: Buffer; contentType: string}> {
  const storageKey = await resolveGuestDownloadStorageKey(params);
  const {MAX_OUTPUT_BYTES} = await import("@/server/images/processing-policy");
  const provider = await getObjectStorageProvider();
  const object = await provider.getObjectBuffer(storageKey, MAX_OUTPUT_BYTES);
  return {
    body: object.body,
    contentType: object.contentType || "application/octet-stream",
  };
}
