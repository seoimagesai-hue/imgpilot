import {describe, expect, it} from "vitest";
import {
  encoderSettingsForPreset,
  guestConvertOptionsEqual,
  GUEST_CONVERT_OPERATION,
  isGuestConvertAllowed,
  listGuestConvertTargets,
  parseGuestConvertOptions,
  sourceFormatFromMime,
} from "@/lib/guest/convert-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";

describe("guest convert architecture", () => {
  it("registers convert.format on shared guest operations", () => {
    expect(GUEST_CONVERT_OPERATION).toBe("convert.format");
    expect(isGuestSupportedOperation(GUEST_CONVERT_OPERATION)).toBe(true);
  });
});

describe("guest convert matrix", () => {
  it("allows cross-format pairs and hides same-format", () => {
    expect(isGuestConvertAllowed("jpeg", "png", true)).toBe(true);
    expect(isGuestConvertAllowed("jpeg", "webp", true)).toBe(true);
    expect(isGuestConvertAllowed("jpeg", "avif", true)).toBe(true);
    expect(isGuestConvertAllowed("png", "jpeg", true)).toBe(true);
    expect(isGuestConvertAllowed("png", "webp", true)).toBe(true);
    expect(isGuestConvertAllowed("webp", "jpeg", true)).toBe(true);
    expect(isGuestConvertAllowed("webp", "png", true)).toBe(true);
    expect(isGuestConvertAllowed("jpeg", "jpeg", true)).toBe(false);
    expect(isGuestConvertAllowed("png", "png", true)).toBe(false);
  });

  it("hides AVIF when unsupported", () => {
    expect(isGuestConvertAllowed("jpeg", "avif", false)).toBe(false);
    expect(listGuestConvertTargets("jpeg", false)).not.toContain("avif");
    expect(listGuestConvertTargets("jpeg", true)).toContain("avif");
  });

  it("rejects unsupported targets", () => {
    expect(isGuestConvertAllowed("jpeg", "gif", true)).toBe(false);
    expect(isGuestConvertAllowed("tiff", "webp", true)).toBe(false);
  });
});

describe("guest convert options", () => {
  it("maps presets without exposing raw client quality", () => {
    expect(encoderSettingsForPreset("smaller").jpegQuality).toBeLessThan(
      encoderSettingsForPreset("balanced").jpegQuality,
    );
    expect(encoderSettingsForPreset("higher").webpQuality).toBeGreaterThan(
      encoderSettingsForPreset("balanced").webpQuality,
    );
  });

  it("requires jpeg background when alpha → jpeg", () => {
    expect(() =>
      parseGuestConvertOptions(
        {targetFormat: "jpeg", qualityPreset: "balanced"},
        {sourceFormat: "png", hasAlpha: true, avifSupported: true},
      ),
    ).toThrow("JPEG_BACKGROUND_REQUIRED");

    const ok = parseGuestConvertOptions(
      {targetFormat: "jpeg", qualityPreset: "balanced", jpegBackground: "white"},
      {sourceFormat: "png", hasAlpha: true, avifSupported: true},
    );
    expect(ok.jpegBackground).toBe("white");
  });

  it("rejects raw quality fields and invalid presets", () => {
    expect(() =>
      parseGuestConvertOptions(
        {targetFormat: "webp", qualityPreset: "balanced", quality: 50},
        {sourceFormat: "jpeg", hasAlpha: false, avifSupported: true},
      ),
    ).toThrow("INVALID_OPTIONS");
    expect(() =>
      parseGuestConvertOptions(
        {targetFormat: "webp", qualityPreset: "ultra"},
        {sourceFormat: "jpeg", hasAlpha: false, avifSupported: true},
      ),
    ).toThrow("INVALID_PRESET");
  });

  it("idempotency ignores identical allow-listed options", () => {
    const a = parseGuestConvertOptions(
      {targetFormat: "webp", qualityPreset: "balanced"},
      {sourceFormat: "jpeg", hasAlpha: false, avifSupported: true},
    );
    const b = parseGuestConvertOptions(
      {targetFormat: "webp", qualityPreset: "balanced", jpegBackground: null},
      {sourceFormat: "jpeg", hasAlpha: false, avifSupported: true},
    );
    expect(guestConvertOptionsEqual(a, b)).toBe(true);
  });

  it("maps mime to trusted source format", () => {
    expect(sourceFormatFromMime("image/jpeg")).toBe("jpeg");
    expect(sourceFormatFromMime("image/png")).toBe("png");
    expect(sourceFormatFromMime("image/webp")).toBe("webp");
    expect(sourceFormatFromMime("image/gif")).toBeNull();
  });
});
