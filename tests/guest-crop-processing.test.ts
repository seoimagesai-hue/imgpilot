import {describe, expect, it} from "vitest";
import sharp from "sharp";
import {
  GUEST_CROP_MIN_EDGE_PX,
  normalizedCropToPixels,
} from "@/lib/guest/crop-policy";

/**
 * Sharp-level crop processing checks (no R2 / DB).
 * Orientation: rotate() then extract must match browser-oriented selection.
 */
describe("guest crop sharp processing", () => {
  it("crops JPEG same-format with verified output dimensions", async () => {
    const source = await sharp({
      create: {width: 200, height: 100, channels: 3, background: {r: 20, g: 40, b: 60}},
    })
      .jpeg()
      .toBuffer();

    const rect = normalizedCropToPixels(200, 100, {x: 0.25, y: 0.1, width: 0.5, height: 0.8});
    expect(rect.width).toBeGreaterThanOrEqual(GUEST_CROP_MIN_EDGE_PX);

    const output = await sharp(source)
      .rotate()
      .extract(rect)
      .jpeg()
      .toBuffer({resolveWithObject: true});

    expect(output.info.width).toBe(rect.width);
    expect(output.info.height).toBe(rect.height);
    expect(output.info.format).toBe("jpeg");
  });

  it("preserves PNG alpha through crop", async () => {
    const source = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 4,
        background: {r: 255, g: 0, b: 0, alpha: 0.5},
      },
    })
      .png()
      .toBuffer();

    const rect = {left: 8, top: 8, width: 32, height: 32};
    const output = await sharp(source).rotate().extract(rect).png().toBuffer({resolveWithObject: true});
    expect(output.info.width).toBe(32);
    expect(output.info.height).toBe(32);
    expect(output.info.hasAlpha).toBe(true);
    expect(output.info.format).toBe("png");
  });

  it("crops WebP same-format", async () => {
    const source = await sharp({
      create: {width: 120, height: 80, channels: 3, background: {r: 10, g: 20, b: 30}},
    })
      .webp()
      .toBuffer();
    const rect = normalizedCropToPixels(120, 80, {x: 0, y: 0, width: 0.5, height: 0.5});
    const output = await sharp(source).rotate().extract(rect).webp().toBuffer({resolveWithObject: true});
    expect(output.info.format).toBe("webp");
    expect(output.info.width).toBe(rect.width);
    expect(output.info.height).toBe(rect.height);
  });

  it("orients EXIF-rotated JPEG before extract so coords match display", async () => {
    // Landscape pixel grid + EXIF Orientation 6 → viewers treat as portrait (40×80).
    // piexif is already a project dependency (metadata tooling).
    const piexif = await import("piexifjs");
    const raw = await sharp({
      create: {width: 80, height: 40, channels: 3, background: {r: 0, g: 255, b: 0}},
    })
      .jpeg()
      .toBuffer();

    const dataUri = `data:image/jpeg;base64,${raw.toString("base64")}`;
    const zeroth: Record<string | number, unknown> = {};
    zeroth[piexif.ImageIFD.Orientation] = 6;
    const exifBytes = piexif.dump({
      "0th": zeroth,
      Exif: {},
      GPS: {},
    });
    const withExif = Buffer.from(
      piexif.insert(exifBytes, dataUri).replace(/^data:image\/jpeg;base64,/, ""),
      "base64",
    );

    const afterRotate = await sharp(withExif).rotate().toBuffer({resolveWithObject: true});
    expect(afterRotate.info.width).toBe(40);
    expect(afterRotate.info.height).toBe(80);

    const rect = normalizedCropToPixels(40, 80, {
      x: 0,
      y: 0,
      width: 1,
      height: 0.5,
    });
    const output = await sharp(withExif)
      .rotate()
      .extract(rect)
      .jpeg()
      .toBuffer({resolveWithObject: true});

    expect(output.info.width).toBe(40);
    expect(output.info.height).toBe(40);
  });
});
