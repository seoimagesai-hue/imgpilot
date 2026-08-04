/**
 * Guest public bulk orchestration — Prompt 10.
 * Bounded synchronous child jobs (sequential) using existing createGuestJob engines.
 */

import {and, desc, eq, inArray, sql, asc} from "drizzle-orm";
import {getDb} from "@/db";
import {
  guestBulkJobItems,
  guestBulkJobs,
  guestJobs,
  guestSessions,
  guestUploads,
  type GuestBulkJob,
  type GuestBulkJobItem,
  type GuestSession,
} from "@/db/schema";
import {getGuestMaxFileBytes, getGuestMaxOpsPerDay, getR2SignedUrlTtlSeconds, isR2Configured} from "@/lib/env";
import {
  AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT,
  AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_ACTIVE,
  GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
  GUEST_BULK_MAX_FILES_DEFAULT,
  GUEST_BULK_MAX_ZIP_BYTES_DEFAULT,
  GUEST_BULK_PROCESS_CONCURRENCY,
  GUEST_BULK_UPLOAD_CONCURRENCY,
  isGuestBulkToolCode,
  operationForBulkTool,
  type GuestBulkPublicPolicy,
  type GuestBulkToolCode,
} from "@/server/guest/bulk-policy";
import {buildGuestBulkArchive} from "@/server/guest/bulk-zip";
import {enqueueGuestCleanup} from "@/server/guest/cleanup-service";
import {clampGuestDownloadTtl} from "@/server/guest/download-policy";
import {GuestDomainError} from "@/server/guest/errors";
import {GUEST_ASSET_TTL_MS, isGuestExpired} from "@/server/guest/guest-policy";
import {createGuestJob, toGuestJobPublic} from "@/server/guest/processing-service";
import {assertGuestStorageKeyOwned, buildGuestBulkArchiveStorageKey} from "@/server/storage/keys";
import {getObjectStorageProvider} from "@/server/storage/provider";

export function resolveGuestBulkPolicy(params: {authenticated: boolean}): GuestBulkPublicPolicy {
  const maxFileBytes = getGuestMaxFileBytes();
  const elevated = params.authenticated;
  return {
    maxFiles: elevated ? AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT : GUEST_BULK_MAX_FILES_DEFAULT,
    maxBatchBytes: elevated
      ? AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT
      : GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
    maxFileBytes,
    maxZipBytes: GUEST_BULK_MAX_ZIP_BYTES_DEFAULT,
    maxActiveBulkJobs: GUEST_BULK_MAX_ACTIVE,
    uploadConcurrency: GUEST_BULK_UPLOAD_CONCURRENCY,
    processConcurrency: GUEST_BULK_PROCESS_CONCURRENCY,
    retentionMs: GUEST_ASSET_TTL_MS,
    operationsPerFile: 1,
    bulkAiGuestAllowed: false,
    zipEnabled: true,
    tools: {
      compress: true,
      resize: true,
      convert: true,
      aiAltText: false,
      crop: false,
      geotag: false,
      metadataViewer: false,
      metadataEditor: false,
    },
  };
}

export type BulkFileDeclaration = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export function toPublicBulkJob(job: GuestBulkJob, items: GuestBulkJobItem[]) {
  return {
    bulkJobId: job.id,
    toolCode: job.toolCode,
    operation: job.operation,
    status: job.status,
    options: job.options,
    totalItems: job.totalItems,
    completedItems: job.completedItems,
    failedItems: job.failedItems,
    skippedItems: job.skippedItems,
    archiveStatus: job.archiveStatus,
    archiveBytes: job.archiveBytes,
    errorCode: job.errorCode,
    expiresAt: job.expiresAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    items: items.map((item) => ({
      itemId: item.id,
      uploadId: item.uploadId,
      childJobId: item.childJobId,
      originalFilename: item.originalFilename,
      declaredMimeType: item.declaredMimeType,
      declaredSizeBytes: item.declaredSizeBytes,
      sortOrder: item.sortOrder,
      status: item.status,
      errorCode: item.errorCode,
      resultSummary:
        item.resultSummary && typeof item.resultSummary === "object"
          ? (item.resultSummary as Record<string, unknown>)
          : null,
    })),
  };
}

async function assertNoActiveBulk(sessionId: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(guestBulkJobs)
    .where(
      and(
        eq(guestBulkJobs.sessionId, sessionId),
        inArray(guestBulkJobs.status, ["draft", "uploading", "ready", "processing"]),
      ),
    );
  if ((row?.count ?? 0) >= GUEST_BULK_MAX_ACTIVE) {
    throw new GuestDomainError("GUEST_BULK_ACTIVE_EXISTS");
  }
}

export async function createGuestBulkJob(params: {
  session: GuestSession;
  toolCode: string;
  options?: unknown;
  files: BulkFileDeclaration[];
  authenticated: boolean;
}): Promise<{job: GuestBulkJob; items: GuestBulkJobItem[]; policy: GuestBulkPublicPolicy}> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  if (!isGuestBulkToolCode(params.toolCode)) {
    throw new GuestDomainError("OPERATION_NOT_SUPPORTED");
  }
  const policy = resolveGuestBulkPolicy({authenticated: params.authenticated});
  const files = params.files;
  if (!files.length) throw new GuestDomainError("INVALID_REQUEST");
  if (files.length > policy.maxFiles) {
    throw new GuestDomainError("GUEST_BULK_TOO_MANY_FILES");
  }

  let totalBytes = 0;
  for (const f of files) {
    if (!Number.isFinite(f.sizeBytes) || f.sizeBytes <= 0) {
      throw new GuestDomainError("INVALID_REQUEST");
    }
    if (f.sizeBytes > policy.maxFileBytes) {
      throw new GuestDomainError("OBJECT_TOO_LARGE");
    }
    totalBytes += f.sizeBytes;
  }
  if (totalBytes > policy.maxBatchBytes) {
    throw new GuestDomainError("GUEST_BULK_BATCH_TOO_LARGE");
  }

  const opsLimit = getGuestMaxOpsPerDay();
  const remaining = Math.max(0, opsLimit - params.session.operationsUsed);
  if (files.length > remaining) {
    throw new GuestDomainError("GUEST_LIMIT_REACHED");
  }

  await assertNoActiveBulk(params.session.id);

  const tool = params.toolCode as GuestBulkToolCode;
  const operation = operationForBulkTool(tool);
  const db = getDb();
  const [job] = await db
    .insert(guestBulkJobs)
    .values({
      sessionId: params.session.id,
      toolCode: tool,
      operation,
      status: "uploading",
      options: params.options && typeof params.options === "object" ? params.options : {},
      totalItems: files.length,
      reservedOps: files.length,
      expiresAt: params.session.expiresAt,
    })
    .returning();
  if (!job) throw new GuestDomainError("INTERNAL_ERROR");

  const items: GuestBulkJobItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const [item] = await db
      .insert(guestBulkJobItems)
      .values({
        bulkJobId: job.id,
        sessionId: params.session.id,
        originalFilename: f.originalFilename.slice(0, 200),
        declaredMimeType: f.mimeType.slice(0, 100),
        declaredSizeBytes: f.sizeBytes,
        sortOrder: i,
        status: "pending",
      })
      .returning();
    if (item) items.push(item);
  }

  return {job, items, policy};
}

export async function attachUploadToBulkItem(params: {
  session: GuestSession;
  bulkJobId: string;
  itemId: string;
  uploadId: string;
}): Promise<GuestBulkJobItem> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(guestBulkJobs)
    .where(
      and(eq(guestBulkJobs.id, params.bulkJobId), eq(guestBulkJobs.sessionId, params.session.id)),
    )
    .limit(1);
  if (!job) throw new GuestDomainError("JOB_NOT_FOUND");
  if (!["uploading", "ready", "draft"].includes(job.status)) {
    throw new GuestDomainError("GUEST_BULK_NOT_READY");
  }

  const [item] = await db
    .select()
    .from(guestBulkJobItems)
    .where(
      and(
        eq(guestBulkJobItems.id, params.itemId),
        eq(guestBulkJobItems.bulkJobId, job.id),
        eq(guestBulkJobItems.sessionId, params.session.id),
      ),
    )
    .limit(1);
  if (!item) throw new GuestDomainError("OBJECT_NOT_FOUND");

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
  if (!upload) throw new GuestDomainError("GUEST_BULK_NOT_READY");

  const [updated] = await db
    .update(guestBulkJobItems)
    .set({
      uploadId: upload.id,
      status: "validated",
      updatedAt: new Date(),
      errorCode: null,
    })
    .where(eq(guestBulkJobItems.id, item.id))
    .returning();
  if (!updated) throw new GuestDomainError("INTERNAL_ERROR");

  const validated = await db
    .select()
    .from(guestBulkJobItems)
    .where(and(eq(guestBulkJobItems.bulkJobId, job.id), eq(guestBulkJobItems.status, "validated")));
  if (validated.length >= job.totalItems) {
    await db.update(guestBulkJobs).set({status: "ready"}).where(eq(guestBulkJobs.id, job.id));
  }
  return updated;
}

export async function getGuestBulkJob(params: {
  session: GuestSession;
  bulkJobId: string;
}): Promise<{job: GuestBulkJob; items: GuestBulkJobItem[]}> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const [job] = await db
    .select()
    .from(guestBulkJobs)
    .where(
      and(eq(guestBulkJobs.id, params.bulkJobId), eq(guestBulkJobs.sessionId, params.session.id)),
    )
    .limit(1);
  if (!job) throw new GuestDomainError("JOB_NOT_FOUND");
  const items = await db
    .select()
    .from(guestBulkJobItems)
    .where(eq(guestBulkJobItems.bulkJobId, job.id))
    .orderBy(asc(guestBulkJobItems.sortOrder));
  return {job, items};
}

export async function processGuestBulkJob(params: {
  session: GuestSession;
  bulkJobId: string;
}): Promise<{job: GuestBulkJob; items: GuestBulkJobItem[]}> {
  if (isGuestExpired(params.session.expiresAt)) {
    throw new GuestDomainError("GUEST_SESSION_EXPIRED");
  }
  const db = getDb();
  const {job, items} = await getGuestBulkJob(params);
  const toProcess = items.filter(
    (i) => i.status === "validated" || (i.status === "failed" && Boolean(i.uploadId)),
  );
  if (!toProcess.length) throw new GuestDomainError("GUEST_BULK_NOT_READY");

  await db
    .update(guestBulkJobs)
    .set({status: "processing", startedAt: job.startedAt ?? new Date(), errorCode: null})
    .where(eq(guestBulkJobs.id, job.id));

  let skipped = 0;

  for (const item of toProcess) {
    if (!item.uploadId) {
      await db
        .update(guestBulkJobItems)
        .set({status: "skipped", errorCode: "OBJECT_NOT_FOUND", updatedAt: new Date()})
        .where(eq(guestBulkJobItems.id, item.id));
      skipped += 1;
      continue;
    }
    await db
      .update(guestBulkJobItems)
      .set({status: "processing", updatedAt: new Date()})
      .where(eq(guestBulkJobItems.id, item.id));

    try {
      const [freshSession] = await db
        .select()
        .from(guestSessions)
        .where(eq(guestSessions.id, params.session.id))
        .limit(1);
      const child = await createGuestJob({
        session: freshSession ?? params.session,
        uploadId: item.uploadId,
        operation: job.operation,
        options: job.options ?? undefined,
      });
      const publicChild = toGuestJobPublic(child);
      if (child.status === "completed") {
        await db
          .update(guestBulkJobItems)
          .set({
            status: "completed",
            childJobId: child.id,
            resultSummary: publicChild.resultSummary,
            errorCode: null,
            updatedAt: new Date(),
          })
          .where(eq(guestBulkJobItems.id, item.id));
      } else {
        await db
          .update(guestBulkJobItems)
          .set({
            status: "failed",
            childJobId: child.id,
            errorCode: child.errorCode ?? "INTERNAL_ERROR",
            updatedAt: new Date(),
          })
          .where(eq(guestBulkJobItems.id, item.id));
      }
    } catch (error) {
      const code = error instanceof GuestDomainError ? error.code : "INTERNAL_ERROR";
      await db
        .update(guestBulkJobItems)
        .set({
          status: "failed",
          errorCode: code,
          updatedAt: new Date(),
        })
        .where(eq(guestBulkJobItems.id, item.id));
      if (code === "GUEST_LIMIT_REACHED" || code === "GUEST_SESSION_EXPIRED") {
        break;
      }
    }
  }

  void skipped;

  const finalItems = await db
    .select()
    .from(guestBulkJobItems)
    .where(eq(guestBulkJobItems.bulkJobId, job.id))
    .orderBy(asc(guestBulkJobItems.sortOrder));

  const completedCount = finalItems.filter((i) => i.status === "completed").length;
  const failedCount = finalItems.filter((i) => i.status === "failed").length;
  const skippedCount = finalItems.filter((i) => i.status === "skipped").length;
  const status =
    completedCount === 0 && failedCount > 0
      ? "failed"
      : failedCount > 0 || skippedCount > 0
        ? "partial"
        : "completed";

  const [updated] = await db
    .update(guestBulkJobs)
    .set({
      status,
      completedItems: completedCount,
      failedItems: failedCount,
      skippedItems: skippedCount,
      completedAt: new Date(),
    })
    .where(eq(guestBulkJobs.id, job.id))
    .returning();

  return {job: updated ?? job, items: finalItems};
}

export async function createGuestBulkZip(params: {
  session: GuestSession;
  bulkJobId: string;
}): Promise<{url: string; expiresAt: string; bytes: number; filename: string}> {
  if (!isR2Configured()) throw new GuestDomainError("STORAGE_NOT_CONFIGURED");
  const {job, items} = await getGuestBulkJob(params);
  if (!["completed", "partial"].includes(job.status)) {
    throw new GuestDomainError("GUEST_BULK_NOT_READY");
  }

  const policy = resolveGuestBulkPolicy({authenticated: false});
  const completed = items.filter((i) => i.status === "completed" && i.childJobId);
  if (!completed.length) throw new GuestDomainError("GUEST_BULK_NOT_READY");

  const db = getDb();
  const outputs: {
    originalFilename: string;
    outputFilename: string;
    bytes: Buffer;
    meta: {
      status: string;
      operation: string;
      originalBytes: number | null;
      outputBytes: number | null;
      width: number | null;
      height: number | null;
      format: string | null;
      errorCode: string | null;
    };
  }[] = [];

  const provider = await getObjectStorageProvider();
  for (const item of completed) {
    const [child] = await db
      .select()
      .from(guestJobs)
      .where(
        and(eq(guestJobs.id, item.childJobId!), eq(guestJobs.sessionId, params.session.id)),
      )
      .limit(1);
    if (!child?.outputStorageKey || child.status !== "completed") continue;
    if (
      !assertGuestStorageKeyOwned({
        storageKey: child.outputStorageKey,
        sessionPublicId: params.session.publicId,
      })
    ) {
      continue;
    }
    const summary =
      child.resultSummary && typeof child.resultSummary === "object"
        ? (child.resultSummary as Record<string, unknown>)
        : {};
    const obj = await provider.getObjectBuffer(child.outputStorageKey, policy.maxZipBytes);
    const ext =
      typeof summary.mimeType === "string" && summary.mimeType.includes("png")
        ? "png"
        : typeof summary.mimeType === "string" && summary.mimeType.includes("webp")
          ? "webp"
          : "jpg";
    const base = (item.originalFilename || "image").replace(/\.[^.]+$/, "");
    outputs.push({
      originalFilename: item.originalFilename || "image",
      outputFilename: `${base}-bulk.${ext}`,
      bytes: obj.body,
      meta: {
        status: "completed",
        operation: job.operation,
        originalBytes: typeof summary.inputBytes === "number" ? summary.inputBytes : null,
        outputBytes: typeof summary.outputBytes === "number" ? summary.outputBytes : obj.body.length,
        width: typeof summary.width === "number" ? summary.width : null,
        height: typeof summary.height === "number" ? summary.height : null,
        format: typeof summary.mimeType === "string" ? String(summary.mimeType) : ext,
        errorCode: null,
      },
    });
  }

  if (!outputs.length) throw new GuestDomainError("GUEST_BULK_ZIP_FAILED");

  let zipBuffer: Buffer;
  try {
    zipBuffer = await buildGuestBulkArchive({
      operation: job.operation,
      outputs,
      maxBytes: policy.maxZipBytes,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "ZIP_TOO_LARGE") throw new GuestDomainError("GUEST_BULK_ZIP_TOO_LARGE");
    throw new GuestDomainError("GUEST_BULK_ZIP_FAILED");
  }

  const archiveKey = buildGuestBulkArchiveStorageKey({
    sessionPublicId: params.session.publicId,
    bulkJobId: job.id,
  });

  if (job.archiveStorageKey && job.archiveStorageKey !== archiveKey) {
    await enqueueGuestCleanup({
      storageKey: job.archiveStorageKey,
      sessionId: params.session.id,
    });
  }

  await provider.putObjectBuffer({
    storageKey: archiveKey,
    body: zipBuffer,
    contentType: "application/zip",
    maxBytes: policy.maxZipBytes,
  });

  await db
    .update(guestBulkJobs)
    .set({
      archiveStorageKey: archiveKey,
      archiveBytes: zipBuffer.length,
      archiveStatus: "ready",
    })
    .where(and(eq(guestBulkJobs.id, job.id), eq(guestBulkJobs.sessionId, params.session.id)));

  const ttl = clampGuestDownloadTtl(getR2SignedUrlTtlSeconds());
  const signed = await provider.createSignedReadUrl(archiveKey, ttl, {
    downloadFilename: `bulk-${job.toolCode}-results.zip`,
  });

  return {
    url: signed.url,
    expiresAt: signed.expiresAt.toISOString(),
    bytes: zipBuffer.length,
    filename: `bulk-${job.toolCode}-results.zip`,
  };
}

export async function enqueueGuestBulkCleanup(sessionId: string): Promise<void> {
  const db = getDb();
  const jobs = await db
    .select()
    .from(guestBulkJobs)
    .where(eq(guestBulkJobs.sessionId, sessionId))
    .orderBy(desc(guestBulkJobs.createdAt))
    .limit(50);
  for (const job of jobs) {
    if (job.archiveStorageKey) {
      await enqueueGuestCleanup({storageKey: job.archiveStorageKey, sessionId});
    }
    await db
      .update(guestBulkJobs)
      .set({
        status: "expired",
        options: {scrubbed: true},
        archiveStatus: "cleanup_pending",
      })
      .where(eq(guestBulkJobs.id, job.id));
    await db
      .update(guestBulkJobItems)
      .set({resultSummary: {scrubbed: true}, errorCode: null})
      .where(eq(guestBulkJobItems.bulkJobId, job.id));
  }
}
