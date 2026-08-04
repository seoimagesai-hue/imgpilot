/**
 * Ready-for-processing service — evaluate, promote, demote, reconcile, summary.
 * Does not start processing queues or workers.
 */
import {and, eq, sql, inArray} from "drizzle-orm";
import {getDb} from "@/db";
import {imageDerivatives, images, processingJobs, projects, projectQuotaState} from "@/db/schema";
import {getOwnedProject} from "@/server/projects/queries";
import {
  evaluateReadyEligibility,
  READY_STATUS,
  type ReadyIneligibilityReason,
} from "@/server/images/ready-eligibility";
import {
  demoteInvalidReady,
  demoteReadyToValidated,
  getOwnedImageForReady,
  imageHasOpenReplacement,
  listReadyImagesForReconcile,
  listValidatedCandidatesForReady,
  markImageReadyForProcessing,
} from "@/server/images/ready-queries";
import {getOwnedProjectQuotaUsage} from "@/server/images/quota-service";
import {ACTIVE_JOB_STATUSES} from "@/server/images/processing-queries";

const RECONCILE_BATCH_LIMIT = 200;

export type ReadySummaryDto = {
  readyImageCount: number;
  validatedImageCount: number;
  activeImageCount: number;
  deletedCount: number;
  uploadingCount: number;
  validationFailedCount: number;
  /** Active processing jobs (queued/processing/uploading/verifying). */
  processingCount: number;
  /** Active optimized derivatives. */
  optimizedDerivativeCount: number;
  /** Active resized derivatives. */
  resizeDerivativeCount: number;
  /** Active converted-format derivatives. */
  convertedDerivativeCount: number;
  /** Failed processing jobs. */
  failedCount: number;
  storageEffectiveBytes: number | null;
  reservedUploadBytes: number | null;
  cleanupPendingBytes: number | null;
  generatedOutputBytes: number | null;
};

export type EvaluateReadyResult =
  | {ok: true; status: "ready_for_processing"; promoted: boolean}
  | {ok: true; status: "validated"; reason: ReadyIneligibilityReason}
  | {ok: true; status: string; unchanged: true}
  | {ok: false; error: "PROJECT_NOT_FOUND" | "IMAGE_NOT_FOUND"};

/**
 * After successful validation (or on demand): promote to Ready if eligible.
 */
export async function evaluateAndPromoteReady(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<EvaluateReadyResult> {
  const project = await getOwnedProject(params.userId, params.projectId, "projects.view");
  if (!project) return {ok: false, error: "PROJECT_NOT_FOUND"};

  const image = await getOwnedImageForReady(params.userId, project.id, params.imageId);
  if (!image) return {ok: false, error: "IMAGE_NOT_FOUND"};

  if (image.status === READY_STATUS) {
    const open = await imageHasOpenReplacement(image.id, project.id);
    const check = evaluateReadyEligibility({
      ...image,
      hasOpenReplacement: open,
      projectExists: true,
      ownerExists: true,
    });
    if (!check.eligible) {
      await demoteInvalidReady(image.id, project.id);
      return {ok: true, status: "validated", reason: check.reason};
    }
    return {ok: true, status: READY_STATUS, promoted: false};
  }

  if (image.status !== "validated") {
    return {ok: true, status: image.status, unchanged: true};
  }

  const open = await imageHasOpenReplacement(image.id, project.id);
  const check = evaluateReadyEligibility({
    ...image,
    hasOpenReplacement: open,
    projectExists: true,
    ownerExists: true,
  });

  if (!check.eligible) {
    return {ok: true, status: "validated", reason: check.reason};
  }

  const promoted = await markImageReadyForProcessing(image.id, project.id);
  if (!promoted) {
    // Concurrent status change
    const again = await getOwnedImageForReady(params.userId, project.id, params.imageId);
    if (again?.status === READY_STATUS) {
      return {ok: true, status: READY_STATUS, promoted: false};
    }
    return {ok: true, status: "validated", reason: "wrong_status"};
  }

  return {ok: true, status: READY_STATUS, promoted: true};
}

/** Called when replacement begins — Ready must leave until promotion completes. */
export async function onReplacementStartedDemoteReady(params: {
  projectId: string;
  imageId: string;
}): Promise<void> {
  await demoteReadyToValidated(params.imageId, params.projectId);
}

/** After successful promotion, re-evaluate Ready. */
export async function onReplacementPromotedEvaluateReady(params: {
  userId: string;
  projectId: string;
  imageId: string;
}): Promise<void> {
  await evaluateAndPromoteReady(params).catch((error) => {
    console.error(
      "[ready] post-promotion evaluate failed",
      error instanceof Error ? error.message : "unknown",
    );
  });
}

export async function getOwnedProjectReadySummary(
  userId: string,
  projectId: string,
): Promise<ReadySummaryDto | null> {
  const project = await getOwnedProject(userId, projectId, "projects.view");
  if (!project) return null;

  const db = getDb();
  const rows = await db
    .select({
      status: images.status,
      count: sql<number>`count(*)::int`,
    })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.projectId, project.id), eq(projects.userId, userId)))
    .groupBy(images.status);

  let readyImageCount = 0;
  let validatedImageCount = 0;
  let activeImageCount = 0;
  let deletedCount = 0;
  let uploadingCount = 0;
  let validationFailedCount = 0;

  for (const row of rows) {
    const n = Number(row.count);
    switch (row.status) {
      case READY_STATUS:
        readyImageCount = n;
        activeImageCount += n;
        break;
      case "validated":
        validatedImageCount = n;
        activeImageCount += n;
        break;
      case "validating":
        activeImageCount += n;
        break;
      case "validation_failed":
        validationFailedCount = n;
        activeImageCount += n;
        break;
      case "uploaded":
      case "pending_upload":
        uploadingCount += n;
        activeImageCount += n;
        break;
      case "deleted":
        deletedCount = n;
        break;
      default:
        break;
    }
  }

  const quota = await getOwnedProjectQuotaUsage(userId, project.id);

  const [activeJobs] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(processingJobs)
    .where(
      and(
        eq(processingJobs.projectId, project.id),
        inArray(processingJobs.status, [...ACTIVE_JOB_STATUSES]),
      ),
    );
  const [failedJobs] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(processingJobs)
    .where(
      and(eq(processingJobs.projectId, project.id), eq(processingJobs.status, "failed")),
    );
  const [optimized] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(imageDerivatives)
    .where(
      and(
        eq(imageDerivatives.projectId, project.id),
        eq(imageDerivatives.status, "active"),
        eq(imageDerivatives.kind, "optimized_same_format"),
      ),
    );
  const [resized] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(imageDerivatives)
    .where(
      and(
        eq(imageDerivatives.projectId, project.id),
        eq(imageDerivatives.status, "active"),
        eq(imageDerivatives.kind, "resized"),
      ),
    );
  const [converted] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(imageDerivatives)
    .where(
      and(
        eq(imageDerivatives.projectId, project.id),
        eq(imageDerivatives.status, "active"),
        eq(imageDerivatives.kind, "converted"),
      ),
    );
  const [genQuota] = await db
    .select({bytes: projectQuotaState.generatedOutputBytes})
    .from(projectQuotaState)
    .where(eq(projectQuotaState.projectId, project.id))
    .limit(1);

  return {
    readyImageCount,
    validatedImageCount,
    activeImageCount,
    deletedCount,
    uploadingCount,
    validationFailedCount,
    processingCount: Number(activeJobs?.count ?? 0),
    optimizedDerivativeCount: Number(optimized?.count ?? 0),
    resizeDerivativeCount: Number(resized?.count ?? 0),
    convertedDerivativeCount: Number(converted?.count ?? 0),
    failedCount: Number(failedJobs?.count ?? 0),
    storageEffectiveBytes: quota?.effectiveUsageBytes ?? null,
    reservedUploadBytes: quota?.reservedUploadBytes ?? null,
    cleanupPendingBytes: quota?.cleanupPendingBytes ?? null,
    generatedOutputBytes: genQuota?.bytes ?? 0,
  };
}

export type ReadyReconcileReport = {
  projectId: string;
  dryRun: boolean;
  promoted: number;
  demoted: number;
  scannedValidated: number;
  scannedReady: number;
  actions: string[];
};

export async function reconcileProjectReady(params: {
  userId?: string;
  projectId: string;
  dryRun?: boolean;
}): Promise<ReadyReconcileReport | {ok: false; error: "PROJECT_NOT_FOUND"}> {
  const db = getDb();
  let ownerId = params.userId;
  if (!ownerId) {
    const [proj] = await db
      .select({userId: projects.userId})
      .from(projects)
      .where(eq(projects.id, params.projectId))
      .limit(1);
    if (!proj) return {ok: false, error: "PROJECT_NOT_FOUND"};
    ownerId = proj.userId;
  } else {
    const owned = await getOwnedProject(ownerId, params.projectId, "projects.view");
    if (!owned) return {ok: false, error: "PROJECT_NOT_FOUND"};
  }

  const dryRun = Boolean(params.dryRun);
  const actions: string[] = [];
  let promoted = 0;
  let demoted = 0;

  const validated = await listValidatedCandidatesForReady(params.projectId, RECONCILE_BATCH_LIMIT);
  for (const image of validated) {
    const open = await imageHasOpenReplacement(image.id, params.projectId);
    const check = evaluateReadyEligibility({
      ...image,
      hasOpenReplacement: open,
      projectExists: true,
      ownerExists: true,
    });
    if (check.eligible) {
      actions.push(`promote:${image.id.slice(0, 8)}`);
      if (!dryRun) {
        const row = await markImageReadyForProcessing(image.id, params.projectId);
        if (row) promoted += 1;
      } else {
        promoted += 1;
      }
    }
  }

  const readyRows = await listReadyImagesForReconcile(params.projectId, RECONCILE_BATCH_LIMIT);
  for (const image of readyRows) {
    const open = await imageHasOpenReplacement(image.id, params.projectId);
    const check = evaluateReadyEligibility({
      ...image,
      hasOpenReplacement: open,
      projectExists: true,
      ownerExists: true,
    });
    if (!check.eligible) {
      actions.push(`demote:${image.id.slice(0, 8)}:${check.reason}`);
      if (!dryRun) {
        const row = await demoteInvalidReady(image.id, params.projectId);
        if (row) demoted += 1;
      } else {
        demoted += 1;
      }
    }
  }

  return {
    projectId: params.projectId,
    dryRun,
    promoted,
    demoted,
    scannedValidated: validated.length,
    scannedReady: readyRows.length,
    actions: actions.slice(0, 50),
  };
}

export async function reconcileAllProjectsReady(params: {
  dryRun?: boolean;
  projectId?: string;
}): Promise<ReadyReconcileReport[]> {
  const db = getDb();
  let projectIds: string[];
  if (params.projectId) {
    projectIds = [params.projectId];
  } else {
    const rows = await db.select({id: projects.id}).from(projects).limit(RECONCILE_BATCH_LIMIT);
    projectIds = rows.map((r) => r.id);
  }

  const reports: ReadyReconcileReport[] = [];
  for (const projectId of projectIds) {
    const report = await reconcileProjectReady({projectId, dryRun: params.dryRun});
    if ("ok" in report && report.ok === false) continue;
    reports.push(report as ReadyReconcileReport);
  }
  return reports;
}
