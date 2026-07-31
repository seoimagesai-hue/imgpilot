import {describe, expect, it} from "vitest";
import {
  clampNonNegative,
  computeEffectiveUsageBytes,
  trustedSizeDelta,
  type QuotaUsageSnapshot,
} from "@/server/images/quota-policy";
import {toPublicDto} from "@/server/images/quota-service";

describe("quota accounting formulas", () => {
  const baseUsage = (): QuotaUsageSnapshot => ({
    activeImageCount: 10,
    reservedImageSlots: 2,
    activeOriginalBytes: 5_000_000,
    reservedUploadBytes: 500_000,
    replacementCandidateBytes: 250_000,
    cleanupPendingBytes: 100_000,
  });

  it("effectiveUsage matches locked architecture sum", () => {
    const usage = baseUsage();
    expect(computeEffectiveUsageBytes(usage)).toBe(
      usage.activeOriginalBytes +
        usage.reservedUploadBytes +
        usage.replacementCandidateBytes +
        usage.cleanupPendingBytes,
    );
  });

  it("new upload reserve increases slots and reserved bytes", () => {
    const before = baseUsage();
    const declared = 75_000;
    const after: QuotaUsageSnapshot = {
      ...before,
      reservedImageSlots: before.reservedImageSlots + 1,
      reservedUploadBytes: before.reservedUploadBytes + declared,
    };
    expect(computeEffectiveUsageBytes(after) - computeEffectiveUsageBytes(before)).toBe(declared);
    expect(after.reservedImageSlots - before.reservedImageSlots).toBe(1);
  });

  it("consume new upload moves reserved bytes to active and frees slot", () => {
    const declared = 80_000;
    const trusted = 70_000;
    const before: QuotaUsageSnapshot = {
      activeImageCount: 1,
      reservedImageSlots: 1,
      activeOriginalBytes: 0,
      reservedUploadBytes: declared,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: 0,
    };
    const after: QuotaUsageSnapshot = {
      activeImageCount: before.activeImageCount + 1,
      reservedImageSlots: before.reservedImageSlots - 1,
      activeOriginalBytes: before.activeOriginalBytes + trusted,
      reservedUploadBytes: before.reservedUploadBytes - declared,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: 0,
    };
    expect(computeEffectiveUsageBytes(after)).toBe(trusted);
    expect(trustedSizeDelta(declared, trusted)).toBe(-10_000);
  });

  it("consume with trusted larger than declared increases effective usage by delta", () => {
    const declared = 100;
    const trusted = 150;
    const delta = trustedSizeDelta(declared, trusted);
    const beforeEffective = declared;
    const afterEffective = trusted;
    expect(afterEffective - beforeEffective).toBe(delta);
  });

  it("delete acquire moves active bytes to cleanup pending and decrements count", () => {
    const bytes = 1_024_000;
    const before: QuotaUsageSnapshot = {
      activeImageCount: 5,
      reservedImageSlots: 0,
      activeOriginalBytes: bytes,
      reservedUploadBytes: 0,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: 0,
    };
    const after: QuotaUsageSnapshot = {
      activeImageCount: before.activeImageCount - 1,
      reservedImageSlots: 0,
      activeOriginalBytes: 0,
      reservedUploadBytes: 0,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: bytes,
    };
    expect(computeEffectiveUsageBytes(before)).toBe(computeEffectiveUsageBytes(after));
    expect(after.activeImageCount).toBe(4);
  });

  it("delete cleanup success removes cleanup pending bytes", () => {
    const bytes = 500_000;
    const before: QuotaUsageSnapshot = {
      activeImageCount: 0,
      reservedImageSlots: 0,
      activeOriginalBytes: 0,
      reservedUploadBytes: 0,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: bytes,
    };
    const after: QuotaUsageSnapshot = {
      ...before,
      cleanupPendingBytes: 0,
    };
    expect(computeEffectiveUsageBytes(after)).toBe(0);
  });

  it("replacement promote swaps candidate into active and moves old to cleanup", () => {
    const oldBytes = 200_000;
    const newBytes = 180_000;
    const before: QuotaUsageSnapshot = {
      activeImageCount: 1,
      reservedImageSlots: 0,
      activeOriginalBytes: oldBytes,
      reservedUploadBytes: 0,
      replacementCandidateBytes: newBytes,
      cleanupPendingBytes: 0,
    };
    const after: QuotaUsageSnapshot = {
      activeImageCount: 1,
      reservedImageSlots: 0,
      activeOriginalBytes: newBytes,
      reservedUploadBytes: 0,
      replacementCandidateBytes: 0,
      cleanupPendingBytes: oldBytes,
    };
    expect(computeEffectiveUsageBytes(before)).toBe(computeEffectiveUsageBytes(after));
    expect(after.activeOriginalBytes - before.activeOriginalBytes).toBe(newBytes - oldBytes);
  });

  it("replacement reserve only bumps reserved upload bytes", () => {
    const declared = 42_000;
    const before = baseUsage();
    const after: QuotaUsageSnapshot = {
      ...before,
      reservedUploadBytes: before.reservedUploadBytes + declared,
    };
    expect(after.activeImageCount).toBe(before.activeImageCount);
    expect(after.reservedImageSlots).toBe(before.reservedImageSlots);
    expect(computeEffectiveUsageBytes(after) - computeEffectiveUsageBytes(before)).toBe(declared);
  });

  it("clampNonNegative floors negative values to zero", () => {
    expect(clampNonNegative(-5)).toBe(0);
    expect(clampNonNegative(0)).toBe(0);
    expect(clampNonNegative(99)).toBe(99);
  });
});

describe("quota usage DTO", () => {
  it("toPublicDto exposes safe numbers without internal keys", () => {
    const dto = toPublicDto(
      {
        activeImageCount: 2,
        reservedImageSlots: 1,
        activeOriginalBytes: 100,
        reservedUploadBytes: 50,
        replacementCandidateBytes: 25,
        cleanupPendingBytes: 10,
      },
      true,
    );
    expect(dto).toEqual({
      activeImageCount: 2,
      reservedImageSlots: 1,
      logicalImageSlots: 3,
      activeOriginalBytes: 100,
      reservedUploadBytes: 50,
      replacementCandidateBytes: 25,
      cleanupPendingBytes: 10,
      effectiveUsageBytes: 185,
      availableImageSlots: 10_000 - 3,
      availableStorageBytes: expect.any(Number),
      inconsistencyFlag: true,
    });
    expect(dto).not.toHaveProperty("projectId");
  });
});
