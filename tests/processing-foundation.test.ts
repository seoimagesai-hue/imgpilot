import {describe, expect, it} from "vitest";
import {
  METADATA_POLICY_SUMMARY,
  estimateDecodedMemoryBytes,
  getProcessingPolicy,
  isProcessingSourceFormat,
} from "@/server/images/processing-policy";
import {
  computeResizeTargetDimensions,
  getResizePolicy,
  isResizePresetId,
} from "@/server/images/resize-policy";
import {buildDerivativeStorageKey, isValidDerivativeStorageKeyShape} from "@/server/storage/keys";
import {optimizeSameFormat, resizeSameFormat} from "@/server/images/processing-optimizer";
import sharp from "sharp";

describe("processing policy", () => {
  it("defines same-format operation without resize/conversion claims", () => {
    const policy = getProcessingPolicy();
    expect(policy.operation).toBe("optimize_same_format");
    expect(policy.dimensionsChange).toBe(false);
    expect(policy.formatChange).toBe(false);
    expect(policy.losslessClaim).toBe(false);
    expect(policy.animatedSupported).toBe(false);
    expect(policy.gifSupported).toBe(false);
  });

  it("documents metadata stripping policy", () => {
    expect(METADATA_POLICY_SUMMARY.exifRetained).toBe(false);
    expect(METADATA_POLICY_SUMMARY.gpsRetained).toBe(false);
    expect(METADATA_POLICY_SUMMARY.rotateNormalized).toBe(false);
  });

  it("accepts jpeg/png/webp/avif only", () => {
    expect(isProcessingSourceFormat("jpeg")).toBe(true);
    expect(isProcessingSourceFormat("gif")).toBe(false);
    expect(isProcessingSourceFormat("svg")).toBe(false);
  });

  it("estimates decoded memory", () => {
    expect(estimateDecodedMemoryBytes(100, 100)).toBe(40_000);
  });
});

describe("resize policy", () => {
  it("exposes fixed presets only", () => {
    const policy = getResizePolicy();
    expect(policy.neverUpscale).toBe(true);
    expect(policy.preserveAspectRatio).toBe(true);
    expect(policy.formatChange).toBe(false);
    expect(policy.presets.map((p) => p.id)).toEqual([
      "px_256",
      "px_512",
      "px_1024",
      "px_2048",
    ]);
    expect(isResizePresetId("px_1024")).toBe(true);
    expect(isResizePresetId("9999")).toBe(false);
  });

  it("does not upscale tiny originals", () => {
    const target = computeResizeTargetDimensions({
      sourceWidth: 400,
      sourceHeight: 300,
      maxEdge: 1024,
    });
    expect(target).toEqual({width: 400, height: 300, scaled: false});
  });

  it("scales landscape preserving aspect ratio", () => {
    const target = computeResizeTargetDimensions({
      sourceWidth: 2000,
      sourceHeight: 1000,
      maxEdge: 1024,
    });
    expect(target.scaled).toBe(true);
    expect(target.width).toBe(1024);
    expect(target.height).toBe(512);
  });

  it("scales portrait preserving aspect ratio", () => {
    const target = computeResizeTargetDimensions({
      sourceWidth: 600,
      sourceHeight: 1200,
      maxEdge: 512,
    });
    expect(target.width).toBe(256);
    expect(target.height).toBe(512);
  });

  it("scales square", () => {
    const target = computeResizeTargetDimensions({
      sourceWidth: 3000,
      sourceHeight: 3000,
      maxEdge: 256,
    });
    expect(target.width).toBe(256);
    expect(target.height).toBe(256);
  });
});

describe("derivative keys", () => {
  it("never uses originals prefix and includes variant", () => {
    const key = buildDerivativeStorageKey({
      userId: "u",
      projectId: "p",
      imageId: "i",
      jobId: "j",
      attempt: 1,
      safeFilenameSuffix: "opt.jpg",
      variant: "px_1024",
    });
    expect(key.includes("/originals/")).toBe(false);
    expect(key.includes("/derivatives/")).toBe(true);
    expect(key.includes("/px_1024/")).toBe(true);
    expect(isValidDerivativeStorageKeyShape(key)).toBe(true);
  });
});

describe("optimizeSameFormat", () => {
  it("preserves jpeg dimensions and format", async () => {
    const body = await sharp({
      create: {width: 48, height: 32, channels: 3, background: {r: 10, g: 20, b: 30}},
    })
      .jpeg()
      .toBuffer();

    const out = await optimizeSameFormat({
      body,
      expectedFormat: "jpeg",
      expectedWidth: 48,
      expectedHeight: 32,
      isAnimated: false,
    });

    expect(out.format).toBe("jpeg");
    expect(out.width).toBe(48);
    expect(out.height).toBe(32);
    expect(out.byteSize).toBeGreaterThan(0);
    expect(out.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(out.metadataPolicy.exifRetained).toBe(false);
  });

  it("rejects animated sources", async () => {
    const body = Buffer.from("x");
    await expect(
      optimizeSameFormat({
        body,
        expectedFormat: "jpeg",
        expectedWidth: 1,
        expectedHeight: 1,
        isAnimated: true,
      }),
    ).rejects.toMatchObject({code: "SOURCE_ANIMATION_UNSUPPORTED"});
  });

  it("preserves png dimensions, format, and alpha", async () => {
    const body = await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 4,
        background: {r: 0, g: 120, b: 200, alpha: 0.5},
      },
    })
      .png()
      .toBuffer();

    const out = await optimizeSameFormat({
      body,
      expectedFormat: "png",
      expectedWidth: 24,
      expectedHeight: 24,
      isAnimated: false,
    });

    expect(out.format).toBe("png");
    expect(out.width).toBe(24);
    expect(out.height).toBe(24);
    const meta = await sharp(out.body).metadata();
    expect(meta.hasAlpha).toBe(true);
  });
});

describe("resizeSameFormat", () => {
  it("downscales landscape without upscaling or format change", async () => {
    const body = await sharp({
      create: {width: 800, height: 400, channels: 3, background: {r: 40, g: 80, b: 120}},
    })
      .jpeg()
      .toBuffer();

    const out = await resizeSameFormat({
      body,
      expectedFormat: "jpeg",
      expectedWidth: 800,
      expectedHeight: 400,
      isAnimated: false,
      preset: "px_256",
    });

    expect(out.format).toBe("jpeg");
    expect(out.width).toBe(256);
    expect(out.height).toBe(128);
    expect(out.width).toBeLessThanOrEqual(800);
    expect(out.height).toBeLessThanOrEqual(400);
  });

  it("does not upscale tiny originals for large presets", async () => {
    const body = await sharp({
      create: {width: 400, height: 300, channels: 3, background: {r: 1, g: 2, b: 3}},
    })
      .jpeg()
      .toBuffer();

    const out = await resizeSameFormat({
      body,
      expectedFormat: "jpeg",
      expectedWidth: 400,
      expectedHeight: 300,
      isAnimated: false,
      preset: "px_1024",
    });

    expect(out.width).toBe(400);
    expect(out.height).toBe(300);
    expect(out.scaled).toBe(false);
  });

  it("preserves png alpha on resize", async () => {
    const body = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: {r: 10, g: 20, b: 30, alpha: 0.4},
      },
    })
      .png()
      .toBuffer();

    const out = await resizeSameFormat({
      body,
      expectedFormat: "png",
      expectedWidth: 400,
      expectedHeight: 400,
      isAnimated: false,
      preset: "px_256",
    });

    expect(out.width).toBe(256);
    expect(out.height).toBe(256);
    const meta = await sharp(out.body).metadata();
    expect(meta.hasAlpha).toBe(true);
  });
});

describe("processing reconcile safety", () => {
  it("exports bounded batch constant", async () => {
    const {PROCESSING_RECONCILE_BATCH} = await import(
      "@/server/images/processing-reconcile"
    );
    expect(PROCESSING_RECONCILE_BATCH).toBeGreaterThan(0);
    expect(PROCESSING_RECONCILE_BATCH).toBeLessThanOrEqual(200);
  });
});

describe("conversion policy", () => {
  it("enforces source→target matrix and rejects PNG→JPEG", async () => {
    const {
      getConversionPolicy,
      isConversionAllowed,
      listAllowedTargetsForSource,
    } = await import("@/server/images/conversion-policy");
    const policy = getConversionPolicy();
    expect(policy.neverFlattenPngToJpeg).toBe(true);
    expect(policy.dimensionsChange).toBe(false);
    expect(isConversionAllowed("jpeg", "webp")).toBe(true);
    expect(isConversionAllowed("png", "jpeg")).toBe(false);
    expect(isConversionAllowed("webp", "png")).toBe(false);
    expect(isConversionAllowed("avif", "avif")).toBe(true);
    expect(listAllowedTargetsForSource("png")).toEqual(["png", "webp", "avif"]);
  });
});

describe("convertFormat", () => {
  it("converts jpeg to webp with same dimensions", async () => {
    const {convertFormat} = await import("@/server/images/processing-optimizer");
    const body = await sharp({
      create: {width: 64, height: 48, channels: 3, background: {r: 10, g: 20, b: 30}},
    })
      .jpeg()
      .toBuffer();

    const out = await convertFormat({
      body,
      expectedFormat: "jpeg",
      expectedWidth: 64,
      expectedHeight: 48,
      isAnimated: false,
      targetFormat: "webp",
    });

    expect(out.format).toBe("webp");
    expect(out.width).toBe(64);
    expect(out.height).toBe(48);
    expect(out.mimeType).toBe("image/webp");
  });

  it("preserves png alpha when converting to webp", async () => {
    const {convertFormat} = await import("@/server/images/processing-optimizer");
    const body = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: {r: 0, g: 80, b: 160, alpha: 0.5},
      },
    })
      .png()
      .toBuffer();

    const out = await convertFormat({
      body,
      expectedFormat: "png",
      expectedWidth: 32,
      expectedHeight: 32,
      isAnimated: false,
      targetFormat: "webp",
    });

    expect(out.format).toBe("webp");
    const meta = await sharp(out.body).metadata();
    expect(meta.hasAlpha).toBe(true);
  });

  it("rejects png to jpeg at engine safety layer", async () => {
    const {convertFormat} = await import("@/server/images/processing-optimizer");
    const body = await sharp({
      create: {width: 16, height: 16, channels: 4, background: {r: 1, g: 2, b: 3, alpha: 0.2}},
    })
      .png()
      .toBuffer();

    await expect(
      convertFormat({
        body,
        expectedFormat: "png",
        expectedWidth: 16,
        expectedHeight: 16,
        isAnimated: false,
        targetFormat: "jpeg",
      }),
    ).rejects.toMatchObject({code: "CONVERSION_UNSUPPORTED"});
  });
});
