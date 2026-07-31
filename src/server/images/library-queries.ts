import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {getDb} from "@/db";
import {imageReplacements, images, projects, type Image} from "@/db/schema";
import {
  DELETION_UNAVAILABLE_STATUSES,
  OPEN_REPLACEMENT_STATUSES,
} from "@/server/images/lifecycle-errors";
import {READY_STATUS} from "@/server/images/ready-eligibility";
import type {LibraryQuery, LibrarySort, LibraryStatusFilter} from "./library-query";

/** Safe list row — never includes storageKey or credentials. */
export type LibraryImageListItem = {
  id: string;
  originalFilename: string;
  mimeType: string;
  detectedMimeType: string | null;
  detectedFormat: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pixelCount: number | null;
  status: Image["status"];
  isAnimated: boolean | null;
  frameCount: number | null;
  orientation: number | null;
  failureCode: string | null;
  uploadedAt: Date | null;
  validatedAt: Date | null;
  createdAt: Date;
};

export type LibraryStatusCounts = {
  total: number;
  ready_for_processing: number;
  validated: number;
  validating: number;
  uploaded: number;
  validation_failed: number;
  pending_upload: number;
  upload_failed: number;
  deleting: number;
  deleted: number;
  replacement: number;
};

export type PaginatedLibraryResult = {
  items: LibraryImageListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const listColumns = {
  id: images.id,
  originalFilename: images.originalFilename,
  mimeType: images.mimeType,
  detectedMimeType: images.detectedMimeType,
  detectedFormat: images.detectedFormat,
  sizeBytes: images.sizeBytes,
  width: images.width,
  height: images.height,
  pixelCount: images.pixelCount,
  status: images.status,
  isAnimated: images.isAnimated,
  frameCount: images.frameCount,
  orientation: images.orientation,
  failureCode: images.failureCode,
  uploadedAt: images.uploadedAt,
  validatedAt: images.validatedAt,
  createdAt: images.createdAt,
} as const;

function notSoftDeleted() {
  return isNull(images.deletedAt);
}

function notDeletionUnavailable() {
  return notInArray(images.status, [...DELETION_UNAVAILABLE_STATUSES]);
}

function pendingNotExpired() {
  return and(
    eq(images.status, "pending_upload"),
    or(isNull(images.uploadExpiresAt), gt(images.uploadExpiresAt, new Date())),
  );
}

function openReplacementExists(): SQL {
  return sql`exists (
    select 1 from ${imageReplacements}
    where ${imageReplacements.imageId} = ${images.id}
      and ${imageReplacements.projectId} = ${images.projectId}
      and ${imageReplacements.status} in (
        'pending','uploading','uploaded','validating','validated','failed','promotion_pending','cancel_cleanup_failed'
      )
  )`;
}

export function statusCondition(status: LibraryStatusFilter): SQL {
  if (status === "ready_for_processing") return eq(images.status, READY_STATUS);
  if (status === "validated") return eq(images.status, "validated");
  if (status === "validating") return eq(images.status, "validating");
  if (status === "uploaded") return eq(images.status, "uploaded");
  if (status === "validation_failed") return eq(images.status, "validation_failed");
  if (status === "pending_upload") return pendingNotExpired()!;
  if (status === "upload_failed") return eq(images.status, "upload_failed");
  if (status === "deleting") {
    return inArray(images.status, ["deletion_pending", "storage_deleting", "deletion_failed"]);
  }
  if (status === "deleted") return eq(images.status, "deleted");
  if (status === "replacement") return openReplacementExists();
  return or(
    eq(images.status, READY_STATUS),
    eq(images.status, "validated"),
    eq(images.status, "validating"),
    eq(images.status, "uploaded"),
    eq(images.status, "validation_failed"),
    eq(images.status, "upload_failed"),
    pendingNotExpired(),
  )!;
}

/** Escape LIKE metacharacters for safe ilike patterns. */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function searchCondition(q: string): SQL | undefined {
  if (!q) return undefined;
  const pattern = `%${escapeLikePattern(q)}%`;
  return ilike(images.originalFilename, pattern);
}

function orderBySort(sort: LibrarySort) {
  const secondary = asc(images.id);
  switch (sort) {
    case "oldest":
      return [asc(images.createdAt), secondary];
    case "filename_asc":
      return [asc(images.originalFilename), secondary];
    case "filename_desc":
      return [desc(images.originalFilename), secondary];
    case "size_asc":
      return [asc(images.sizeBytes), secondary];
    case "size_desc":
      return [desc(images.sizeBytes), secondary];
    case "dimensions_desc":
      return [desc(images.width), desc(images.height), secondary];
    case "newest":
    default:
      return [desc(images.createdAt), secondary];
  }
}

function baseOwnerConditions(userId: string, projectId: string, status: LibraryStatusFilter) {
  const ownership = and(eq(images.projectId, projectId), eq(projects.userId, userId));
  if (status === "deleting" || status === "deleted") {
    return ownership;
  }
  return and(ownership, notSoftDeleted(), notDeletionUnavailable());
}

export async function listLibraryImagesForOwnedProject(
  userId: string,
  projectId: string,
  query: LibraryQuery,
): Promise<PaginatedLibraryResult> {
  const db = getDb();
  const conditions = [baseOwnerConditions(userId, projectId, query.status), statusCondition(query.status)];
  const search = searchCondition(query.q);
  if (search) conditions.push(search);

  const where = and(...conditions);

  const [countRow] = await db
    .select({count: sql<number>`count(*)::int`})
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(where);

  const totalCount = countRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize) || 1);
  const page = Math.min(query.page, totalPages);
  const offset = (page - 1) * query.pageSize;

  const rows = await db
    .select(listColumns)
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(where)
    .orderBy(...orderBySort(query.sort))
    .limit(query.pageSize)
    .offset(offset);

  return {
    items: rows,
    totalCount,
    page,
    pageSize: query.pageSize,
    totalPages,
  };
}

export async function getLibraryStatusCounts(
  userId: string,
  projectId: string,
): Promise<LibraryStatusCounts> {
  const db = getDb();
  const rows = await db
    .select({
      status: images.status,
      count: sql<number>`count(*)::int`,
    })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.projectId, projectId), eq(projects.userId, userId)))
    .groupBy(images.status);

  const counts: LibraryStatusCounts = {
    total: 0,
    ready_for_processing: 0,
    validated: 0,
    validating: 0,
    uploaded: 0,
    validation_failed: 0,
    pending_upload: 0,
    upload_failed: 0,
    deleting: 0,
    deleted: 0,
    replacement: 0,
  };

  for (const row of rows) {
    const n = Number(row.count);
    if (row.status === READY_STATUS) {
      counts.ready_for_processing = n;
      counts.total += n;
    } else if (row.status === "validated") {
      counts.validated = n;
      counts.total += n;
    } else if (row.status === "validating") {
      counts.validating = n;
      counts.total += n;
    } else if (row.status === "uploaded") {
      counts.uploaded = n;
      counts.total += n;
    } else if (row.status === "validation_failed") {
      counts.validation_failed = n;
      counts.total += n;
    } else if (row.status === "pending_upload") {
      counts.pending_upload = n;
      counts.total += n;
    } else if (row.status === "upload_failed") {
      counts.upload_failed = n;
      counts.total += n;
    } else if (
      row.status === "deletion_pending" ||
      row.status === "storage_deleting" ||
      row.status === "deletion_failed"
    ) {
      counts.deleting += n;
    } else if (row.status === "deleted") {
      counts.deleted = n;
    }
  }

  const [replacementRow] = await db
    .select({count: sql<number>`count(distinct ${images.id})::int`})
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .innerJoin(
      imageReplacements,
      and(
        eq(imageReplacements.imageId, images.id),
        eq(imageReplacements.projectId, images.projectId),
        inArray(imageReplacements.status, [...OPEN_REPLACEMENT_STATUSES]),
      ),
    )
    .where(
      and(
        eq(images.projectId, projectId),
        eq(projects.userId, userId),
        isNull(images.deletedAt),
        notDeletionUnavailable(),
      ),
    );
  counts.replacement = Number(replacementRow?.count ?? 0);

  return counts;
}

/** Client-supplied IDs must be re-checked against ownership before any future bulk action. */
export async function filterOwnedImageIds(
  userId: string,
  projectId: string,
  candidateIds: string[],
): Promise<string[]> {
  if (candidateIds.length === 0) return [];
  const unique = [...new Set(candidateIds)].slice(0, 500);
  const db = getDb();
  const rows = await db
    .select({id: images.id})
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(
        baseOwnerConditions(userId, projectId, "all"),
        inArray(images.id, unique),
      ),
    );
  return rows.map((r) => r.id);
}

export type LibraryImageDetail = LibraryImageListItem & {
  colourSpace: string | null;
  hasAlpha: boolean | null;
  validationVersion: string | null;
  validationAttempts: number;
};

export async function getLibraryImageDetail(
  userId: string,
  projectId: string,
  imageId: string,
): Promise<LibraryImageDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({
      ...listColumns,
      colourSpace: images.colourSpace,
      hasAlpha: images.hasAlpha,
      validationVersion: images.validationVersion,
      validationAttempts: images.validationAttempts,
    })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(
      and(
        eq(images.id, imageId),
        baseOwnerConditions(userId, projectId, "all"),
      ),
    )
    .limit(1);
  return row ?? null;
}
