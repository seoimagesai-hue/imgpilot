/**
 * DB helpers for processing jobs and derivatives.
 */
import {and, eq, getTableColumns, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageDerivatives,
  images,
  processingJobs,
  projects,
  type Image,
  type ImageDerivative,
  type ProcessingJob,
} from "@/db/schema";

export const ACTIVE_JOB_STATUSES = [
  "queued",
  "processing",
  "uploading_output",
  "verifying_output",
] as const;

export const RETRYABLE_JOB_STATUSES = ["failed", "cleanup_failed"] as const;

export async function getOwnedImageForProcessing(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<Image | null> {
  const db = getDb();
  const [row] = await db
    .select(getTableColumns(images))
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(eq(images.id, imageId), eq(images.projectId, projectId), eq(projects.userId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getOwnedProcessingJob(
  userId: string,
  projectId: string,
  jobId: string,
): Promise<ProcessingJob | null> {
  const db = getDb();
  const [row] = await db
    .select(getTableColumns(processingJobs))
    .from(processingJobs)
    .innerJoin(projects, eq(processingJobs.projectId, projects.id))
    .where(
      and(
        eq(processingJobs.id, jobId),
        eq(processingJobs.projectId, projectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findJobByIdempotencyKey(
  projectId: string,
  idempotencyKey: string,
): Promise<ProcessingJob | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(processingJobs)
    .where(
      and(eq(processingJobs.projectId, projectId), eq(processingJobs.idempotencyKey, idempotencyKey)),
    )
    .limit(1);
  return row ?? null;
}

export async function findActiveJobForImage(
  imageId: string,
  projectId: string,
  options?: {
    operation?: "optimize_same_format" | "resize" | "convert_format" | "generate_metadata";
    preset?: string | null;
  },
): Promise<ProcessingJob | null> {
  const db = getDb();
  const conditions = [
    eq(processingJobs.imageId, imageId),
    eq(processingJobs.projectId, projectId),
    inArray(processingJobs.status, [...ACTIVE_JOB_STATUSES]),
  ];
  if (options?.operation) {
    conditions.push(eq(processingJobs.operation, options.operation));
  }
  if (options && "preset" in options) {
    if (options.preset == null) {
      conditions.push(sql`${processingJobs.preset} is null`);
    } else {
      conditions.push(eq(processingJobs.preset, options.preset));
    }
  }
  const [row] = await db
    .select()
    .from(processingJobs)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function insertProcessingJob(
  values: typeof processingJobs.$inferInsert,
): Promise<ProcessingJob> {
  const db = getDb();
  const [row] = await db.insert(processingJobs).values(values).returning();
  if (!row) throw new Error("Failed to insert processing job");
  return row;
}

export async function acquireQueuedJob(
  jobId: string,
  projectId: string,
  workerId?: string,
): Promise<ProcessingJob | null> {
  const db = getDb();
  const now = new Date();
  const leaseExpiresAt = workerId
    ? new Date(now.getTime() + 60_000)
    : null;
  const [row] = await db
    .update(processingJobs)
    .set({
      status: "processing",
      attemptCount: sql`${processingJobs.attemptCount} + 1`,
      startedAt: now,
      updatedAt: now,
      lastErrorCode: null,
      lastErrorMessageSafe: null,
      leaseOwner: workerId ?? null,
      leaseExpiresAt,
      heartbeatAt: workerId ? now : null,
    })
    .where(
      and(
        eq(processingJobs.id, jobId),
        eq(processingJobs.projectId, projectId),
        inArray(processingJobs.status, ["queued", "failed"]),
      ),
    )
    .returning();
  return row ?? null;
}

export async function updateProcessingJob(
  jobId: string,
  projectId: string,
  patch: Partial<typeof processingJobs.$inferInsert>,
): Promise<ProcessingJob | null> {
  const db = getDb();
  const [row] = await db
    .update(processingJobs)
    .set({...patch, updatedAt: new Date()})
    .where(and(eq(processingJobs.id, jobId), eq(processingJobs.projectId, projectId)))
    .returning();
  return row ?? null;
}

export async function insertDerivative(
  values: typeof imageDerivatives.$inferInsert,
): Promise<ImageDerivative> {
  const db = getDb();
  const [row] = await db.insert(imageDerivatives).values(values).returning();
  if (!row) throw new Error("Failed to insert derivative");
  return row;
}

export async function updateDerivative(
  derivativeId: string,
  projectId: string,
  patch: Partial<typeof imageDerivatives.$inferInsert>,
): Promise<ImageDerivative | null> {
  const db = getDb();
  const [row] = await db
    .update(imageDerivatives)
    .set({...patch, updatedAt: new Date()})
    .where(and(eq(imageDerivatives.id, derivativeId), eq(imageDerivatives.projectId, projectId)))
    .returning();
  return row ?? null;
}

export async function getActiveDerivativeForImage(
  imageId: string,
  projectId: string,
  options?: {
    kind?: "optimized_same_format" | "resized" | "converted";
    preset?: string | null;
  },
): Promise<ImageDerivative | null> {
  const db = getDb();
  const conditions = [
    eq(imageDerivatives.imageId, imageId),
    eq(imageDerivatives.projectId, projectId),
    eq(imageDerivatives.status, "active"),
  ];
  if (options?.kind) {
    conditions.push(eq(imageDerivatives.kind, options.kind));
  }
  if (options && "preset" in options) {
    if (options.preset == null) {
      conditions.push(sql`${imageDerivatives.preset} is null`);
    } else {
      conditions.push(eq(imageDerivatives.preset, options.preset));
    }
  }
  const [row] = await db
    .select()
    .from(imageDerivatives)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function listJobsForImage(
  imageId: string,
  projectId: string,
): Promise<ProcessingJob[]> {
  const db = getDb();
  return db
    .select()
    .from(processingJobs)
    .where(and(eq(processingJobs.imageId, imageId), eq(processingJobs.projectId, projectId)))
    .orderBy(sql`${processingJobs.createdAt} desc`)
    .limit(40);
}

export async function getDerivativeForJob(
  jobId: string,
  projectId: string,
): Promise<ImageDerivative | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(imageDerivatives)
    .where(
      and(eq(imageDerivatives.processingJobId, jobId), eq(imageDerivatives.projectId, projectId)),
    )
    .limit(1);
  return row ?? null;
}

export async function markActiveJobsStaleForImage(
  imageId: string,
  projectId: string,
  reasonCode: string,
): Promise<number> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .update(processingJobs)
    .set({
      status: "stale",
      failedAt: now,
      updatedAt: now,
      lastErrorCode: reasonCode,
      lastErrorMessageSafe: reasonCode,
    })
    .where(
      and(
        eq(processingJobs.imageId, imageId),
        eq(processingJobs.projectId, projectId),
        inArray(processingJobs.status, [...ACTIVE_JOB_STATUSES, "queued"]),
      ),
    )
    .returning({id: processingJobs.id});
  return rows.length;
}

export async function markDerivativesStaleForImage(
  imageId: string,
  projectId: string,
): Promise<number> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .update(imageDerivatives)
    .set({status: "stale", updatedAt: now})
    .where(
      and(
        eq(imageDerivatives.imageId, imageId),
        eq(imageDerivatives.projectId, projectId),
        eq(imageDerivatives.status, "active"),
      ),
    )
    .returning({id: imageDerivatives.id});
  return rows.length;
}

export async function listActiveDerivativesForImage(
  imageId: string,
  projectId: string,
): Promise<ImageDerivative[]> {
  const db = getDb();
  return db
    .select()
    .from(imageDerivatives)
    .where(
      and(
        eq(imageDerivatives.imageId, imageId),
        eq(imageDerivatives.projectId, projectId),
        inArray(imageDerivatives.status, ["active", "cleanup_pending", "cleanup_failed"]),
      ),
    );
}
