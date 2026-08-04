import {describe, expect, it} from "vitest";
import {
  assignGuestCohort,
  GUEST_ASSET_TTL_MS,
  guestAssetExpiresAt,
  isGuestExpired,
  isGuestToolCode,
} from "@/server/guest/guest-policy";
import {
  canTransitionGuestJob,
  isGuestSupportedOperation,
} from "@/server/guest/processing-policy";
import {hashGuestToken, verifyGuestTokenHash, generateGuestRawToken} from "@/server/guest/token";
import {
  clampGuestCompressQuality,
  computeGuestCompressSizeSaved,
  guestCompressPresetForQuality,
  GUEST_COMPRESS_OPERATION,
  GUEST_COMPRESS_PRESET_QUALITY,
  parseGuestCompressOptions,
  pngLevelFromGuestQuality,
  qualityFromGuestCompressPreset,
} from "@/lib/guest/compress-policy";
import {sizeBucket} from "@/lib/guest/analytics";
import {
  assertGuestStorageKeyOwned,
  buildGuestOriginalStorageKey,
  buildGuestOutputStorageKey,
  isValidGuestStorageKeyShape,
} from "@/server/storage/keys";

describe("guest-policy", () => {
  it("assigns stable A/B cohorts", () => {
    expect(assignGuestCohort("same")).toBe(assignGuestCohort("same"));
    expect(["a", "b"]).toContain(assignGuestCohort("seed-1"));
  });

  it("uses immutable one-hour expiry math", () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    const expires = guestAssetExpiresAt(created);
    expect(expires.getTime() - created.getTime()).toBe(GUEST_ASSET_TTL_MS);
    expect(isGuestExpired(expires, new Date(expires.getTime() + 1))).toBe(true);
    expect(isGuestExpired(expires, new Date(expires.getTime() - 1))).toBe(false);
  });

  it("recognizes tool codes", () => {
    expect(isGuestToolCode("compress-image")).toBe(true);
    expect(isGuestToolCode("unknown")).toBe(false);
  });
});

describe("guest-token", () => {
  it("hashes with HMAC and verifies", () => {
    process.env.AUTH_SECRET = "x".repeat(40);
    const raw = generateGuestRawToken();
    const hash = hashGuestToken(raw);
    expect(hash).toHaveLength(64);
    expect(verifyGuestTokenHash(raw, hash)).toBe(true);
    expect(verifyGuestTokenHash("other", hash)).toBe(false);
  });
});

describe("guest job transitions", () => {
  it("allows queued to running to completed", () => {
    expect(canTransitionGuestJob("queued", "running")).toBe(true);
    expect(canTransitionGuestJob("running", "completed")).toBe(true);
    expect(canTransitionGuestJob("completed", "queued")).toBe(false);
  });

  it("supports compress and resize operations", () => {
    expect(isGuestSupportedOperation(GUEST_COMPRESS_OPERATION)).toBe(true);
    expect(isGuestSupportedOperation("resize.same_format")).toBe(true);
    expect(isGuestSupportedOperation("resize.something")).toBe(false);
  });
});

describe("guest compress policy", () => {
  it("maps presets to quality", () => {
    expect(qualityFromGuestCompressPreset("low")).toBe(40);
    expect(qualityFromGuestCompressPreset("balanced")).toBe(70);
    expect(qualityFromGuestCompressPreset("high")).toBe(85);
    expect(guestCompressPresetForQuality(70)).toBe("balanced");
    expect(guestCompressPresetForQuality(55)).toBe("custom");
  });

  it("clamps quality and parses options", () => {
    expect(clampGuestCompressQuality(0)).toBe(1);
    expect(clampGuestCompressQuality(200)).toBe(100);
    expect(parseGuestCompressOptions({preset: "high"})).toEqual({
      quality: 85,
      preset: "high",
    });
    expect(parseGuestCompressOptions({quality: 55}).preset).toBe("custom");
  });

  it("computes size saved and png levels", () => {
    expect(computeGuestCompressSizeSaved(1000, 400)).toEqual({
      inputBytes: 1000,
      outputBytes: 400,
      savedBytes: 600,
      savedPercent: 60,
    });
    expect(pngLevelFromGuestQuality(GUEST_COMPRESS_PRESET_QUALITY.low)).toBe(9);
    expect(pngLevelFromGuestQuality(GUEST_COMPRESS_PRESET_QUALITY.high)).toBe(4);
  });

  it("buckets sizes without logging filenames", () => {
    expect(sizeBucket(500_000)).toBe("lte1mb");
    expect(sizeBucket(3_000_000)).toBe("lte5mb");
    expect(sizeBucket(9_000_000)).toBe("lte10mb");
    expect(sizeBucket(12_000_000)).toBe("gt10mb");
  });
});

describe("guest storage keys", () => {
  it("builds and validates guest key shapes", () => {
    const original = buildGuestOriginalStorageKey({
      sessionPublicId: "sess",
      uploadId: "upl",
      safeFilenameSuffix: "a.jpg",
    });
    const output = buildGuestOutputStorageKey({
      sessionPublicId: "sess",
      jobId: "job",
      safeFilenameSuffix: "b.webp",
    });
    expect(isValidGuestStorageKeyShape(original)).toBe(true);
    expect(isValidGuestStorageKeyShape(output)).toBe(true);
    expect(
      assertGuestStorageKeyOwned({storageKey: original, sessionPublicId: "sess"}),
    ).toBe(true);
    expect(
      assertGuestStorageKeyOwned({storageKey: original, sessionPublicId: "other"}),
    ).toBe(false);
    expect(isValidGuestStorageKeyShape("users/x/projects/y/originals/z/a.jpg")).toBe(false);
  });
});
