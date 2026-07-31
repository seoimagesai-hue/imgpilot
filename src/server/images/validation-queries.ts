import {and, eq, getTableColumns, isNull, lt, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {images, projects, type Image} from "@/db/schema";
import type {TrustedImageInspection} from "@/server/images/image-inspector";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";
import {
  IMAGE_VALIDATION_VERSION,
  STALE_VALIDATING_MS,
} from "@/server/images/validation-policy";

export type ValidationAcquireResult =
  | {kind: "acquired"; image: Image; attempt: number}
  | {kind: "idempotent"; image: Image}
  | {kind: "in_progress"; image: Image}
  | {kind: "not_found"}
  | {kind: "not_ready"; image: Image}
  | {kind: "deleted"};

async function getOwnedImageRow(
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

/**
 * Conditionally acquire validation: uploaded | validation_failed | stale validating → validating.
 * Already validated → idempotent. Fresh validating → in_progress.
 */
export async function acquireImageValidation(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<ValidationAcquireResult> {
  const current = await getOwnedImageRow(userId, projectId, imageId);
  if (!current) return {kind: "not_found"};
  if (current.deletedAt || isDeletionUnavailableStatus(current.status)) return {kind: "deleted"};

  if (current.status === "validated" || current.status === "ready_for_processing") {
    return {kind: "idempotent", image: current};
  }

  const staleBefore = new Date(Date.now() - STALE_VALIDATING_MS);
  if (current.status === "validating") {
    const last = current.lastValidationAttemptAt;
    const isStale = !last || last.getTime() < staleBefore.getTime();
    if (!isStale) {
      return {kind: "in_progress", image: current};
    }
  }

  if (
    current.status !== "uploaded" &&
    current.status !== "validation_failed" &&
    current.status !== "validating"
  ) {
    return {kind: "not_ready", image: current};
  }

  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "validating",
      failureCode: null,
      failureMessage: null,
      validationAttempts: sql`${images.validationAttempts} + 1`,
      lastValidationAttemptAt: now,
      updatedAt: now,
      detectedFormat: null,
      detectedMimeType: null,
      width: null,
      height: null,
      pixelCount: null,
      isAnimated: null,
      frameCount: null,
      orientation: null,
      hasAlpha: null,
      colourSpace: null,
      validatedAt: null,
      validationVersion: null,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        or(
          eq(images.status, "uploaded"),
          eq(images.status, "validation_failed"),
          and(
            eq(images.status, "validating"),
            or(isNull(images.lastValidationAttemptAt), lt(images.lastValidationAttemptAt, staleBefore)),
          ),
        ),
      ),
    )
    .returning();

  if (!updated) {
    const again = await getOwnedImageRow(userId, projectId, imageId);
    if (!again) return {kind: "not_found"};
    if (again.status === "validated" || again.status === "ready_for_processing") {
      return {kind: "idempotent", image: again};
    }
    if (again.status === "validating") return {kind: "in_progress", image: again};
    return {kind: "not_ready", image: again};
  }

  return {kind: "acquired", image: updated, attempt: updated.validationAttempts};
}

export async function markImageValidated(
  imageId: string,
  projectId: string,
  inspection: TrustedImageInspection,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "validated",
      detectedFormat: inspection.format,
      detectedMimeType: inspection.mimeType,
      width: inspection.width,
      height: inspection.height,
      pixelCount: inspection.pixelCount,
      isAnimated: inspection.isAnimated,
      frameCount: inspection.frameCount,
      orientation: inspection.orientation,
      hasAlpha: inspection.hasAlpha,
      colourSpace: inspection.colourSpace,
      validatedAt: now,
      validationVersion: IMAGE_VALIDATION_VERSION,
      failureCode: null,
      failureMessage: null,
      updatedAt: now,
    })
    .where(and(eq(images.id, imageId), eq(images.projectId, projectId), eq(images.status, "validating")))
    .returning();
  return updated ?? null;
}

export async function markImageValidationFailed(
  imageId: string,
  projectId: string,
  failureCode: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "validation_failed",
      failureCode,
      failureMessage: null,
      updatedAt: now,
      lastValidationAttemptAt: now,
    })
    .where(and(eq(images.id, imageId), eq(images.projectId, projectId), eq(images.status, "validating")))
    .returning();
  return updated ?? null;
}
