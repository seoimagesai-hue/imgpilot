/**
 * DB helpers for Ready-for-processing transitions.
 */
import {and, eq, getTableColumns, inArray, isNull} from "drizzle-orm";
import {getDb} from "@/db";
import {imageReplacements, images, projects, type Image} from "@/db/schema";
import {OPEN_REPLACEMENT_STATUSES} from "@/server/images/lifecycle-errors";
import {READY_STATUS} from "@/server/images/ready-eligibility";

export async function getOwnedImageForReady(
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

export async function imageHasOpenReplacement(imageId: string, projectId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({id: imageReplacements.id})
    .from(imageReplacements)
    .where(
      and(
        eq(imageReplacements.imageId, imageId),
        eq(imageReplacements.projectId, projectId),
        inArray(imageReplacements.status, [...OPEN_REPLACEMENT_STATUSES]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** validated → ready_for_processing (conditional). */
export async function markImageReadyForProcessing(
  imageId: string,
  projectId: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(images)
    .set({
      status: READY_STATUS,
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        eq(images.status, "validated"),
        isNull(images.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

/** ready_for_processing → validated (e.g. open replacement). */
export async function demoteReadyToValidated(
  imageId: string,
  projectId: string,
): Promise<Image | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(images)
    .set({
      status: "validated",
      updatedAt: now,
    })
    .where(
      and(
        eq(images.id, imageId),
        eq(images.projectId, projectId),
        eq(images.status, READY_STATUS),
        isNull(images.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

/** Invalid Ready → validated when eligibility fails. */
export async function demoteInvalidReady(
  imageId: string,
  projectId: string,
): Promise<Image | null> {
  return demoteReadyToValidated(imageId, projectId);
}

export async function listValidatedCandidatesForReady(
  projectId: string,
  limit: number,
): Promise<Image[]> {
  const db = getDb();
  return db
    .select(getTableColumns(images))
    .from(images)
    .where(
      and(
        eq(images.projectId, projectId),
        eq(images.status, "validated"),
        isNull(images.deletedAt),
      ),
    )
    .limit(limit);
}

export async function listReadyImagesForReconcile(
  projectId: string,
  limit: number,
): Promise<Image[]> {
  const db = getDb();
  return db
    .select(getTableColumns(images))
    .from(images)
    .where(and(eq(images.projectId, projectId), eq(images.status, READY_STATUS)))
    .limit(limit);
}
