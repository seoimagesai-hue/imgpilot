import {describe, expect, it} from "vitest";
import {
  aspectRatioLabel,
  assertSafeMetadataResultSize,
  formatSafeMetadataJson,
  formatSafeMetadataTxt,
  GUEST_METADATA_OPERATION,
  guestMetadataOptionsEqual,
  isGuestMetadataMime,
  parseGuestMetadataOptions,
  sanitizeMetadataString,
  type SafeMetadataResult,
} from "@/lib/guest/metadata-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";
import {metadataToolConfig} from "@/components/guest/tools/metadata-tool";
import {geotagToolConfig} from "@/components/guest/tools/geotag-tool";

function sampleResult(overrides?: Partial<SafeMetadataResult>): SafeMetadataResult {
  return {
    schemaVersion: "guest-image-metadata-v2",
    file: {
      filename: "sample.jpg",
      format: "jpeg",
      mimeType: "image/jpeg",
      byteSize: 1234,
    },
    image: {
      width: 1600,
      height: 900,
      aspectRatio: "16:9",
      pixelCount: 1_440_000,
      orientation: 1,
      animated: false,
      frameCount: 1,
      hasAlpha: false,
      colorSpace: "srgb",
      channels: 3,
      bitDepth: "uchar",
      densityX: 72,
      densityY: 72,
      densityUnit: "dpi",
      printWidthInches: 22.22,
      printHeightInches: 12.5,
      iccProfilePresent: false,
      progressive: false,
      chromaSubsampling: "4:2:0",
    },
    camera: {
      make: "DemoCam",
      model: "X1",
      lens: null,
      iso: 100,
      exposureTime: "1/125",
      aperture: "f/2.8",
      focalLength: "35 mm",
      flash: "No flash",
      whiteBalance: "Auto",
      exposureProgram: null,
      meteringMode: null,
      dateTaken: "2024:01:02 03:04:05",
      software: null,
    },
    gps: {
      present: true,
      readable: true,
      latitude: 33.6844,
      longitude: 73.0479,
      altitudeMeters: 540,
    },
    durationMs: 12,
    ...overrides,
  };
}

describe("guest metadata architecture", () => {
  it("registers metadata.inspect and mounts shared workspace config", () => {
    expect(GUEST_METADATA_OPERATION).toBe("metadata.inspect");
    expect(isGuestSupportedOperation(GUEST_METADATA_OPERATION)).toBe(true);
    expect(metadataToolConfig.operation).toBe(GUEST_METADATA_OPERATION);
    expect(metadataToolConfig.toolCode).toBe("image-metadata");
    expect(metadataToolConfig.hideImageDownload).toBe(true);
    expect(metadataToolConfig.CustomResultPanel).toBeTruthy();
    expect(metadataToolConfig.OptionsPanel).toBeTruthy();
    expect(geotagToolConfig.OptionsPanel).toBeTruthy();
  });

  it("accepts only JPEG/PNG/WebP", () => {
    expect(isGuestMetadataMime("image/jpeg")).toBe(true);
    expect(isGuestMetadataMime("image/png")).toBe(true);
    expect(isGuestMetadataMime("image/webp")).toBe(true);
    expect(isGuestMetadataMime("image/avif")).toBe(false);
    expect(isGuestMetadataMime("image/gif")).toBe(false);
    expect(isGuestMetadataMime("image/tiff")).toBe(false);
    expect(isGuestMetadataMime("image/svg+xml")).toBe(false);
  });
});

describe("guest metadata policy", () => {
  it("parses empty options and rejects raw EXIF bags", () => {
    expect(parseGuestMetadataOptions(null).schemaVersion).toBe("guest-image-metadata-v2");
    expect(() => parseGuestMetadataOptions({exif: {}})).toThrow("INVALID_OPTIONS");
    expect(() => parseGuestMetadataOptions({scrubbed: true})).toThrow("INVALID_OPTIONS");
  });

  it("sanitizes strings and computes aspect ratios", () => {
    expect(sanitizeMetadataString("  ok\u0000 ")).toBe("ok");
    expect(sanitizeMetadataString("a".repeat(200))?.length).toBe(120);
    expect(aspectRatioLabel(1600, 900)).toBe("16:9");
  });

  it("formats TXT/JSON exports without internal fields", () => {
    const txt = formatSafeMetadataTxt(sampleResult(), {
      file: "File",
      image: "Image",
      camera: "Camera",
      gps: "GPS",
      color: "Color",
      resolution: "Resolution",
      animation: "Animation",
      privacy: "Privacy",
      filename: "Filename",
      format: "Format",
      mimeType: "MIME",
      byteSize: "Size",
      width: "Width",
      height: "Height",
      aspectRatio: "Aspect",
      pixelCount: "Pixels",
      orientation: "Orientation",
      animated: "Animated",
      frameCount: "Frames",
      hasAlpha: "Alpha",
      colorSpace: "Color space",
      channels: "Channels",
      bitDepth: "Bit depth",
      density: "Density",
      printSize: "Print",
      printSizeNote: "calculated",
      icc: "ICC",
      progressive: "Progressive",
      chroma: "Chroma",
      make: "Make",
      model: "Model",
      lens: "Lens",
      iso: "ISO",
      exposureTime: "Exposure",
      aperture: "Aperture",
      focalLength: "Focal",
      flash: "Flash",
      whiteBalance: "WB",
      exposureProgram: "Program",
      meteringMode: "Metering",
      dateTaken: "Date",
      software: "Software",
      gpsPresent: "GPS present",
      gpsAbsent: "No GPS",
      gpsUnreadable: "Unreadable",
      latitude: "Lat",
      longitude: "Lon",
      altitude: "Alt",
      gpsSensitive: "SENSITIVE",
      na: "n/a",
      yes: "yes",
      no: "no",
    });
    expect(txt).toContain("DemoCam");
    expect(txt).toContain("33.6844");
    expect(txt).toContain("SENSITIVE");
    expect(txt).not.toContain("storageKey");
    expect(txt).not.toContain("signed");

    const json = formatSafeMetadataJson(sampleResult());
    expect(json).toContain('"schemaVersion"');
    expect(json).not.toContain("durationMs");
    expect(json).not.toContain("storageKey");
  });

  it("enforces result size and option equality", () => {
    expect(() => assertSafeMetadataResultSize(sampleResult())).not.toThrow();
    expect(
      guestMetadataOptionsEqual(
        {schemaVersion: "guest-image-metadata-v2"},
        {schemaVersion: "guest-image-metadata-v2"},
      ),
    ).toBe(true);
    expect(guestMetadataOptionsEqual({scrubbed: true}, {schemaVersion: "guest-image-metadata-v2"})).toBe(
      false,
    );
  });
});
