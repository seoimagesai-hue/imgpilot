/**
 * Guest geotag.write_gps — JPEG GPS metadata write with round-trip verification.
 */
import {createHash, randomUUID} from "node:crypto";
import sharp from "sharp";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, type GuestJob, type GuestSession, type GuestUpload} from "@/db/schema";
import {getGuestMaxFileBytes, isR2Configured} from "@/lib/env";
import {
  isGuestGeotagJpegMime,
  type GuestGeotagOptions,
} from "@/server/guest/geotag-policy";
import {
  readSafeGpsFromJpeg,
  verifyGpsRoundTrip,
  writeGpsToJpeg,
} from "@/server/guest/gps-exif";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {GuestDomainError} from "@/server/guest/errors";
import {buildGuestOutputStorageKey} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {
  MAX_DECODED_MEMORY_ESTIMATE_BYTES,
  MAX_OUTPUT_BYTES,
  MAX_SOURCE_PIXELS_FOR_PROCESSING,
  estimateDecodedMemoryBytes,
} from "@/server/images/processing-policy";
import {buildSafeFilenameSuffix} from "@/server/images/validation";

export type GuestGeotagResultSummary = {
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
  mimeType: "image/jpeg";
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  locationLabel: string | null;
  gpsAction: "added" | "replaced";
  metadataPolicyVersion: string;
  /** Privacy: non-GPS EXIF stripped; Orientation may be retained. */
  nonGpsExifStripped: true;
  durationMs: number;
  sourceChecksum: string;
};

export async function inspectGuestUploadGps(params: {
  session: GuestSession;
  upload: GuestUpload;
}): Promise<{
  formatSupported: boolean;
  gps: ReturnType<typeof readSafeGpsFromJpeg>;
}> {
  if (!isGuestGeotagJpegMime(params.upload.detectedMimeType ?? params.upload.declaredMimeType)) {
    return {
      formatSupported: false,
      gps: {
        present: false,
        readable: false,
        latitude: null,
        longitude: null,
        altitudeMeters: null,
      },
    };
  }
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  const storage = await getObjectStorageProvider();
  const source = await storage.getObjectBuffer(
    params.upload.storageKey,
    getGuestMaxFileBytes(),
  );
  return {formatSupported: true, gps: readSafeGpsFromJpeg(source.body)};
}

export async function executeGuestGeotagJob(params: {
  session: GuestSession;
  job: GuestJob;
  upload: GuestUpload;
  options: GuestGeotagOptions;
}): Promise<GuestJob> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  if (params.upload.isAnimated) throw new GuestDomainError("VALIDATION_FAILED");

  const mime = params.upload.detectedMimeType ?? params.upload.declaredMimeType;
  if (!isGuestGeotagJpegMime(mime)) {
    throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
  }

  const startedAt = Date.now();
  const maxBytes = getGuestMaxFileBytes();
  const storage = await getObjectStorageProvider();
  const source = await storage.getObjectBuffer(params.upload.storageKey, maxBytes);
  const sourceChecksum = createHash("sha256").update(source.body).digest("hex");

  const existing = readSafeGpsFromJpeg(source.body);
  if (existing.present && !params.options.replaceExistingGps) {
    throw new GuestDomainError("INVALID_REQUEST");
  }

  let output: Buffer;
  try {
    output = writeGpsToJpeg(source.body, params.options);
  } catch {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  // Full decode + dimension check.
  let width: number;
  let height: number;
  try {
    const decoded = await sharp(output, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS_FOR_PROCESSING,
      animated: false,
    })
      .raw()
      .toBuffer({resolveWithObject: true});
    width = decoded.info.width;
    height = decoded.info.height;
    if (!width || !height) throw new GuestDomainError("INTERNAL_ERROR");
    if (estimateDecodedMemoryBytes(width, height) > MAX_DECODED_MEMORY_ESTIMATE_BYTES) {
      throw new GuestDomainError("OBJECT_TOO_LARGE");
    }
    const formatMeta = await sharp(output).metadata();
    if (formatMeta.format !== "jpeg") throw new GuestDomainError("INTERNAL_ERROR");
    decoded.data.fill(0);
  } catch (error) {
    if (error instanceof GuestDomainError) throw error;
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const verified = verifyGpsRoundTrip(output, params.options);
  if (!verified.ok) {
    throw new GuestDomainError("VALIDATION_FAILED");
  }

  if (output.byteLength <= 0 || output.byteLength > MAX_OUTPUT_BYTES) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const suffix = buildSafeFilenameSuffix("geotagged.jpg");
  const outputKey = buildGuestOutputStorageKey({
    sessionPublicId: params.session.publicId,
    jobId: params.job.id,
    safeFilenameSuffix: suffix || `${randomUUID()}.jpg`,
  });

  try {
    await storage.putObjectBuffer({
      storageKey: outputKey,
      body: output,
      contentType: "image/jpeg",
      maxBytes: MAX_OUTPUT_BYTES,
    });
  } catch {
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});

  const exists = await storage.objectExists(outputKey);
  if (!exists) {
    await enqueueGuestCleanup({storageKey: outputKey, sessionId: params.session.id});
    throw new GuestDomainError("STORAGE_UNAVAILABLE");
  }

  // Original bytes unchanged.
  if (createHash("sha256").update(source.body).digest("hex") !== sourceChecksum) {
    throw new GuestDomainError("INTERNAL_ERROR");
  }

  const resultSummary: GuestGeotagResultSummary = {
    inputBytes: Number(params.upload.sizeBytes ?? source.sizeBytes),
    outputBytes: output.byteLength,
    width,
    height,
    mimeType: "image/jpeg",
    latitude: params.options.latitude,
    longitude: params.options.longitude,
    altitudeMeters: params.options.altitudeMeters,
    locationLabel: params.options.locationLabel,
    gpsAction: existing.present ? "replaced" : "added",
    metadataPolicyVersion: params.options.metadataPolicyVersion,
    nonGpsExifStripped: true,
    durationMs: Date.now() - startedAt,
    sourceChecksum,
  };

  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      outputStorageKey: outputKey,
      resultSummary,
      errorCode: null,
    })
    .where(eq(guestJobs.id, params.job.id))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}
