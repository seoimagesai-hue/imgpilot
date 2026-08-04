import {describe, expect, it} from "vitest";
import {
  aspectRatioValue,
  defaultGuestCropOptions,
  guestCropOptionsEqual,
  GUEST_CROP_MIN_EDGE_PX,
  GUEST_CROP_OPERATION,
  normalizedCropToPixels,
  parseGuestCropOptions,
  validateNormalizedCrop,
} from "@/lib/guest/crop-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";
import {cropToolConfig} from "@/components/guest/tools/crop-tool";
import {compressToolConfig} from "@/components/guest/tools/compress-tool";
import {resizeToolConfig} from "@/components/guest/tools/resize-tool";

describe("guest crop architecture", () => {
  it("registers crop.same_format and mounts shared workspace config shape", () => {
    expect(GUEST_CROP_OPERATION).toBe("crop.same_format");
    expect(isGuestSupportedOperation(GUEST_CROP_OPERATION)).toBe(true);
    expect(cropToolConfig.operation).toBe(GUEST_CROP_OPERATION);
    expect(cropToolConfig.toolCode).toBe("crop-image");
    expect(cropToolConfig.OptionsPanel).toBeTruthy();
    expect(cropToolConfig.allowReprocess).toBe(true);
    expect(cropToolConfig.showOptionsWhenDone).toBe(true);
    // Same config contract as compress/resize — no duplicate page workflow object.
    expect(cropToolConfig.buildJobOptions).toEqual(expect.any(Function));
    expect(compressToolConfig.OptionsPanel).toBeTruthy();
    expect(resizeToolConfig.OptionsPanel).toBeTruthy();
  });
});

describe("normalized crop validation", () => {
  it("accepts a valid normalized crop and full-image crop", () => {
    expect(validateNormalizedCrop({x: 0.1, y: 0.1, width: 0.8, height: 0.8})).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    });
    expect(validateNormalizedCrop({x: 0, y: 0, width: 1, height: 1})).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it("rejects negatives, zeros, and out-of-bounds", () => {
    expect(() => validateNormalizedCrop({x: -0.1, y: 0, width: 0.5, height: 0.5})).toThrow(
      "INVALID_CROP",
    );
    expect(() => validateNormalizedCrop({x: 0, y: 0, width: 0, height: 0.5})).toThrow(
      "INVALID_CROP",
    );
    expect(() => validateNormalizedCrop({x: 0, y: 0, width: 0.5, height: 0})).toThrow(
      "INVALID_CROP",
    );
    expect(() => validateNormalizedCrop({x: 0.6, y: 0, width: 0.5, height: 0.5})).toThrow(
      "OUT_OF_BOUNDS",
    );
    expect(() => validateNormalizedCrop({x: 0, y: 0.7, width: 0.5, height: 0.5})).toThrow(
      "OUT_OF_BOUNDS",
    );
  });
});

describe("pixel conversion", () => {
  it("converts using trusted source dimensions with rounding/clamping", () => {
    const px = normalizedCropToPixels(1000, 800, {
      x: 0.1,
      y: 0.1,
      width: 0.5,
      height: 0.5,
    });
    expect(px).toEqual({left: 100, top: 80, width: 500, height: 400});
  });

  it("enforces minimum crop size", () => {
    expect(GUEST_CROP_MIN_EDGE_PX).toBe(16);
    expect(() =>
      normalizedCropToPixels(1000, 1000, {x: 0, y: 0, width: 0.01, height: 0.01}),
    ).toThrow("CROP_TOO_SMALL");
  });

  it("full-image crop yields full trusted dimensions", () => {
    expect(
      normalizedCropToPixels(640, 480, {x: 0, y: 0, width: 1, height: 1}),
    ).toEqual({left: 0, top: 0, width: 640, height: 480});
  });
});

describe("aspect ratios", () => {
  it("exposes free and fixed ratio helpers", () => {
    expect(aspectRatioValue("free")).toBeNull();
    expect(aspectRatioValue("1:1")).toBe(1);
    expect(aspectRatioValue("4:3")).toBeCloseTo(4 / 3);
    expect(aspectRatioValue("3:4")).toBeCloseTo(3 / 4);
    expect(aspectRatioValue("16:9")).toBeCloseTo(16 / 9);
    expect(aspectRatioValue("9:16")).toBeCloseTo(9 / 16);
  });
});

describe("crop options parsing / idempotency fingerprint", () => {
  it("parses allow-listed options and defaults", () => {
    const d = defaultGuestCropOptions();
    expect(d.aspectRatio).toBe("free");
    expect(d.zoom).toBe(1);
    const parsed = parseGuestCropOptions({
      normalizedCrop: {x: 0.2, y: 0.2, width: 0.4, height: 0.4},
      aspectRatio: "1:1",
      zoom: 2,
    });
    expect(parsed.aspectRatio).toBe("1:1");
    expect(parsed.zoom).toBe(2);
    expect(parsed.normalizedCrop.width).toBe(0.4);
  });

  it("treats identical crop geometry as equal ignoring zoom", () => {
    const a = parseGuestCropOptions({
      normalizedCrop: {x: 0.1, y: 0.1, width: 0.5, height: 0.5},
      aspectRatio: "free",
      zoom: 1,
    });
    const b = parseGuestCropOptions({
      normalizedCrop: {x: 0.1, y: 0.1, width: 0.5, height: 0.5},
      aspectRatio: "free",
      zoom: 2.5,
    });
    expect(guestCropOptionsEqual(a, b)).toBe(true);
  });
});
