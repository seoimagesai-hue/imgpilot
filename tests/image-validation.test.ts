import {readFileSync, existsSync} from "node:fs";
import {join} from "node:path";
import {describe, expect, it} from "vitest";
import {compareDeclaredVersusDetected, mapSharpFormatToTrusted} from "@/server/images/format-map";
import {inspectAndFullyDecodeImage} from "@/server/images/image-inspector";
import {
  MAX_ANIMATION_FRAMES,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  MAX_TOTAL_ANIMATED_PIXELS,
  MAX_TOTAL_PIXELS,
  checkAnimationLimits,
  checkDimensions,
  multiplyAnimatedPixels,
  multiplyPixels,
} from "@/server/images/validation-policy";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "images");

function fixture(name: string): Buffer {
  return readFileSync(join(fixtureDir, name));
}

describe("validation policy", () => {
  it("accepts width at boundary", () => {
    const result = checkDimensions(MAX_IMAGE_WIDTH, 1);
    expect(result.ok).toBe(true);
  });

  it("rejects width above limit", () => {
    const result = checkDimensions(MAX_IMAGE_WIDTH + 1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WIDTH_LIMIT_EXCEEDED");
  });

  it("accepts height at boundary", () => {
    expect(checkDimensions(1, MAX_IMAGE_HEIGHT).ok).toBe(true);
  });

  it("rejects height above limit", () => {
    const result = checkDimensions(1, MAX_IMAGE_HEIGHT + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("HEIGHT_LIMIT_EXCEEDED");
  });

  it("accepts pixel count at boundary", () => {
    // 10000 x 10000 = 100_000_000
    expect(checkDimensions(10_000, 10_000).ok).toBe(true);
  });

  it("rejects pixel count above boundary", () => {
    const result = checkDimensions(10_001, 10_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("PIXEL_LIMIT_EXCEEDED");
  });

  it("safe integer multiplication", () => {
    expect(multiplyPixels(10, 20)).toBe(200);
    expect(multiplyPixels(0, 20)).toBeNull();
    expect(multiplyPixels(-1, 20)).toBeNull();
    expect(multiplyAnimatedPixels(100, 3)).toBe(300);
  });

  it("rejects missing and zero dimensions", () => {
    expect(checkDimensions(null, 10).ok).toBe(false);
    expect(checkDimensions(10, undefined).ok).toBe(false);
    expect(checkDimensions(0, 10).ok).toBe(false);
    expect(checkDimensions(10, 0).ok).toBe(false);
  });

  it("enforces frame and animated pixel limits", () => {
    expect(
      checkAnimationLimits({
        isAnimated: true,
        frameCount: MAX_ANIMATION_FRAMES,
        pixelCount: 100,
        format: "gif",
      }).ok,
    ).toBe(true);
    const tooManyFrames = checkAnimationLimits({
      isAnimated: true,
      frameCount: MAX_ANIMATION_FRAMES + 1,
      pixelCount: 100,
      format: "gif",
    });
    expect(tooManyFrames.ok).toBe(false);
    if (!tooManyFrames.ok) expect(tooManyFrames.code).toBe("FRAME_LIMIT_EXCEEDED");

    const pixels = Math.floor(MAX_TOTAL_ANIMATED_PIXELS / 2) + 1;
    const tooManyAnimated = checkAnimationLimits({
      isAnimated: true,
      frameCount: 2,
      pixelCount: pixels,
      format: "webp",
    });
    expect(tooManyAnimated.ok).toBe(false);
  });

  it("rejects animated avif under current policy", () => {
    const result = checkAnimationLimits({
      isAnimated: true,
      frameCount: 2,
      pixelCount: 100,
      format: "avif",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNSUPPORTED_ANIMATION");
  });

  it("documents max total pixels constant", () => {
    expect(MAX_TOTAL_PIXELS).toBe(100_000_000);
  });
});

describe("format mapping", () => {
  it("maps jpeg/png/webp/gif/avif", () => {
    expect(mapSharpFormatToTrusted({format: "jpeg"}).ok).toBe(true);
    expect(mapSharpFormatToTrusted({format: "png"}).ok).toBe(true);
    expect(mapSharpFormatToTrusted({format: "webp"}).ok).toBe(true);
    expect(mapSharpFormatToTrusted({format: "gif"}).ok).toBe(true);
    expect(mapSharpFormatToTrusted({format: "avif"}).ok).toBe(true);
  });

  it("rejects svg/tiff/pdf/unknown and plain heic", () => {
    expect(mapSharpFormatToTrusted({format: "svg"}).ok).toBe(false);
    expect(mapSharpFormatToTrusted({format: "tiff"}).ok).toBe(false);
    expect(mapSharpFormatToTrusted({format: "pdf"}).ok).toBe(false);
    expect(mapSharpFormatToTrusted({format: "unknown"}).ok).toBe(false);
    expect(mapSharpFormatToTrusted({format: "heic"}).ok).toBe(false);
    expect(mapSharpFormatToTrusted({format: "heif", compression: "hevc"}).ok).toBe(false);
  });

  it("accepts heif+av1 as avif", () => {
    const result = mapSharpFormatToTrusted({format: "heif", compression: "av1"});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.format).toBe("avif");
  });
});

describe("declared versus detected", () => {
  it("passes matching jpeg", () => {
    expect(
      compareDeclaredVersusDetected({
        declaredMime: "image/jpeg",
        fileExtension: "jpg",
        detectedFormat: "jpeg",
        detectedMime: "image/jpeg",
      }).ok,
    ).toBe(true);
  });

  it("fails jpeg extension with png content", () => {
    const result = compareDeclaredVersusDetected({
      declaredMime: "image/jpeg",
      fileExtension: "jpg",
      detectedFormat: "png",
      detectedMime: "image/png",
    });
    expect(result.ok).toBe(false);
  });

  it("fails png mime with jpeg content", () => {
    const result = compareDeclaredVersusDetected({
      declaredMime: "image/png",
      fileExtension: "png",
      detectedFormat: "jpeg",
      detectedMime: "image/jpeg",
    });
    expect(result.ok).toBe(false);
  });

  it("normalizes jpeg alias", () => {
    expect(
      compareDeclaredVersusDetected({
        declaredMime: "image/jpeg",
        fileExtension: "JPEG",
        detectedFormat: "jpeg",
        detectedMime: "image/jpeg",
      }).ok,
    ).toBe(true);
  });
});

describe("real Sharp decoder fixtures", () => {
  it("has fixtures generated", () => {
    expect(existsSync(join(fixtureDir, "valid.jpg"))).toBe(true);
  });

  it("decodes valid jpeg with full decode flag", async () => {
    const result = await inspectAndFullyDecodeImage(fixture("valid.jpg"));
    expect(result.fullDecodePerformed).toBe(true);
    expect(result.format).toBe("jpeg");
    expect(result.width).toBe(32);
    expect(result.height).toBe(24);
    expect(result.pixelCount).toBe(32 * 24);
  });

  it("decodes valid png", async () => {
    const result = await inspectAndFullyDecodeImage(fixture("valid.png"));
    expect(result.fullDecodePerformed).toBe(true);
    expect(result.format).toBe("png");
  });

  it("decodes valid webp", async () => {
    const result = await inspectAndFullyDecodeImage(fixture("valid.webp"));
    expect(result.fullDecodePerformed).toBe(true);
    expect(result.format).toBe("webp");
  });

  it("rejects truncated jpeg", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("truncated.jpg"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects corrupt png", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("corrupt.png"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects random bytes", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("random.bin"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects svg disguised as png", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("disguised-svg.png"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects pdf disguised as jpeg", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("disguised-pdf.jpg"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects zip disguised as webp", async () => {
    await expect(inspectAndFullyDecodeImage(fixture("disguised-zip.webp"))).rejects.toMatchObject({
      name: "ValidationDomainError",
    });
  });

  it("rejects empty buffer", async () => {
    await expect(inspectAndFullyDecodeImage(Buffer.alloc(0))).rejects.toMatchObject({
      code: "EMPTY_OBJECT",
    });
  });

  it("extracts orientation when present", async () => {
    const result = await inspectAndFullyDecodeImage(fixture("orientation.jpg"));
    expect(result.fullDecodePerformed).toBe(true);
    expect(result.orientation).toBe(6);
    // Encoded dimensions are stored as-is (not display-swapped).
    expect(result.width).toBe(40);
    expect(result.height).toBe(20);
  });
});
