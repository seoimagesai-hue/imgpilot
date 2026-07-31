import {describe, expect, it} from "vitest";
import {
  MAX_IMAGES_PER_PROJECT,
  MAX_PROJECT_STORAGE_BYTES,
  MAX_BYTES_PER_IMAGE,
  MAX_FILES_PER_BATCH,
  QUOTA_NEAR_LIMIT_RATIO,
  availableImageSlots,
  availableStorageBytes,
  canReserveNewUploadSlots,
  canReserveStorageBytes,
  computeEffectiveUsageBytes,
  countLogicalImageSlots,
  getQuotaPolicy,
  isBatchSizeWithinLimit,
  isFileSizeWithinLimit,
  isNearImageSlotLimit,
  isNearStorageLimit,
  isProjectImageSlotsFull,
  isProjectStorageFull,
  sumDeclaredBytes,
  trustedSizeDelta,
  type QuotaUsageSnapshot,
} from "@/server/images/quota-policy";

const emptyUsage = (): QuotaUsageSnapshot => ({
  activeImageCount: 0,
  reservedImageSlots: 0,
  activeOriginalBytes: 0,
  reservedUploadBytes: 0,
  replacementCandidateBytes: 0,
  cleanupPendingBytes: 0,
});

describe("getQuotaPolicy", () => {
  it("returns development defaults", () => {
    const policy = getQuotaPolicy();
    expect(policy.maxImagesPerProject).toBe(10_000);
    expect(policy.maxProjectStorageBytes).toBe(10 * 1024 * 1024 * 1024);
    expect(policy.maxBytesPerImage).toBe(MAX_BYTES_PER_IMAGE);
    expect(policy.maxFilesPerBatch).toBe(MAX_FILES_PER_BATCH);
    expect(policy.nearLimitRatio).toBe(0.8);
  });
});

describe("effective usage formula", () => {
  it("sums active, reserved, candidate, and cleanup bytes", () => {
    const usage: QuotaUsageSnapshot = {
      activeImageCount: 2,
      reservedImageSlots: 1,
      activeOriginalBytes: 1000,
      reservedUploadBytes: 200,
      replacementCandidateBytes: 300,
      cleanupPendingBytes: 400,
    };
    expect(computeEffectiveUsageBytes(usage)).toBe(1900);
  });

  it("counts logical image slots as active + reserved", () => {
    const usage = emptyUsage();
    usage.activeImageCount = 3;
    usage.reservedImageSlots = 2;
    expect(countLogicalImageSlots(usage)).toBe(5);
  });
});

describe("availability helpers", () => {
  it("availableImageSlots subtracts used slots from max", () => {
    const usage = emptyUsage();
    usage.activeImageCount = MAX_IMAGES_PER_PROJECT - 5;
    usage.reservedImageSlots = 2;
    expect(availableImageSlots(usage)).toBe(3);
  });

  it("availableStorageBytes subtracts effective usage from max", () => {
    const usage = emptyUsage();
    usage.activeOriginalBytes = 1024;
    usage.reservedUploadBytes = 512;
    expect(availableStorageBytes(usage)).toBe(MAX_PROJECT_STORAGE_BYTES - 1536);
  });

  it("canReserveNewUploadSlots respects slot ceiling", () => {
    const usage = emptyUsage();
    usage.reservedImageSlots = MAX_IMAGES_PER_PROJECT;
    expect(canReserveNewUploadSlots(usage, 1)).toBe(false);
    expect(canReserveNewUploadSlots(usage, 0)).toBe(true);
  });

  it("canReserveStorageBytes respects byte ceiling", () => {
    const usage = emptyUsage();
    usage.activeOriginalBytes = MAX_PROJECT_STORAGE_BYTES - 100;
    expect(canReserveStorageBytes(usage, 101)).toBe(false);
    expect(canReserveStorageBytes(usage, 100)).toBe(true);
  });
});

describe("near and full checks", () => {
  it("isProjectStorageFull at exact max", () => {
    const usage = emptyUsage();
    usage.activeOriginalBytes = MAX_PROJECT_STORAGE_BYTES;
    expect(isProjectStorageFull(usage)).toBe(true);
  });

  it("isProjectImageSlotsFull at exact max slots", () => {
    const usage = emptyUsage();
    usage.activeImageCount = MAX_IMAGES_PER_PROJECT;
    expect(isProjectImageSlotsFull(usage)).toBe(true);
  });

  it("isNearStorageLimit at 80% threshold", () => {
    const usage = emptyUsage();
    const threshold = Math.floor(MAX_PROJECT_STORAGE_BYTES * QUOTA_NEAR_LIMIT_RATIO);
    usage.activeOriginalBytes = threshold;
    expect(isNearStorageLimit(usage)).toBe(true);
    usage.activeOriginalBytes = threshold - 1;
    expect(isNearStorageLimit(usage)).toBe(false);
  });

  it("isNearImageSlotLimit at 80% slot threshold", () => {
    const usage = emptyUsage();
    const threshold = Math.floor(MAX_IMAGES_PER_PROJECT * QUOTA_NEAR_LIMIT_RATIO);
    usage.activeImageCount = threshold;
    expect(isNearImageSlotLimit(usage)).toBe(true);
  });
});

describe("file and batch limits", () => {
  it("isFileSizeWithinLimit rejects zero and oversize", () => {
    expect(isFileSizeWithinLimit(0)).toBe(false);
    expect(isFileSizeWithinLimit(MAX_BYTES_PER_IMAGE + 1)).toBe(false);
    expect(isFileSizeWithinLimit(MAX_BYTES_PER_IMAGE)).toBe(true);
    expect(isFileSizeWithinLimit(1024)).toBe(true);
  });

  it("isBatchSizeWithinLimit enforces batch bounds", () => {
    expect(isBatchSizeWithinLimit(0)).toBe(false);
    expect(isBatchSizeWithinLimit(MAX_FILES_PER_BATCH + 1)).toBe(false);
    expect(isBatchSizeWithinLimit(1)).toBe(true);
    expect(isBatchSizeWithinLimit(MAX_FILES_PER_BATCH)).toBe(true);
  });
});

describe("integer-safe helpers", () => {
  it("sumDeclaredBytes totals item declared sizes", () => {
    expect(
      sumDeclaredBytes([
        {declaredBytes: 100},
        {declaredBytes: 200},
        {declaredBytes: 300},
      ]),
    ).toBe(600);
  });

  it("trustedSizeDelta computes signed difference", () => {
    expect(trustedSizeDelta(1000, 900)).toBe(-100);
    expect(trustedSizeDelta(1000, 1200)).toBe(200);
    expect(trustedSizeDelta(1000, 1000)).toBe(0);
  });
});
