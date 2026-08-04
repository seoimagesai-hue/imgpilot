import {and, desc, eq, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {guestJobs, guestUploads, type GuestJob, type GuestSession} from "@/db/schema";
import {
  GUEST_COMPRESS_OPERATION,
  parseGuestCompressOptions,
  type GuestCompressOptions,
} from "@/server/guest/compress-policy";
import {executeGuestCompressJob} from "@/server/guest/compress-service";
import {
  GUEST_CROP_OPERATION,
  guestCropOptionsEqual,
  parseGuestCropOptions,
  type GuestCropOptions,
} from "@/server/guest/crop-policy";
import {executeGuestCropJob} from "@/server/guest/crop-service";
import {
  GUEST_CONVERT_OPERATION,
  guestConvertOptionsEqual,
  parseGuestConvertOptions,
  sourceFormatFromMime,
  type GuestConvertOptions,
} from "@/server/guest/convert-policy";
import {executeGuestConvertJob} from "@/server/guest/convert-service";
import {
  GUEST_GEOTAG_OPERATION,
  guestGeotagOptionsEqual,
  parseGuestGeotagOptions,
  type GuestGeotagOptions,
} from "@/server/guest/geotag-policy";
import {executeGuestGeotagJob} from "@/server/guest/geotag-service";
import {
  GUEST_METADATA_OPERATION,
  guestMetadataOptionsEqual,
  parseGuestMetadataOptions,
  type GuestMetadataOptions,
} from "@/server/guest/metadata-policy";
import {executeGuestMetadataJob} from "@/server/guest/metadata-service";
import {
  GUEST_AI_ALT_OPERATION,
  guestAiAltOptionsEqual,
  parseGuestAiAltOptions,
  type GuestAiAltOptions,
} from "@/server/guest/ai-alt-policy";
import {executeGuestAiAltJob} from "@/server/guest/ai-alt-service";
import {GUEST_METADATA_EDIT_OPERATION} from "@/server/guest/metadata-editor-policy";
import {upsertGuestMetadataEditorJob} from "@/server/guest/metadata-editor-service";
import {isGuestAvifEncodeSupported} from "@/server/guest/avif-capability";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {
  GUEST_RESIZE_OPERATION,
  parseGuestResizeOptions,
  type GuestResizeOptions,
} from "@/server/guest/resize-policy";
import {executeGuestResizeJob} from "@/server/guest/resize-service";
import {GuestDomainError} from "@/server/guest/errors";
import {isGuestExpired} from "@/server/guest/guest-policy";
import {
  canTransitionGuestJob,
  GUEST_FOUNDATION_OPERATION,
  isGuestSupportedOperation,
  type GuestJobStatus,
} from "@/server/guest/processing-policy";
import {
  assertGuestCanStartOperation,
  incrementGuestOperations,
} from "@/server/guest/session-service";
import type {GuestJobPublic} from "@/server/guest/types";

export function toGuestJobPublic(job: GuestJob): GuestJobPublic {
  return {
    jobId: job.id,
    status: job.status as GuestJobStatus,
    operation: job.operation,
    expiresAt: job.expiresAt.toISOString(),
    errorCode: job.errorCode,
    completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    resultSummary:
      job.resultSummary && typeof job.resultSummary === "object"
        ? (job.resultSummary as GuestJobPublic["resultSummary"])
        : null,
  };
}

async function failJob(jobId: string, code: string): Promise<GuestJob> {
  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: "failed",
      completedAt: new Date(),
      errorCode: code,
    })
    .where(eq(guestJobs.id, jobId))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}

type ParsedJobOptions =
  | GuestCompressOptions
  | GuestResizeOptions
  | GuestCropOptions
  | GuestConvertOptions
  | GuestGeotagOptions
  | GuestMetadataOptions
  | GuestAiAltOptions
  | null;

async function findIdempotentJob(params: {
  sessionId: string;
  uploadId: string;
  operation: string;
  equal: (a: unknown, b: unknown) => boolean;
  options: unknown;
  /** Metadata inspect has no derivative image output. */
  requireOutputKey?: boolean;
}): Promise<GuestJob | null> {
  const db = getDb();
  const prior = await db
    .select()
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.sessionId, params.sessionId),
        eq(guestJobs.uploadId, params.uploadId),
        eq(guestJobs.operation, params.operation),
        eq(guestJobs.status, "completed"),
      ),
    )
    .orderBy(desc(guestJobs.completedAt))
    .limit(20);

  const requireOutput = params.requireOutputKey !== false;
  for (const job of prior) {
    if (!job.options || typeof job.options !== "object") continue;
    if (requireOutput && !job.outputStorageKey) continue;
    if (params.equal(job.options, params.options)) return job;
  }
  return null;
}

async function enqueuePreviousOutputs(params: {
  sessionId: string;
  uploadId: string;
  operation: string;
}): Promise<void> {
  const db = getDb();
  const prior = await db
    .select()
    .from(guestJobs)
    .where(
      and(
        eq(guestJobs.sessionId, params.sessionId),
        eq(guestJobs.uploadId, params.uploadId),
        eq(guestJobs.operation, params.operation),
        inArray(guestJobs.status, ["completed", "failed", "cancelled"]),
      ),
    );

  for (const job of prior) {
    if (!job.outputStorageKey) continue;
    await enqueueGuestCleanup({
      storageKey: job.outputStorageKey,
      sessionId: params.sessionId,
    });
  }
}

/**
 * Create and execute a guest processing job (noop, compress, resize, crop, convert).
 */
export async function createGuestJob(params: {
  session: GuestSession;
  uploadId: string;
  operation?: string;
  options?: unknown;
}): Promise<GuestJob> {
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
        eq(guestUploads.status, "validated"),
      ),
    )
    .limit(1);
  if (!upload) throw new GuestDomainError("OBJECT_NOT_FOUND");

  const operation = params.operation ?? GUEST_COMPRESS_OPERATION;
  if (!isGuestSupportedOperation(operation)) {
    throw new GuestDomainError("OPERATION_NOT_SUPPORTED");
  }

  // Metadata Editor drafts are op-free (prepare/save/import do not consume guest ops).
  if (operation === GUEST_METADATA_EDIT_OPERATION) {
    return upsertGuestMetadataEditorJob({
      session: params.session,
      upload,
      options: params.options,
    });
  }

  await assertGuestCanStartOperation(params.session);

  let jobOptions: ParsedJobOptions = null;
  if (operation === GUEST_COMPRESS_OPERATION) {
    jobOptions = parseGuestCompressOptions(params.options);
  } else if (operation === GUEST_RESIZE_OPERATION) {
    jobOptions = parseGuestResizeOptions(params.options);
  } else if (operation === GUEST_CROP_OPERATION) {
    try {
      jobOptions = parseGuestCropOptions(params.options);
    } catch {
      throw new GuestDomainError("INVALID_REQUEST");
    }
  } else if (operation === GUEST_CONVERT_OPERATION) {
    const sourceFormat = sourceFormatFromMime(
      upload.detectedMimeType ?? upload.declaredMimeType,
    );
    if (!sourceFormat) throw new GuestDomainError("UNSUPPORTED_MEDIA_TYPE");
    const avifSupported = await isGuestAvifEncodeSupported();
    try {
      jobOptions = parseGuestConvertOptions(params.options, {
        sourceFormat,
        hasAlpha: Boolean(upload.hasAlpha),
        avifSupported,
      });
    } catch {
      throw new GuestDomainError("INVALID_REQUEST");
    }
  } else if (operation === GUEST_GEOTAG_OPERATION) {
    try {
      jobOptions = parseGuestGeotagOptions(params.options);
    } catch {
      throw new GuestDomainError("INVALID_REQUEST");
    }
  } else if (operation === GUEST_METADATA_OPERATION) {
    try {
      jobOptions = parseGuestMetadataOptions(params.options);
    } catch {
      throw new GuestDomainError("INVALID_REQUEST");
    }
  } else if (operation === GUEST_AI_ALT_OPERATION) {
    try {
      jobOptions = parseGuestAiAltOptions(params.options);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg === "PURPOSE_INVALID" || msg === "LANGUAGE_INVALID") {
        throw new GuestDomainError("INVALID_REQUEST");
      }
      throw new GuestDomainError("INVALID_REQUEST");
    }
  }

  if (operation === GUEST_CROP_OPERATION && jobOptions) {
    const existing = await findIdempotentJob({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation: GUEST_CROP_OPERATION,
      options: jobOptions,
      equal: (a, b) => {
        try {
          return guestCropOptionsEqual(parseGuestCropOptions(a), b as GuestCropOptions);
        } catch {
          return false;
        }
      },
    });
    if (existing) return existing;
  }

  if (operation === GUEST_CONVERT_OPERATION && jobOptions) {
    const existing = await findIdempotentJob({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation: GUEST_CONVERT_OPERATION,
      options: jobOptions,
      equal: (a, b) => {
        try {
          const sourceFormat = sourceFormatFromMime(
            upload.detectedMimeType ?? upload.declaredMimeType,
          );
          if (!sourceFormat) return false;
          // Re-parse without AVIF gate for equality of stored allow-listed fields.
          const left = a as GuestConvertOptions;
          const right = b as GuestConvertOptions;
          return guestConvertOptionsEqual(left, right);
        } catch {
          return false;
        }
      },
    });
    if (existing) return existing;
  }

  if (operation === GUEST_GEOTAG_OPERATION && jobOptions) {
    const existing = await findIdempotentJob({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation: GUEST_GEOTAG_OPERATION,
      options: jobOptions,
      equal: (a, b) => {
        try {
          return guestGeotagOptionsEqual(
            parseGuestGeotagOptions(a),
            b as GuestGeotagOptions,
          );
        } catch {
          return false;
        }
      },
    });
    if (existing) return existing;
  }

  if (operation === GUEST_METADATA_OPERATION && jobOptions) {
    const existing = await findIdempotentJob({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation: GUEST_METADATA_OPERATION,
      options: jobOptions,
      requireOutputKey: false,
      equal: (a, b) => {
        try {
          return guestMetadataOptionsEqual(
            parseGuestMetadataOptions(a),
            b as GuestMetadataOptions,
          );
        } catch {
          return false;
        }
      },
    });
    if (existing) return existing;
  }

  if (operation === GUEST_AI_ALT_OPERATION && jobOptions) {
    const existing = await findIdempotentJob({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation: GUEST_AI_ALT_OPERATION,
      options: jobOptions,
      requireOutputKey: false,
      equal: (a, b) => {
        try {
          return guestAiAltOptionsEqual(
            parseGuestAiAltOptions(a),
            b as GuestAiAltOptions,
          );
        } catch {
          return false;
        }
      },
    });
    if (existing) return existing;
  }

  const [job] = await db
    .insert(guestJobs)
    .values({
      sessionId: params.session.id,
      uploadId: upload.id,
      operation,
      status: "queued",
      options: jobOptions,
      expiresAt: params.session.expiresAt,
    })
    .returning();
  if (!job) throw new GuestDomainError("INTERNAL_ERROR");

  await incrementGuestOperations(params.session.id);

  const running = await transitionGuestJob(job.id, params.session.id, "running");

  try {
    if (operation === GUEST_FOUNDATION_OPERATION) {
      const [completed] = await db
        .update(guestJobs)
        .set({
          status: "completed",
          startedAt: running.startedAt ?? new Date(),
          completedAt: new Date(),
          outputStorageKey: upload.storageKey,
        })
        .where(eq(guestJobs.id, job.id))
        .returning();
      return completed ?? running;
    }

    if (operation === GUEST_CROP_OPERATION) {
      await enqueuePreviousOutputs({
        sessionId: params.session.id,
        uploadId: upload.id,
        operation: GUEST_CROP_OPERATION,
      });
      return await executeGuestCropJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestCropOptions,
      });
    }

    if (operation === GUEST_CONVERT_OPERATION) {
      await enqueuePreviousOutputs({
        sessionId: params.session.id,
        uploadId: upload.id,
        operation: GUEST_CONVERT_OPERATION,
      });
      return await executeGuestConvertJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestConvertOptions,
      });
    }

    if (operation === GUEST_GEOTAG_OPERATION) {
      await enqueuePreviousOutputs({
        sessionId: params.session.id,
        uploadId: upload.id,
        operation: GUEST_GEOTAG_OPERATION,
      });
      // Scrub coordinates from older geotag job rows (keep row for audit shape).
      await db
        .update(guestJobs)
        .set({
          options: {scrubbed: true},
          resultSummary: {scrubbed: true},
        })
        .where(
          and(
            eq(guestJobs.sessionId, params.session.id),
            eq(guestJobs.uploadId, upload.id),
            eq(guestJobs.operation, GUEST_GEOTAG_OPERATION),
            inArray(guestJobs.status, ["completed", "failed", "cancelled"]),
          ),
        );
      return await executeGuestGeotagJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestGeotagOptions,
      });
    }

    if (operation === GUEST_METADATA_OPERATION) {
      await db
        .update(guestJobs)
        .set({
          options: {scrubbed: true},
          resultSummary: {scrubbed: true},
        })
        .where(
          and(
            eq(guestJobs.sessionId, params.session.id),
            eq(guestJobs.uploadId, upload.id),
            eq(guestJobs.operation, GUEST_METADATA_OPERATION),
            inArray(guestJobs.status, ["completed", "failed", "cancelled"]),
          ),
        );
      return await executeGuestMetadataJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestMetadataOptions,
      });
    }

    if (operation === GUEST_AI_ALT_OPERATION) {
      await db
        .update(guestJobs)
        .set({
          options: {scrubbed: true},
          resultSummary: {scrubbed: true},
        })
        .where(
          and(
            eq(guestJobs.sessionId, params.session.id),
            eq(guestJobs.uploadId, upload.id),
            eq(guestJobs.operation, GUEST_AI_ALT_OPERATION),
            inArray(guestJobs.status, ["completed", "failed", "cancelled"]),
          ),
        );
      return await executeGuestAiAltJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestAiAltOptions,
      });
    }

    if (operation === GUEST_RESIZE_OPERATION) {
      return await executeGuestResizeJob({
        session: params.session,
        job: running,
        upload,
        options: jobOptions as GuestResizeOptions,
      });
    }

    return await executeGuestCompressJob({
      session: params.session,
      job: running,
      upload,
      options: jobOptions as GuestCompressOptions,
    });
  } catch (error) {
    const code = error instanceof GuestDomainError ? error.code : "INTERNAL_ERROR";
    return failJob(job.id, code);
  }
}

export async function createFoundationGuestJob(params: {
  session: GuestSession;
  uploadId: string;
  operation?: string;
  options?: unknown;
}): Promise<GuestJob> {
  return createGuestJob(params);
}

export async function getGuestJobForSession(
  sessionId: string,
  jobId: string,
): Promise<GuestJob> {
  const db = getDb();
  const [job] = await db
    .select()
    .from(guestJobs)
    .where(and(eq(guestJobs.id, jobId), eq(guestJobs.sessionId, sessionId)))
    .limit(1);
  if (!job) throw new GuestDomainError("JOB_NOT_FOUND");
  return job;
}

export async function transitionGuestJob(
  jobId: string,
  sessionId: string,
  to: GuestJobStatus,
): Promise<GuestJob> {
  const job = await getGuestJobForSession(sessionId, jobId);
  if (!canTransitionGuestJob(job.status as GuestJobStatus, to)) {
    throw new GuestDomainError("INVALID_REQUEST");
  }
  const db = getDb();
  const [updated] = await db
    .update(guestJobs)
    .set({
      status: to,
      startedAt: to === "running" ? new Date() : job.startedAt,
      completedAt: to === "completed" || to === "failed" ? new Date() : job.completedAt,
    })
    .where(eq(guestJobs.id, jobId))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");
  return updated;
}

export async function listActiveGuestJobs(sessionId: string): Promise<GuestJob[]> {
  const db = getDb();
  return db
    .select()
    .from(guestJobs)
    .where(
      and(eq(guestJobs.sessionId, sessionId), inArray(guestJobs.status, ["queued", "running"])),
    );
}
