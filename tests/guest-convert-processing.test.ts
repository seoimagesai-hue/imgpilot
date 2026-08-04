import {createHash} from "node:crypto";
import {describe, expect, it} from "vitest";
import sharp from "sharp";
import {
  encoderSettingsForPreset,
  guestConvertExtension,
} from "@/lib/guest/convert-policy";
import {isGuestAvifEncodeSupported} from "@/server/guest/avif-capability";

async function makePngWithAlpha(): Promise<Buffer> {
  return sharp({
    create: {
      width: 48,
      height: 48,
      channels: 4,
      background: {r: 255, g: 0, b: 0, alpha: 0.4},
    },
  })
    .png()
    .toBuffer();
}

describe("guest convert sharp processing", () => {
  it("converts JPEG → WebP with orientation normalize", async () => {
    const piexif = await import("piexifjs");
    const raw = await sharp({
      create: {width: 80, height: 40, channels: 3, background: {r: 0, g: 120, b: 200}},
    })
      .jpeg()
      .toBuffer();
    const dataUri = `data:image/jpeg;base64,${raw.toString("base64")}`;
    const zeroth: Record<string | number, unknown> = {};
    zeroth[piexif.ImageIFD.Orientation] = 6;
    const withExif = Buffer.from(
      piexif.insert(piexif.dump({"0th": zeroth, Exif: {}, GPS: {}}), dataUri).replace(
        /^data:image\/jpeg;base64,/,
        "",
      ),
      "base64",
    );
    const sourceChecksum = createHash("sha256").update(withExif).digest("hex");

    const settings = encoderSettingsForPreset("balanced");
    const output = await sharp(withExif)
      .rotate()
      .webp({quality: settings.webpQuality})
      .toBuffer({resolveWithObject: true});

    expect(output.info.format).toBe("webp");
    expect(output.info.width).toBe(40);
    expect(output.info.height).toBe(80);
    expect(createHash("sha256").update(withExif).digest("hex")).toBe(sourceChecksum);
    expect(guestConvertExtension("webp")).toBe("webp");
  });

  it("preserves PNG alpha through WebP conversion", async () => {
    const source = await makePngWithAlpha();
    const settings = encoderSettingsForPreset("higher");
    const output = await sharp(source)
      .rotate()
      .webp({quality: settings.webpQuality})
      .toBuffer();
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.hasAlpha).toBe(true);
  });

  it("flattens PNG alpha to JPEG with white background", async () => {
    const source = await makePngWithAlpha();
    const settings = encoderSettingsForPreset("balanced");
    const output = await sharp(source)
      .rotate()
      .flatten({background: {r: 255, g: 255, b: 255}})
      .jpeg({quality: settings.jpegQuality, mozjpeg: true})
      .toBuffer();
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.hasAlpha).toBeFalsy();
  });

  it("flattens PNG alpha to JPEG with black background", async () => {
    const source = await makePngWithAlpha();
    const settings = encoderSettingsForPreset("smaller");
    const output = await sharp(source)
      .rotate()
      .flatten({background: {r: 0, g: 0, b: 0}})
      .jpeg({quality: settings.jpegQuality, mozjpeg: true})
      .toBuffer();
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.hasAlpha).toBeFalsy();
  });

  it("converts WebP → PNG", async () => {
    const source = await sharp({
      create: {width: 32, height: 24, channels: 3, background: {r: 1, g: 2, b: 3}},
    })
      .webp()
      .toBuffer();
    const output = await sharp(source).rotate().png({compressionLevel: 7}).toBuffer({
      resolveWithObject: true,
    });
    expect(output.info.format).toBe("png");
    expect(output.info.width).toBe(32);
    expect(output.info.height).toBe(24);
  });

  it("encodes AVIF only when runtime probe succeeds", async () => {
    const supported = await isGuestAvifEncodeSupported();
    if (!supported) {
      expect(supported).toBe(false);
      return;
    }
    const source = await sharp({
      create: {width: 24, height: 24, channels: 3, background: {r: 9, g: 8, b: 7}},
    })
      .jpeg()
      .toBuffer();
    const settings = encoderSettingsForPreset("balanced");
    const output = await sharp(source)
      .rotate()
      .avif({quality: settings.avifQuality, effort: settings.avifEffort})
      .toBuffer({resolveWithObject: true});
    expect(output.info.format).toBe("avif");
    const verified = await sharp(output.data).metadata();
    expect(verified.format).toBe("avif");
  });
});
