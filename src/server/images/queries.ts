import {and, asc, desc, eq, gt, isNull, notInArray, or, sql} from "drizzle-orm";
import {getDb} from "@/db";
import {images, projects, type Image, type NewImage} from "@/db/schema";
import {DELETION_UNAVAILABLE_STATUSES} from "@/server/images/lifecycle-errors";
import {IMAGE_LIST_LIMIT, type ImageStatusFilter} from "./validation";

const imageColumns = {
  id: images.id,
  projectId: images.projectId,
  originalFilename: images.originalFilename,
  storageKey: images.storageKey,
  storageProvider: images.storageProvider,
  mimeType: images.mimeType,
  fileExtension: images.fileExtension,
  sizeBytes: images.sizeBytes,
  width: images.width,
  height: images.height,
  status: images.status,
  failureCode: images.failureCode,
  failureMessage: images.failureMessage,
  uploadExpiresAt: images.uploadExpiresAt,
  confirmedAt: images.confirmedAt,
  etag: images.etag,
  storageSizeBytes: images.storageSizeBytes,
  storageContentType: images.storageContentType,
  uploadedAt: images.uploadedAt,
  detectedFormat: images.detectedFormat,
  detectedMimeType: images.detectedMimeType,
  pixelCount: images.pixelCount,
  isAnimated: images.isAnimated,
  frameCount: images.frameCount,
  orientation: images.orientation,
  hasAlpha: images.hasAlpha,
  colourSpace: images.colourSpace,
  validatedAt: images.validatedAt,
  validationVersion: images.validationVersion,
  validationAttempts: images.validationAttempts,
  lastValidationAttemptAt: images.lastValidationAttemptAt,
  deletionRequestedAt: images.deletionRequestedAt,
  deletionStartedAt: images.deletionStartedAt,
  storageDeletedAt: images.storageDeletedAt,
  deletionAttempts: images.deletionAttempts,
  deletionFailureCode: images.deletionFailureCode,
  deletedBy: images.deletedBy,
  replacedAt: images.replacedAt,
  createdAt: images.createdAt,
  updatedAt: images.updatedAt,
  deletedAt: images.deletedAt,
} as const;

function notSoftDeleted() {
  return isNull(images.deletedAt);
}

function notDeletionUnavailable() {
  return notInArray(images.status, [...DELETION_UNAVAILABLE_STATUSES]);
}

/** Active pending uploads that have not expired. */
function pendingNotExpired() {
  return and(
    eq(images.status, "pending_upload"),
    or(isNull(images.uploadExpiresAt), gt(images.uploadExpiresAt, new Date())),
  );
}

function statusCondition(status: ImageStatusFilter) {
  if (status === "validated") return eq(images.status, "validated");
  if (status === "validating") return eq(images.status, "validating");
  if (status === "uploaded") return eq(images.status, "uploaded");
  if (status === "validation_failed") return eq(images.status, "validation_failed");
  if (status === "pending_upload") return pendingNotExpired()!;
  if (status === "upload_failed") return eq(images.status, "upload_failed");
  // all: hide expired pending; include validation lifecycle
  return or(
    eq(images.status, "validated"),
    eq(images.status, "validating"),
    eq(images.status, "uploaded"),
    eq(images.status, "validation_failed"),
    eq(images.status, "upload_failed"),
    pendingNotExpired(),
  )!;
}

/**
 * Owner-scoped image list. Soft-deleted rows excluded.
 * Default `validated` filter shows only trusted images.
 */
export async function listImagesForOwnedProject(
  userId: string,
  projectId: string,
  options?: {status?: ImageStatusFilter; limit?: number; offset?: number},
): Promise<Image[]> {
  const db = getDb();
  const limit = options?.limit ?? IMAGE_LIST_LIMIT;
  const offset = options?.offset ?? 0;
  const status = options?.status ?? "validated";

  return db
    .select(imageColumns)
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(
        eq(images.projectId, projectId),
        eq(projects.userId, userId),
        notSoftDeleted(),
        notDeletionUnavailable(),
        statusCondition(status),
      ),
    )
    .orderBy(desc(images.createdAt), asc(images.id))
    .limit(limit)
    .offset(offset);
}

export async function countImagesForOwnedProject(
  userId: string,
  projectId: string,
  options?: {status?: ImageStatusFilter; includeDeleted?: boolean},
): Promise<number> {
  const db = getDb();
  const status = options?.status ?? "validated";
  const conditions = [eq(images.projectId, projectId), eq(projects.userId, userId)];

  if (!options?.includeDeleted) {
    conditions.push(notSoftDeleted());
    conditions.push(notDeletionUnavailable());
  }
  conditions.push(statusCondition(status));

  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(...conditions));

  return row?.count ?? 0;
}

export async function getImageForOwnedProject(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<Image | null> {
  const db = getDb();
  const [row] = await db
    .select(imageColumns)
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        eq(projects.userId, userId),
        notSoftDeleted(),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertPendingImage(values: NewImage): Promise<Image> {
  const db = getDb();
  const [created] = await db.insert(images).values(values).returning();
  if (!created) throw new Error("createFailed");
  return created;
}

export async function markImageUploaded(
  imageId: string,
  projectId: string,
  meta: {
    etag?: string;
    storageSizeBytes: number;
    storageContentType?: string;
  },
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(images)
    .set({
      status: "uploaded",
      etag: meta.etag,
      storageSizeBytes: meta.storageSizeBytes,
      storageContentType: meta.storageContentType,
      confirmedAt: now,
      uploadedAt: now,
      failureCode: null,
      failureMessage: null,
      updatedAt: now,
    })
    .where(and(eq(images.id, imageId), eq(images.projectId, projectId)))
    .returning();
  return updated ?? null;
}

export async function markImageUploadFailed(
  imageId: string,
  projectId: string,
  failureCode: string,
): Promise<Image | null> {
  const db = getDb();
  const [updated] = await db
    .update(images)
    .set({
      status: "upload_failed",
      failureCode,
      failureMessage: null,
      updatedAt: new Date(),
    })
    .where(and(eq(images.id, imageId), eq(images.projectId, projectId)))
    .returning();
  return updated ?? null;
}

/** Count trusted images for project summary badges. */
export async function countImagesForProject(projectId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(images)
    .where(and(eq(images.projectId, projectId), notSoftDeleted(), eq(images.status, "validated")));
  return row?.count ?? 0;
}
