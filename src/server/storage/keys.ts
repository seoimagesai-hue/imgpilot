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
