/**
 * Project quota policy — development defaults, not billing tiers.
 * Integer-safe math only; values stay within Number.MAX_SAFE_INTEGER.
 */

import {MAX_BYTES_PER_IMAGE, MAX_FILES_PER_BATCH} from "@/server/images/policy";

/** Development default — not a Stripe billing tier. */
export const MAX_IMAGES_PER_PROJECT = 10_000;

/** Development default — 10 GiB, not a Stripe billing tier. */
export const MAX_PROJECT_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;

export {MAX_BYTES_PER_IMAGE, MAX_FILES_PER_BATCH};

/** Near-limit threshold ratio (development default). */
export const QUOTA_NEAR_LIMIT_RATIO = 0.8;

export type QuotaPolicySummary = {
  maxImagesPerProject: number;
  maxProjectStorageBytes: number;
  maxBytesPerImage: number;
  maxFilesPerBatch: number;
  nearLimitRatio: number;
};

export type QuotaUsageSnapshot = {
  activeImageCount: number;
  reservedImageSlots: number;
  activeOriginalBytes: number;
  reservedUploadBytes: number;
  replacementCandidateBytes: number;
  cleanupPendingBytes: number;
};

export function getQuotaPolicy(): QuotaPolicySummary {
  return {
    maxImagesPerProject: MAX_IMAGES_PER_PROJECT,
    maxProjectStorageBytes: MAX_PROJECT_STORAGE_BYTES,
    maxBytesPerImage: MAX_BYTES_PER_IMAGE,
    maxFilesPerBatch: MAX_FILES_PER_BATCH,
    nearLimitRatio: QUOTA_NEAR_LIMIT_RATIO,
  };
}

function assertSafeInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${label} exceeds MAX_SAFE_INTEGER`);
  }
  return value;
}

/** Logical slots in use (active + reserved for new uploads). */
export function countLogicalImageSlots(usage: QuotaUsageSnapshot): number {
  return assertSafeInt(usage.activeImageCount, "activeImageCount") +
    assertSafeInt(usage.reservedImageSlots, "reservedImageSlots");
}

/**
 * Effective storage usage for enforcement:
 * activeOriginal + reservedUpload + replacementCandidate + cleanupPending
 */
export function computeEffectiveUsageBytes(usage: QuotaUsageSnapshot): number {
  const total =
    assertSafeInt(usage.activeOriginalBytes, "activeOriginalBytes") +
    assertSafeInt(usage.reservedUploadBytes, "reservedUploadBytes") +
    assertSafeInt(usage.replacementCandidateBytes, "replacementCandidateBytes") +
    assertSafeInt(usage.cleanupPendingBytes, "cleanupPendingBytes");
  return assertSafeInt(total, "effectiveUsageBytes");
}

export function availableImageSlots(usage: QuotaUsageSnapshot): number {
  const used = countLogicalImageSlots(usage);
  return Math.max(0, MAX_IMAGES_PER_PROJECT - used);
}

export function availableStorageBytes(usage: QuotaUsageSnapshot): number {
  const used = computeEffectiveUsageBytes(usage);
  return Math.max(0, MAX_PROJECT_STORAGE_BYTES - used);
}

export function canReserveNewUploadSlots(
  usage: QuotaUsageSnapshot,
  slotCount: number,
): boolean {
  assertSafeInt(slotCount, "slotCount");
  return slotCount <= availableImageSlots(usage);
}

export function canReserveStorageBytes(
  usage: QuotaUsageSnapshot,
  bytes: number,
): boolean {
  assertSafeInt(bytes, "bytes");
  return bytes <= availableStorageBytes(usage);
}

export function isProjectStorageFull(usage: QuotaUsageSnapshot): boolean {
  return computeEffectiveUsageBytes(usage) >= MAX_PROJECT_STORAGE_BYTES;
}

export function isProjectImageSlotsFull(usage: QuotaUsageSnapshot): boolean {
  return countLogicalImageSlots(usage) >= MAX_IMAGES_PER_PROJECT;
}

export function isNearStorageLimit(usage: QuotaUsageSnapshot): boolean {
  const threshold = Math.floor(MAX_PROJECT_STORAGE_BYTES * QUOTA_NEAR_LIMIT_RATIO);
  return computeEffectiveUsageBytes(usage) >= threshold;
}

export function isNearImageSlotLimit(usage: QuotaUsageSnapshot): boolean {
  const threshold = Math.floor(MAX_IMAGES_PER_PROJECT * QUOTA_NEAR_LIMIT_RATIO);
  return countLogicalImageSlots(usage) >= threshold;
}

export function isFileSizeWithinLimit(bytes: number): boolean {
  assertSafeInt(bytes, "bytes");
  return bytes > 0 && bytes <= MAX_BYTES_PER_IMAGE;
}

export function isBatchSizeWithinLimit(count: number): boolean {
  assertSafeInt(count, "count");
  return count >= 1 && count <= MAX_FILES_PER_BATCH;
}

export function sumDeclaredBytes(items: readonly {declaredBytes: number}[]): number {
  let total = 0;
  for (const item of items) {
    total += assertSafeInt(item.declaredBytes, "declaredBytes");
    if (total > Number.MAX_SAFE_INTEGER) {
      throw new RangeError("declaredBytes sum exceeds MAX_SAFE_INTEGER");
    }
  }
  return total;
}

/** Trusted size delta vs reserved declared size after HeadObject. */
export function trustedSizeDelta(declaredBytes: number, trustedBytes: number): number {
  return assertSafeInt(trustedBytes, "trustedBytes") - assertSafeInt(declaredBytes, "declaredBytes");
}

export function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("value must be finite");
  }
  const floored = Math.max(0, Math.floor(value));
  if (floored > Number.MAX_SAFE_INTEGER) {
    throw new RangeError("value exceeds MAX_SAFE_INTEGER");
  }
  return floored;
}
