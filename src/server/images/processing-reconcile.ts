/**
 * Bounded processing-job reconciliation (dry-run capable).
 * Exact known keys only — never lists the bucket, never deletes source originals.
 */
import {and, eq, inArray, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {
  imageDerivatives,
  processingJobs,
  projectQuotaState,
  projects,
} from "@/db/schema";
import {isR2Configured} from "@/lib/env";
import {
  STALE_PROCESSING_MS,
  STALE_QUEUED_MS,
} from "@/server/images/processing-policy";
import {ACTIVE_JOB_STATUSES} from "@/server/images/processing-queries";
import {getObjectStorageProvider} from "@/server/storage/provider";
import {isValidDerivativeStorageKeyShape, isValidOriginalStorageKeyShape} from "@/server/storage/keys";

export const PROCESSING_RECONCILE_BATCH = 50;

export type ProcessingReconcileFinding = {
  kind: string;
  jobId?: string;
  derivativeId?: string;
  action: string;
};

export type ProcessingReconcileReport = {
  projectId: string;
  dryRun: boolean;
  scannedJobs: number;
  scannedDerivatives: number;
  findings: ProcessingReconcileFinding[];
  changed: boolean;
  generatedBytesBefore: number;
  generatedBytesAfter: number;
  reservedGeneratedBefore: number;
  reservedGeneratedAfter: number;
};

function isSafeDerivativeKey(key: string | null | undefined): key is string {
  return Boolean(
    key &&
      isValidDerivativeStorageKeyShape(key) &&
      !isValidOriginalStorageKeyShape(key) &&
      !key.includes("/originals/"),
  );
}

async function tryDeleteDerivativeKey(storageKey: string): Promise<boolean> {
  if (!isSafeDerivativeKey(storageKey)) return false;
  try {
    const storage = await getObjectStorageProvider();
    await storage.deleteObject(storageKey);
    const still = await storage.objectExists(storageKey);
    return !still;
  } catch {
    console.error("[processing-reconcile] derivative delete failed");
    return false;
  }
}

async function objectPresent(storageKey: string): Promise<boolean | null> {
  if (!isR2Configured()) return null;
  try {
    const storage = await getObjectStorageProvider();
    return await storage.objectExists(storageKey);
  } catch {
    return null;
  }
}

export async function reconcileProjectProcessing(params: {
  projectId: string;
  dryRun?: boolean;
}): Promise<ProcessingReconcileReport> {
  const db = getDb();
  const dryRun = Boolean(params.dryRun);
  const findings: ProcessingReconcileFinding[] = [];
  const now = Date.now();
  const queuedCutoff = new Date(now - STALE_QUEUED_MS);
  const processingCutoff = new Date(now - STALE_PROCESSING_MS);

  const [quotaBefore] = await db
    .select()
    .from(projectQuotaState)
    .where(eq(projectQuotaState.projectId, params.projectId))
    .limit(1);

  const generatedBytesBefore = quotaBefore?.generatedOutputBytes ?? 0;
  const reservedGeneratedBefore = quotaBefore?.reservedGeneratedBytes ?? 0;

  const jobs = await db
    .select()
    .from(processingJobs)
    .where(eq(processingJobs.projectId, params.projectId))
    .limit(PROCESSING_RECONCILE_BATCH);

  const derivatives = await db
    .select()
    .from(imageDerivatives)
    .where(eq(imageDerivatives.projectId, params.projectId))
    .limit(PROCESSING_RECONCILE_BATCH);

  let reservedRelease = 0;
  let generatedDelta = 0;

  for (const job of jobs) {
    const ageRef = job.updatedAt ?? job.createdAt;

    if (
      job.leaseExpiresAt &&
      job.leaseExpiresAt.getTime() < now &&
      (ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status) &&
      job.status !== "queued"
    ) {
      findings.push({
        kind: "expired_lease",
        jobId: job.id,
        action: dryRun ? "would_requeue" : "requeue",
      });
      if (!dryRun) {
        await db
          .update(processingJobs)
          .set({
            status: "queued",
            leaseOwner: null,
            leaseExpiresAt: null,
            heartbeatAt: null,
            lastErrorCode: "LEASE_EXPIRED",
            lastErrorMessageSafe: "LEASE_EXPIRED",
            updatedAt: new Date(),
          })
          .where(eq(processingJobs.id, job.id));
      }
      continue;
    }

    if (job.status === "queued" && ageRef < queuedCutoff) {
      findings.push({
        kind: "stale_queued",
        jobId: job.id,
        action: dryRun ? "would_mark_stale" : "mark_stale",
      });
      if (!dryRun) {
        await db
          .update(processingJobs)
          .set({
            status: "stale",
            failedAt: new Date(),
            lastErrorCode: "PROCESSING_JOB_STALE",
            lastErrorMessageSafe: "PROCESSING_JOB_STALE",
            updatedAt: new Date(),
          })
          .where(and(eq(processingJobs.id, job.id), eq(processingJobs.projectId, params.projectId)));
        reservedRelease += Math.min(job.sourceByteSize, job.sourceByteSize);
      }
    }

    if (
      (ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status) &&
      job.status !== "queued" &&
      ageRef < processingCutoff
    ) {
      findings.push({
        kind: "abandoned_processing",
        jobId: job.id,
        action: dryRun ? "would_mark_failed" : "mark_failed",
      });
      if (!dryRun) {
        if (isSafeDerivativeKey(job.outputStorageKey)) {
          const cleaned = await tryDeleteDerivativeKey(job.outputStorageKey);
          findings.push({
            kind: cleaned ? "failed_output_cleaned" : "cleanup_pending",
            jobId: job.id,
            action: cleaned ? "deleted_output" : "cleanup_failed",
          });
        }
        await db
          .update(processingJobs)
          .set({
            status: isSafeDerivativeKey(job.outputStorageKey) ? "cleanup_failed" : "failed",
            failedAt: new Date(),
            lastErrorCode: "PROCESSING_FAILED",
            lastErrorMessageSafe: "PROCESSING_FAILED",
            updatedAt: new Date(),
          })
          .where(and(eq(processingJobs.id, job.id), eq(processingJobs.projectId, params.projectId)));
        reservedRelease += job.sourceByteSize;
      }
    }

    if (
      (job.status === "failed" || job.status === "cleanup_failed" || job.status === "stale") &&
      isSafeDerivativeKey(job.outputStorageKey)
    ) {
      const present = await objectPresent(job.outputStorageKey);
      if (present === true) {
        findings.push({
          kind: "failed_output_present",
          jobId: job.id,
          action: dryRun ? "would_delete_output" : "delete_output",
        });
        if (!dryRun) {
          const cleaned = await tryDeleteDerivativeKey(job.outputStorageKey);
          if (cleaned) {
            await db
              .update(processingJobs)
              .set({
                outputStorageKey: null,
                status: job.status === "cleanup_failed" ? "failed" : job.status,
                cleanupCompletedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(
                and(eq(processingJobs.id, job.id), eq(processingJobs.projectId, params.projectId)),
              );
          } else {
            await db
              .update(processingJobs)
              .set({
                status: "cleanup_failed",
                cleanupStartedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(
                and(eq(processingJobs.id, job.id), eq(processingJobs.projectId, params.projectId)),
              );
          }
        }
      } else if (present === false && job.status === "cleanup_failed") {
        findings.push({
          kind: "cleanup_object_absent",
          jobId: job.id,
          action: dryRun ? "would_finalize_failed" : "finalize_failed",
        });
        if (!dryRun) {
          await db
            .update(processingJobs)
            .set({
              status: "failed",
              outputStorageKey: null,
              cleanupCompletedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(and(eq(processingJobs.id, job.id), eq(processingJobs.projectId, params.projectId)));
        }
      }
    }

    if (job.status === "completed") {
      const [deriv] = await db
        .select()
        .from(imageDerivatives)
        .where(
          and(
            eq(imageDerivatives.processingJobId, job.id),
            eq(imageDerivatives.projectId, params.projectId),
          ),
        )
        .limit(1);
      if (!deriv) {
        findings.push({
          kind: "completed_missing_derivative",
          jobId: job.id,
          action: "report_only",
        });
      }
    }
  }

  for (const deriv of derivatives) {
    if (
      (deriv.status === "cleanup_pending" || deriv.status === "cleanup_failed") &&
      isSafeDerivativeKey(deriv.storageKey)
    ) {
      const present = await objectPresent(deriv.storageKey);
      if (present === false) {
        findings.push({
          kind: "cleanup_derivative_absent",
          derivativeId: deriv.id,
          action: dryRun ? "would_mark_deleted" : "mark_deleted",
        });
        if (!dryRun) {
          await db
            .update(imageDerivatives)
            .set({status: "deleted", deletedAt: new Date(), updatedAt: new Date()})
            .where(
              and(
                eq(imageDerivatives.id, deriv.id),
                eq(imageDerivatives.projectId, params.projectId),
              ),
            );
          if (deriv.byteSize != null) generatedDelta -= deriv.byteSize;
        }
      } else if (present === true) {
        findings.push({
          kind: "cleanup_derivative_present",
          derivativeId: deriv.id,
          action: dryRun ? "would_delete_derivative" : "delete_derivative",
        });
        if (!dryRun) {
          const cleaned = await tryDeleteDerivativeKey(deriv.storageKey);
          if (cleaned) {
            await db
              .update(imageDerivatives)
              .set({status: "deleted", deletedAt: new Date(), updatedAt: new Date()})
              .where(
                and(
                  eq(imageDerivatives.id, deriv.id),
                  eq(imageDerivatives.projectId, params.projectId),
                ),
              );
            if (deriv.byteSize != null) generatedDelta -= deriv.byteSize;
          } else {
            await db
              .update(imageDerivatives)
              .set({status: "cleanup_failed", updatedAt: new Date()})
              .where(
                and(
                  eq(imageDerivatives.id, deriv.id),
                  eq(imageDerivatives.projectId, params.projectId),
                ),
              );
          }
        }
      }
    }

    if (deriv.status === "active") {
      const [job] = await db
        .select()
        .from(processingJobs)
        .where(
          and(
            eq(processingJobs.id, deriv.processingJobId),
            eq(processingJobs.projectId, params.projectId),
          ),
        )
        .limit(1);
      if (!job || job.status !== "completed") {
        findings.push({
          kind: "active_derivative_job_mismatch",
          derivativeId: deriv.id,
          jobId: job?.id,
          action: "report_only",
        });
      }
      if (job && job.sourceStorageKey !== deriv.sourceStorageKey) {
        findings.push({
          kind: "derivative_wrong_source_revision",
          derivativeId: deriv.id,
          jobId: job.id,
          action: dryRun ? "would_mark_stale" : "mark_stale",
        });
        if (!dryRun) {
          await db
            .update(imageDerivatives)
            .set({status: "stale", updatedAt: new Date()})
            .where(
              and(
                eq(imageDerivatives.id, deriv.id),
                eq(imageDerivatives.projectId, params.projectId),
              ),
            );
        }
      }
    }
  }

  // Duplicate active jobs per image (report; do not auto-cancel unless dry-run false and clearly stale)
  const activeJobs = jobs.filter((j) =>
    (ACTIVE_JOB_STATUSES as readonly string[]).includes(j.status),
  );
  const byImage = new Map<string, string[]>();
  for (const j of activeJobs) {
    const list = byImage.get(j.imageId) ?? [];
    list.push(j.id);
    byImage.set(j.imageId, list);
  }
  for (const [imageId, ids] of byImage) {
    if (ids.length > 1) {
      findings.push({
        kind: "duplicate_active_jobs",
        jobId: ids[0],
        action: `report_only count=${ids.length} image=${imageId.slice(0, 8)}`,
      });
    }
  }

  // Recompute generated bytes from known active + cleanup_pending + cleanup_failed derivatives
  const accounted = await db
    .select({
      total: sql<number>`coalesce(sum(${imageDerivatives.byteSize}), 0)::bigint`,
    })
    .from(imageDerivatives)
    .where(
      and(
        eq(imageDerivatives.projectId, params.projectId),
        inArray(imageDerivatives.status, ["active", "cleanup_pending", "cleanup_failed"]),
      ),
    );
  const computedGenerated = Number(accounted[0]?.total ?? 0);

  const queuedReserved = jobs
    .filter((j) => (ACTIVE_JOB_STATUSES as readonly string[]).includes(j.status))
    .reduce((sum, j) => sum + j.sourceByteSize, 0);

  const generatedBytesAfter = dryRun ? generatedBytesBefore : computedGenerated;
  const reservedGeneratedAfter = dryRun
    ? reservedGeneratedBefore
    : Math.max(0, queuedReserved);

  if (!dryRun) {
    if (reservedRelease > 0 || generatedDelta !== 0) {
      // Absolute reconcile for generated counters from source-of-truth derivatives + active jobs
      await db
        .update(projectQuotaState)
        .set({
          generatedOutputBytes: computedGenerated,
          reservedGeneratedBytes: Math.max(0, queuedReserved),
          updatedAt: new Date(),
          quotaVersion: sql`${projectQuotaState.quotaVersion} + 1`,
        })
        .where(eq(projectQuotaState.projectId, params.projectId));
    } else if (
      generatedBytesBefore !== computedGenerated ||
      reservedGeneratedBefore !== queuedReserved
    ) {
      findings.push({
        kind: "generated_quota_drift",
        action: "reconcile_counters",
      });
      await db
        .update(projectQuotaState)
        .set({
          generatedOutputBytes: computedGenerated,
          reservedGeneratedBytes: Math.max(0, queuedReserved),
          updatedAt: new Date(),
          quotaVersion: sql`${projectQuotaState.quotaVersion} + 1`,
        })
        .where(eq(projectQuotaState.projectId, params.projectId));
    }
  } else if (
    generatedBytesBefore !== computedGenerated ||
    reservedGeneratedBefore !== queuedReserved
  ) {
    findings.push({
      kind: "generated_quota_drift",
      action: "would_reconcile_counters",
    });
  }

  return {
    projectId: params.projectId,
    dryRun,
    scannedJobs: jobs.length,
    scannedDerivatives: derivatives.length,
    findings,
    changed: findings.some((f) => f.action !== "report_only" && !f.action.startsWith("would_")),
    generatedBytesBefore,
    generatedBytesAfter,
    reservedGeneratedBefore,
    reservedGeneratedAfter,
  };
}

export async function reconcileAllProjectsProcessing(params: {
  dryRun?: boolean;
  projectId?: string;
}): Promise<ProcessingReconcileReport[]> {
  const db = getDb();
  let projectIds: string[];
  if (params.projectId) {
    projectIds = [params.projectId];
  } else {
    const rows = await db
      .select({id: projects.id})
      .from(projects)
      .limit(PROCESSING_RECONCILE_BATCH);
    projectIds = rows.map((r) => r.id);
  }

  const reports: ProcessingReconcileReport[] = [];
  for (const projectId of projectIds) {
    reports.push(await reconcileProjectProcessing({projectId, dryRun: params.dryRun}));
  }
  return reports;
}
