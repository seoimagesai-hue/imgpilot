/**
 * Bulk processing orchestration — Prompt 15 (+ Prompt 16 queue feed).
 * Reuses createProcessingJob; worker executes (no inline Sharp).
 */
import {and, desc, eq, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {bulkJobItems, bulkJobs, images, processingJobs, type BulkJob, type BulkJobItem} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import {filterOwnedImageIds} from "@/server/images/library-queries";
import {
  BULK_MAX_CONCURRENCY,
  BULK_MAX_IMAGES,
  BULK_STALE_RUNNING_MS,
  getBulkPolicy,
  mapWithConcurrency,
} from "@/server/images/bulk-policy";
import {isResizePresetId} from "@/lib/resize-presets";
import {
  CONVERT_OPERATION,
  conversionPresetForTarget,
  isConversionTargetFormat,
  targetFromConversionPreset,
} from "@/server/images/conversion-policy";
import {PROCESSING_OPERATION} from "@/server/images/processing-policy";
import {RESIZE_OPERATION} from "@/server/images/resize-policy";
import {
  createProcessingJob,
  type ProcessingOperation,
} from "@/server/images/processing-service";
import {getOwnedProject} from "@/server/projects/queries";
import type {SafeProcessingErrorCode} from "@/server/images/processing-errors";
import {READY_STATUS} from "@/server/images/ready-eligibility";

export type SafeBulkErrorCode =
  | SafeProcessingErrorCode
  | "BULK_JOB_NOT_FOUND"
  | "BULK_JOB_CONFLICT"
  | "BULK_EMPTY_SELECTION"
  | "BULK_TOO_LARGE"
  | "BULK_MIXED_OPERATION"
  | "BULK_CANCELLED";

export type BulkJobDto = {
  id: string;
  projectId: string;
  operation: string;
  preset: string | null;
  status: string;
  totalCount: number;
  pendingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  cancelledCount: number;
  cancelRequested: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type BulkItemDto = {
  id: string;
  imageId: string;
  processingJobId: string | null;
  status: string;
  skipReason: string | null;
  lastErrorCode: string | null;
};

function toBulkDto(job: BulkJob): BulkJobDto {
  return {
    id: job.id,
    projectId: job.projectId,
    operation: job.operation,
    preset: job.preset,
    status: job.status,
    totalCount: job.totalCount,
    pendingCount: job.pendingCount,
    runningCount: job.runningCount,
    completedCount: job.completedCount,
    failedCount: job.failedCount,
    skippedCount: job.skippedCount,
    cancelledCount: job.cancelledCount,
    cancelRequested: job.cancelRequested,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

function normalizeOperationPreset(params: {
  operation?: string;
  preset?: string | null;
  targetFormat?: string | null;
}): {ok: true; operation: ProcessingOperation; preset: string | null} | {ok: false; error: SafeBulkErrorCode} {
  const operation = (params.operation ?? PROCESSING_OPERATION) as ProcessingOperation;
  if (operation === PROCESSING_OPERATION) {
    if (params.preset || params.targetFormat) return {ok: false, error: "INVALID_REQUEST"};
    return {ok: true, operation, preset: null};
  }
  if (operation === RESIZE_OPERATION) {
    if (!isResizePresetId(params.preset)) return {ok: false, error: "INVALID_REQUEST"};
    return {ok: true, operation, preset: params.preset};
  }
  if (operation === CONVERT_OPERATION) {
    const target =
      targetFromConversionPreset(params.preset) ??
      (isConversionTargetFormat(params.targetFormat)
        ? params.targetFormat
        : isConversionTargetFormat(params.preset)
          ? params.preset
          : null);
    if (!target) return {ok: false, error: "INVALID_REQUEST"};
    return {ok: true, operation, preset: conversionPresetForTarget(target)};
  }
  return {ok: false, error: "INVALID_REQUEST"};
}

function finalizeBulkStatus(job: {
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  cancelledCount: number;
  pendingCount: number;
  runningCount: number;
  totalCount: number;
  cancelRequested: boolean;
}): BulkJob["status"] {
  if (job.pendingCount > 0 || job.runningCount > 0) {
    return job.cancelRequested ? "running" : "running";
  }
  if (job.cancelRequested && job.completedCount === 0 && job.failedCount === 0) {
    return "cancelled";
  }
  if (job.failedCount === 0 && job.cancelledCount === 0 && job.completedCount + job.skippedCount === job.totalCount) {
    return job.completedCount > 0 ? "completed" : job.skippedCount > 0 ? "completed" : "failed";
  }
  if (job.completedCount > 0 && (job.failedCount > 0 || job.cancelledCount > 0)) {
    return "partially_completed";
  }
  if (job.completedCount > 0 && job.failedCount === 0) {
    return job.cancelledCount > 0 ? "partially_completed" : "completed";
  }
  if (job.failedCount > 0 && job.completedCount === 0) {
    return job.cancelledCount > 0 || job.skippedCount > 0 ? "partially_completed" : "failed";
  }
  if (job.cancelRequested) return "cancelled";
  return "failed";
}

async function recountBulkJob(bulkJobId: string, projectId: string): Promise<BulkJob | null> {
  const db = getDb();
  const items = await db
    .select({status: bulkJobItems.status})
    .from(bulkJobItems)
    .where(and(eq(bulkJobItems.bulkJobId, bulkJobId), eq(bulkJobItems.projectId, projectId)));

  const counts = {
    pendingCount: 0,
    runningCount: 0,
    completedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    cancelledCount: 0,
  };
  for (const item of items) {
    switch (item.status) {
      case "pending":
        counts.pendingCount++;
        break;
      case "running":
        counts.runningCount++;
        break;
      case "completed":
        counts.completedCount++;
        break;
      case "failed":
        counts.failedCount++;
        break;
      case "skipped":
        counts.skippedCount++;
        break;
      case "cancelled":
      case "stale":
        counts.cancelledCount++;
        break;
    }
  }

  const [current] = await db
    .select()
    .from(bulkJobs)
    .where(and(eq(bulkJobs.id, bulkJobId), eq(bulkJobs.projectId, projectId)))
    .limit(1);
  if (!current) return null;

  const status = finalizeBulkStatus({
    ...counts,
    totalCount: current.totalCount,
    cancelRequested: current.cancelRequested,
  });
  const terminal = ["completed", "partially_completed", "failed", "cancelled"].includes(status);

  const [updated] = await db
    .update(bulkJobs)
    .set({
      ...counts,
      status,
      completedAt: terminal ? (current.completedAt ?? new Date()) : current.completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(bulkJobs.id, bulkJobId), eq(bulkJobs.projectId, projectId)))
    .returning();
  return updated ?? null;
}

export async function createBulkJob(params: {
  userId: string;
  projectId: string;
  imageIds: string[];
  operation?: string;
  preset?: string | null;
  targetFormat?: string | null;
  idempotencyKey?: string;
}): Promise<
  | {ok: true; job: BulkJobDto; items: BulkItemDto[]}
  | {ok: false; error: SafeBulkErrorCode}
> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};

  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const normalized = normalizeOperationPreset(params);
  if (!normalized.ok) return normalized;

  if (params.idempotencyKey) {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(bulkJobs)
      .where(
        and(
          eq(bulkJobs.projectId, project.id),
          eq(bulkJobs.idempotencyKey, params.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing) {
      const items = await listBulkItems(existing.id, project.id);
      return {ok: true, job: toBulkDto(existing), items};
    }
  }

  if (!params.imageIds.length) return {ok: false, error: "BULK_EMPTY_SELECTION"};
  if (params.imageIds.length > BULK_MAX_IMAGES) return {ok: false, error: "BULK_TOO_LARGE"};

  const ownedIds = await filterOwnedImageIds(params.userId, project.id, params.imageIds);
  if (!ownedIds.length) return {ok: false, error: "BULK_EMPTY_SELECTION"};

  const db = getDb();
  const ownedRows = await db
    .select({
      id: images.id,
      status: images.status,
    })
    .from(images)
    .where(inArray(images.id, ownedIds));

  const readyIds: string[] = [];
  const skippedRows: {imageId: string; reason: string}[] = [];
  for (const row of ownedRows) {
    if (row.status === READY_STATUS) {
      readyIds.push(row.id);
    } else {
      skippedRows.push({imageId: row.id, reason: "IMAGE_NOT_READY"});
    }
  }

  // Never include non-owned / missing from selection as pending
  const found = new Set(ownedRows.map((r) => r.id));
  for (const id of ownedIds) {
    if (!found.has(id)) skippedRows.push({imageId: id, reason: "IMAGE_NOT_FOUND"});
  }

  if (!readyIds.length && !skippedRows.length) {
    return {ok: false, error: "BULK_EMPTY_SELECTION"};
  }

  const bulkId = crypto.randomUUID();
  const totalCount = readyIds.length + skippedRows.length;

  await db.insert(bulkJobs).values({
    id: bulkId,
    projectId: project.id,
    createdBy: params.userId,
    operation: normalized.operation,
    preset: normalized.preset,
    status: "validating",
    totalCount,
    pendingCount: readyIds.length,
    skippedCount: skippedRows.length,
    idempotencyKey: params.idempotencyKey ?? null,
  });

  const itemRows = [
    ...readyIds.map((imageId) => ({
      id: crypto.randomUUID(),
      bulkJobId: bulkId,
      projectId: project.id,
      imageId,
      status: "pending" as const,
      skipReason: null as string | null,
    })),
    ...skippedRows.map((row) => ({
      id: crypto.randomUUID(),
      bulkJobId: bulkId,
      projectId: project.id,
      imageId: row.imageId,
      status: "skipped" as const,
      skipReason: row.reason,
    })),
  ];
  await db.insert(bulkJobItems).values(itemRows);

  await db
    .update(bulkJobs)
    .set({status: "queued", updatedAt: new Date()})
    .where(eq(bulkJobs.id, bulkId));

  const [job] = await db.select().from(bulkJobs).where(eq(bulkJobs.id, bulkId)).limit(1);
  const items = await listBulkItems(bulkId, project.id);
  return {ok: true, job: toBulkDto(job!), items};
}

async function listBulkItems(bulkJobId: string, projectId: string): Promise<BulkItemDto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(bulkJobItems)
    .where(and(eq(bulkJobItems.bulkJobId, bulkJobId), eq(bulkJobItems.projectId, projectId)));
  return rows.map((row) => ({
    id: row.id,
    imageId: row.imageId,
    processingJobId: row.processingJobId,
    status: row.status,
    skipReason: row.skipReason,
    lastErrorCode: row.lastErrorCode,
  }));
}

export async function getBulkJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<
  | {ok: true; job: BulkJobDto; items: BulkItemDto[]}
  | {ok: false; error: SafeBulkErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();
  const [job] = await db
    .select()
    .from(bulkJobs)
    .where(and(eq(bulkJobs.id, params.bulkJobId), eq(bulkJobs.projectId, project.id)))
    .limit(1);
  if (!job) return {ok: false, error: "BULK_JOB_NOT_FOUND"};
  return {ok: true, job: toBulkDto(job), items: await listBulkItems(job.id, project.id)};
}

export async function listBulkJobs(params: {
  userId: string;
  projectId: string;
  limit?: number;
}): Promise<BulkJobDto[]> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(bulkJobs)
    .where(eq(bulkJobs.projectId, project.id))
    .orderBy(desc(bulkJobs.createdAt))
    .limit(params.limit ?? 20);
  return rows.map(toBulkDto);
}

async function processOneItem(params: {
  userId: string;
  projectId: string;
  bulk: BulkJob;
  item: BulkJobItem;
}): Promise<void> {
  const db = getDb();

  // Honour cancel before starting new work
  const [freshBulk] = await db
    .select()
    .from(bulkJobs)
    .where(eq(bulkJobs.id, params.bulk.id))
    .limit(1);
  if (freshBulk?.cancelRequested) {
    await db
      .update(bulkJobItems)
      .set({status: "cancelled", updatedAt: new Date()})
      .where(and(eq(bulkJobItems.id, params.item.id), eq(bulkJobItems.status, "pending")));
    return;
  }

  const [acquired] = await db
    .update(bulkJobItems)
    .set({status: "running", updatedAt: new Date()})
    .where(and(eq(bulkJobItems.id, params.item.id), eq(bulkJobItems.status, "pending")))
    .returning();
  if (!acquired) return;

  let jobId = params.item.processingJobId;

  if (!jobId) {
    const created = await createProcessingJob({
      userId: params.userId,
      projectId: params.projectId,
      imageId: params.item.imageId,
      operation: params.bulk.operation as ProcessingOperation,
      preset: params.bulk.preset,
      idempotencyKey: `bulk:${params.bulk.id}:${params.item.imageId}`,
    });

    if (!created.ok) {
      const skipStatuses: SafeProcessingErrorCode[] = [
        "IMAGE_NOT_READY",
        "IMAGE_NOT_FOUND",
        "SOURCE_FORMAT_UNSUPPORTED",
        "SOURCE_ANIMATION_UNSUPPORTED",
        "CONVERSION_UNSUPPORTED",
        "PROCESSING_JOB_CONFLICT",
      ];
      const status = skipStatuses.includes(created.error) ? "skipped" : "failed";
      await db
        .update(bulkJobItems)
        .set({
          status,
          skipReason: status === "skipped" ? created.error : null,
          lastErrorCode: created.error,
          updatedAt: new Date(),
        })
        .where(eq(bulkJobItems.id, params.item.id));
      return;
    }

    jobId = created.job.id;

    if (created.job.status === "completed") {
      await db
        .update(bulkJobItems)
        .set({
          status: "completed",
          processingJobId: jobId,
          updatedAt: new Date(),
        })
        .where(eq(bulkJobItems.id, params.item.id));
      return;
    }
  } else {
    // Retry path: ensure child job is queued for the worker (never execute inline)
    await db
      .update(processingJobs)
      .set({
        status: "queued",
        leaseOwner: null,
        leaseExpiresAt: null,
        heartbeatAt: null,
        lastErrorCode: null,
        lastErrorMessageSafe: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(processingJobs.id, jobId),
          eq(processingJobs.projectId, params.projectId),
          inArray(processingJobs.status, ["failed", "cleanup_failed", "queued"]),
        ),
      );
  }

  // Enqueue only — worker executes via Prompt 16 queue (no inline Sharp here)
  await db
    .update(bulkJobItems)
    .set({
      status: "running",
      processingJobId: jobId,
      updatedAt: new Date(),
    })
    .where(eq(bulkJobItems.id, params.item.id));
}

export async function runBulkJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<
  | {ok: true; job: BulkJobDto; items: BulkItemDto[]}
  | {ok: false; error: SafeBulkErrorCode}
> {
  if (!isR2Configured()) return {ok: false, error: "STORAGE_NOT_CONFIGURED"};
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const db = getDb();
  const [bulk] = await db
    .update(bulkJobs)
    .set({
      status: "running",
      startedAt: sql`coalesce(${bulkJobs.startedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bulkJobs.id, params.bulkJobId),
        eq(bulkJobs.projectId, project.id),
        inArray(bulkJobs.status, ["queued", "partially_completed", "failed", "running"]),
      ),
    )
    .returning();
  if (!bulk) return {ok: false, error: "BULK_JOB_CONFLICT"};

  const pending = await db
    .select()
    .from(bulkJobItems)
    .where(
      and(
        eq(bulkJobItems.bulkJobId, bulk.id),
        eq(bulkJobItems.projectId, project.id),
        eq(bulkJobItems.status, "pending"),
      ),
    );

  await mapWithConcurrency(pending, BULK_MAX_CONCURRENCY, async (item) => {
    await processOneItem({
      userId: params.userId,
      projectId: project.id,
      bulk,
      item,
    });
    // Real progress: recount after each item (no fake timers)
    await recountBulkJob(bulk.id, project.id);
  });

  const updated = await recountBulkJob(bulk.id, project.id);
  const items = await listBulkItems(bulk.id, project.id);
  return {ok: true, job: toBulkDto(updated!), items};
}

export async function cancelBulkJob(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<
  | {ok: true; job: BulkJobDto; items: BulkItemDto[]}
  | {ok: false; error: SafeBulkErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();

  const [bulk] = await db
    .update(bulkJobs)
    .set({
      cancelRequested: true,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(bulkJobs.id, params.bulkJobId), eq(bulkJobs.projectId, project.id)))
    .returning();
  if (!bulk) return {ok: false, error: "BULK_JOB_NOT_FOUND"};

  // Only pending items — running finishes normally
  await db
    .update(bulkJobItems)
    .set({status: "cancelled", updatedAt: new Date()})
    .where(
      and(
        eq(bulkJobItems.bulkJobId, bulk.id),
        eq(bulkJobItems.projectId, project.id),
        eq(bulkJobItems.status, "pending"),
      ),
    );

  const updated = await recountBulkJob(bulk.id, project.id);
  return {ok: true, job: toBulkDto(updated!), items: await listBulkItems(bulk.id, project.id)};
}

export async function retryFailedBulkItems(params: {
  userId: string;
  projectId: string;
  bulkJobId: string;
}): Promise<
  | {ok: true; job: BulkJobDto; items: BulkItemDto[]}
  | {ok: false; error: SafeBulkErrorCode}
> {
  const project = await getOwnedProject(params.userId, params.projectId, "processing.run");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};
  const db = getDb();

  const [bulk] = await db
    .select()
    .from(bulkJobs)
    .where(and(eq(bulkJobs.id, params.bulkJobId), eq(bulkJobs.projectId, project.id)))
    .limit(1);
  if (!bulk) return {ok: false, error: "BULK_JOB_NOT_FOUND"};

  const failed = await db
    .select()
    .from(bulkJobItems)
    .where(
      and(
        eq(bulkJobItems.bulkJobId, bulk.id),
        eq(bulkJobItems.projectId, project.id),
        eq(bulkJobItems.status, "failed"),
      ),
    );

  // Reset failed → pending; keep processingJobId so retry uses existing job; never touch completed
  if (failed.length) {
    await db
      .update(bulkJobItems)
      .set({
        status: "pending",
        lastErrorCode: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bulkJobItems.bulkJobId, bulk.id),
          eq(bulkJobItems.projectId, project.id),
          eq(bulkJobItems.status, "failed"),
        ),
      );
  }

  await db
    .update(bulkJobs)
    .set({
      cancelRequested: false,
      status: "queued",
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(bulkJobs.id, bulk.id));

  return runBulkJob(params);
}

/**
 * Invalidate pending bulk items when an image is deleted or replaced.
 * Running items finish normally (Prompt 12 policy); only queued/pending are touched.
 */
export async function onImageInvalidateBulkItems(params: {
  projectId: string;
  imageId: string;
  reason: "IMAGE_NOT_FOUND" | "SOURCE_REVISION_CHANGED";
}): Promise<void> {
  const db = getDb();
  const rows = await db
    .update(bulkJobItems)
    .set({
      status: params.reason === "IMAGE_NOT_FOUND" ? "cancelled" : "stale",
      lastErrorCode: params.reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bulkJobItems.projectId, params.projectId),
        eq(bulkJobItems.imageId, params.imageId),
        eq(bulkJobItems.status, "pending"),
      ),
    )
    .returning({bulkJobId: bulkJobItems.bulkJobId});

  const uniqueBulkIds = [...new Set(rows.map((r) => r.bulkJobId))];
  for (const bulkJobId of uniqueBulkIds) {
    await recountBulkJob(bulkJobId, params.projectId);
  }
}

export async function reconcileProjectBulkJobs(params: {
  projectId: string;
  dryRun?: boolean;
}): Promise<{scanned: number; findings: string[]; changed: boolean}> {
  const db = getDb();
  const jobs = await db
    .select()
    .from(bulkJobs)
    .where(eq(bulkJobs.projectId, params.projectId))
    .limit(50);
  const findings: string[] = [];
  let changed = false;

  for (const job of jobs) {
    const items = await db
      .select({status: bulkJobItems.status})
      .from(bulkJobItems)
      .where(and(eq(bulkJobItems.bulkJobId, job.id), eq(bulkJobItems.projectId, params.projectId)));

    const counts = {
      pendingCount: 0,
      runningCount: 0,
      completedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      cancelledCount: 0,
    };
    for (const item of items) {
      switch (item.status) {
        case "pending":
          counts.pendingCount++;
          break;
        case "running":
          counts.runningCount++;
          break;
        case "completed":
          counts.completedCount++;
          break;
        case "failed":
          counts.failedCount++;
          break;
        case "skipped":
          counts.skippedCount++;
          break;
        case "cancelled":
        case "stale":
          counts.cancelledCount++;
          break;
      }
    }

    const counterMismatch =
      counts.pendingCount !== job.pendingCount ||
      counts.runningCount !== job.runningCount ||
      counts.completedCount !== job.completedCount ||
      counts.failedCount !== job.failedCount ||
      counts.skippedCount !== job.skippedCount ||
      counts.cancelledCount !== job.cancelledCount ||
      items.length !== job.totalCount;

    if (counterMismatch) {
      findings.push(`incorrect_counters:${job.id.slice(0, 8)}`);
      if (!params.dryRun) {
        await recountBulkJob(job.id, params.projectId);
        changed = true;
      }
    }

    if (job.status === "running" && job.updatedAt.getTime() < Date.now() - BULK_STALE_RUNNING_MS) {
      findings.push(`abandoned_running:${job.id.slice(0, 8)}`);
      if (!params.dryRun) {
        // Stuck "running" items with no active work → failed so bulk can finalize
        await db
          .update(bulkJobItems)
          .set({
            status: "failed",
            lastErrorCode: "PROCESSING_FAILED",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bulkJobItems.bulkJobId, job.id),
              eq(bulkJobItems.projectId, params.projectId),
              eq(bulkJobItems.status, "running"),
            ),
          );
        await recountBulkJob(job.id, params.projectId);
        changed = true;
      }
    }

    if (job.status === "queued" && counts.pendingCount === 0 && counts.runningCount === 0) {
      findings.push(`stale_queued:${job.id.slice(0, 8)}`);
      if (!params.dryRun) {
        await recountBulkJob(job.id, params.projectId);
        changed = true;
      }
    }
  }

  return {scanned: jobs.length, findings, changed};
}

export async function reconcileAllProjectsBulk(params: {
  dryRun?: boolean;
  projectId?: string;
}): Promise<Array<{projectId: string; scanned: number; findings: string[]; changed: boolean}>> {
  const db = getDb();
  const projectFilter = params.projectId
    ? and(eq(bulkJobs.projectId, params.projectId))
    : undefined;
  const rows = await db
    .selectDistinct({projectId: bulkJobs.projectId})
    .from(bulkJobs)
    .where(projectFilter)
    .limit(100);

  const reports = [];
  for (const row of rows) {
    reports.push(
      await reconcileProjectBulkJobs({
        projectId: row.projectId,
        dryRun: params.dryRun,
      }),
    );
  }
  return reports.map((report, i) => ({
    projectId: rows[i].projectId,
    ...report,
  }));
}

export {getBulkPolicy, toBulkDto};

/** Used by queue worker when a child processing job finishes. */
export async function recountBulkJobByProcessingJobId(
  bulkJobId: string,
  projectId: string,
): Promise<BulkJob | null> {
  return recountBulkJob(bulkJobId, projectId);
}
