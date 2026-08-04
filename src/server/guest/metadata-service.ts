/**
 * Guest metadata.inspect — viewer-only; never writes a derivative image.
 */
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  isGuestMetadataMime,
  type GuestMetadataOptions,
  type SafeMetadataResult,
} from "@/server/guest/metadata-policy";
import {extractSafeGuestMetadata} from "@/server/guest/metadata-extract";
import {GuestDomainError} from "@/server/guest/errors";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {buildSafeFilenameSuffix} from "@/server/images/validation";

export async function executeGuestMetadataJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestMetadataOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");

  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType ?? "";
  if (!isGuestMetadataMime(mime)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }

  const startedAt = Date.now();
  const storage = await getObjectStorageProvider();
  let source: {body: Buffer};
  try {
    source = await storage.getObjectBuffer(params.upload.storageKey, getGuestMaxFileBytes());
  } catch {
    throw new GuestDomainError("OBJECT_NOT_FOUND");
  }

  let result: SafeMetadataResult;
  try {
    const safeName = params.upload.originalFilename
      ? buildSafeFilenameSuffix(params.upload.originalFilename)
      : null;
    result = await extractSafeGuestMetadata({
      buffer: source.body,
      mimeType: mime,
      filename: safeName || params.upload.originalFilename || null,
      byteSize: Number(params.upload.sizeBytes ?? source.body.byteLength),
      startedAt,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "FORMAT_UNSUPPORTED") throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
    if (msg === "RESULT_TOO_LARGE") throw new GuestDomainError("VALIDATION_FAILED");
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  // Guarantee no image derivative.
  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputStorageKey: null,
      resultSummary: result,
      errorCode: null,
      options: params.options,
    })
    .where(eq(guestJobs.id, params.job.id))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}
