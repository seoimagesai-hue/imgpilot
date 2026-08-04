/**
 * Server-only helpers for original object keys.
 * Optimized copies must use a different prefix later. Never mutate originals in place.
 */

export function buildOriginalStorageKey(params: {
  userId: string;
  projectId: string;
  imageId: string;
  safeFilenameSuffix: string;
}): string {
  return `users/${params.userId}/projects/${params.projectId}/originals/${params.imageId}/${params.safeFilenameSuffix}`;
}

/** New immutable key for a replacement candidate — never overwrites the active original. */
export function buildReplacementStorageKey(params: {
  userId: string;
  projectId: string;
  imageId: string;
  replacementId: string;
  safeFilenameSuffix: string;
}): string {
  const suffix = `r-${params.replacementId}-${params.safeFilenameSuffix}`.slice(0, 200);
  return `users/${params.userId}/projects/${params.projectId}/originals/${params.imageId}/${suffix}`;
}

export function assertOriginalStorageKeyOwned(params: {
  storageKey: string;
  userId: string;
  projectId: string;
  imageId: string;
}): boolean {
  const expectedPrefix = `users/${params.userId}/projects/${params.projectId}/originals/${params.imageId}/`;
  return (
    params.storageKey.startsWith(expectedPrefix) &&
    !params.storageKey.includes("..") &&
    !params.storageKey.includes("\0") &&
    params.storageKey.length < 1024
  );
}

export function isValidOriginalStorageKeyShape(storageKey: string): boolean {
  return (
    /^users\/[^/]+\/projects\/[^/]+\/originals\/[^/]+\/[^/]+$/.test(storageKey) &&
    !storageKey.includes("..") &&
    !storageKey.includes("\0") &&
    storageKey.length < 1024
  );
}

/** Private derivative key — never overlaps originals prefix. Includes variant (optimize|preset). */
export function buildDerivativeStorageKey(params: {
  userId: string;
  projectId: string;
  imageId: string;
  jobId: string;
  attempt: number;
  safeFilenameSuffix: string;
  /** optimize | px_256 | px_512 | … */
  variant?: string;
}): string {
  const variant = (params.variant ?? "optimize").replace(/[^a-z0-9_]/gi, "").slice(0, 32) || "optimize";
  const suffix = `a${params.attempt}-${params.safeFilenameSuffix}`.slice(0, 160);
  return `users/${params.userId}/projects/${params.projectId}/derivatives/${params.imageId}/${params.jobId}/${variant}/${suffix}`;
}

export function assertDerivativeStorageKeyOwned(params: {
  storageKey: string;
  userId: string;
  projectId: string;
  imageId: string;
  jobId: string;
}): boolean {
  const expectedPrefix = `users/${params.userId}/projects/${params.projectId}/derivatives/${params.imageId}/${params.jobId}/`;
  return (
    params.storageKey.startsWith(expectedPrefix) &&
    !params.storageKey.includes("..") &&
    !params.storageKey.includes("\0") &&
    params.storageKey.length < 1024
  );
}

export function isValidDerivativeStorageKeyShape(storageKey: string): boolean {
  // Prompt 12 shape (3 segments after derivatives) or Prompt 13+ with variant folder.
  const legacy =
    /^users\/[^/]+\/projects\/[^/]+\/derivatives\/[^/]+\/[^/]+\/[^/]+$/.test(storageKey);
  const withVariant =
    /^users\/[^/]+\/projects\/[^/]+\/derivatives\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(storageKey);
  return (
    (legacy || withVariant) &&
    !storageKey.includes("..") &&
    !storageKey.includes("\0") &&
    storageKey.length < 1024
  );
}

/** Guest original upload key — never under users/projects. */
export function buildGuestOriginalStorageKey(params: {
  sessionPublicId: string;
  uploadId: string;
  safeFilenameSuffix: string;
}): string {
  return `guest/${params.sessionPublicId}/originals/${params.uploadId}/${params.safeFilenameSuffix}`;
}

/** Guest job output key. */
export function buildGuestOutputStorageKey(params: {
  sessionPublicId: string;
  jobId: string;
  safeFilenameSuffix: string;
}): string {
  return `guest/${params.sessionPublicId}/outputs/${params.jobId}/${params.safeFilenameSuffix}`;
}

/** Guest bulk ZIP archive key. */
export function buildGuestBulkArchiveStorageKey(params: {
  sessionPublicId: string;
  bulkJobId: string;
}): string {
  return `guest/${params.sessionPublicId}/bulk/${params.bulkJobId}/archives/results.zip`;
}

export function assertGuestStorageKeyOwned(params: {
  storageKey: string;
  sessionPublicId: string;
}): boolean {
  const prefix = `guest/${params.sessionPublicId}/`;
  return (
    params.storageKey.startsWith(prefix) &&
    !params.storageKey.includes("..") &&
    !params.storageKey.includes("\0") &&
    params.storageKey.length < 1024
  );
}

export function isValidGuestStorageKeyShape(storageKey: string): boolean {
  const original =
    /^guest\/[^/]+\/originals\/[^/]+\/[^/]+$/.test(storageKey);
  const output = /^guest\/[^/]+\/outputs\/[^/]+\/[^/]+$/.test(storageKey);
  const archive = /^guest\/[^/]+\/bulk\/[^/]+\/archives\/[^/]+$/.test(storageKey);
  return (
    (original || output || archive) &&
    !storageKey.includes("..") &&
    !storageKey.includes("\0") &&
    storageKey.length < 1024
  );
}
