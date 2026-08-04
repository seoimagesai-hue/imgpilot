import {describe, expect, it} from "vitest";
import sharp from "sharp";
import {extractSafeGuestMetadata} from "@/server/guest/metadata-extract";

async function makeJpeg(): Promise<Buffer> {
  return sharp({
    create: {width: 80, height: 60, channels: 3, background: {r: 20, g: 40, b: 80}},
  })
    .jpeg()
    .toBuffer();
}

async function makePngWithAlpha(): Promise<Buffer> {
  return sharp({
    create: {
      width: 40,
      height: 30,
      channels: 4,
      background: {r: 255, g: 0, b: 0, alpha: 0.5},
    },
  })
    .png()
    .toBuffer();
}

describe("guest metadata extraction", () => {
  it("extracts JPEG general fields and allow-listed camera/GPS", async () => {
    const piexif = await import("piexifjs");
    const raw = await makeJpeg();
    const dataUri = `data:image/jpeg;base64,${raw.toString("base64")}`;
    const zeroth: Record<number, unknown> = {};
    const exifIfd: Record<number, unknown> = {};
    const gps: Record<number, unknown> = {};
    zeroth[piexif.ImageIFD.Make] = "TestMake";
    zeroth[piexif.ImageIFD.Model] = "TestModel";
    zeroth[piexif.ImageIFD.Software] = "UnitTest";
    exifIfd[piexif.ExifIFD.ISOSpeedRatings] = 200;
    exifIfd[piexif.ExifIFD.FNumber] = [28, 10];
    exifIfd[piexif.ExifIFD.DateTimeOriginal] = "2024:05:06 07:08:09";
    // Sensitive fields that must not appear in safe result.
    zeroth[piexif.ImageIFD.Artist] = "Secret Owner";
    zeroth[piexif.ImageIFD.Copyright] = "Secret Copyright";
    gps[piexif.GPSIFD.GPSLatitudeRef] = "N";
    gps[piexif.GPSIFD.GPSLatitude] = [
      [33, 1],
      [41, 1],
      [3800, 100],
    ];
    gps[piexif.GPSIFD.GPSLongitudeRef] = "E";
    gps[piexif.GPSIFD.GPSLongitude] = [
      [73, 1],
      [2, 1],
      [5244, 100],
    ];
    gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
    gps[piexif.GPSIFD.GPSAltitude] = [5400, 10];
    const withExif = Buffer.from(
      piexif
        .insert(piexif.dump({"0th": zeroth, Exif: exifIfd, GPS: gps}), dataUri)
        .replace(/^data:image\/jpeg;base64,/, ""),
      "base64",
    );

    const result = await extractSafeGuestMetadata({
      buffer: withExif,
      mimeType: "image/jpeg",
      filename: "photo.jpg",
      byteSize: withExif.byteLength,
      startedAt: Date.now(),
    });

    expect(result.schemaVersion).toBe("guest-image-metadata-v2");
    expect(result.file.format).toBe("jpeg");
    expect(result.image.width).toBe(80);
    expect(result.image.height).toBe(60);
    expect(result.image.aspectRatio).toBe("4:3");
    expect(result.camera.make).toBe("TestMake");
    expect(result.camera.model).toBe("TestModel");
    expect(result.camera.iso).toBe(200);
    expect(result.camera.aperture).toBe("f/2.8");
    expect(result.camera.dateTaken).toBe("2024:05:06 07:08:09");
    expect(result.gps.present).toBe(true);
    expect(result.gps.readable).toBe(true);
    expect(result.gps.latitude).not.toBeNull();
    expect(result.gps.longitude).not.toBeNull();
    expect(JSON.stringify(result)).not.toContain("Secret Owner");
    expect(JSON.stringify(result)).not.toContain("Secret Copyright");
    expect(JSON.stringify(result)).not.toContain("storageKey");
  });

  it("extracts PNG alpha without inventing camera EXIF", async () => {
    const png = await makePngWithAlpha();
    const result = await extractSafeGuestMetadata({
      buffer: png,
      mimeType: "image/png",
      filename: "a.png",
      byteSize: png.byteLength,
      startedAt: Date.now(),
    });
    expect(result.file.format).toBe("png");
    expect(result.image.hasAlpha).toBe(true);
    expect(result.camera.make).toBeNull();
    expect(result.gps.present).toBe(false);
  });

  it("extracts WebP dimensions", async () => {
    const webp = await sharp({
      create: {width: 32, height: 24, channels: 3, background: {r: 1, g: 2, b: 3}},
    })
      .webp()
      .toBuffer();
    const result = await extractSafeGuestMetadata({
      buffer: webp,
      mimeType: "image/webp",
      filename: "w.webp",
      byteSize: webp.byteLength,
      startedAt: Date.now(),
    });
    expect(result.file.format).toBe("webp");
    expect(result.image.width).toBe(32);
    expect(result.image.height).toBe(24);
    expect(result.image.pixelCount).toBe(768);
  });

  it("rejects unsupported mime for extraction", async () => {
    const jpeg = await makeJpeg();
    await expect(
      extractSafeGuestMetadata({
        buffer: jpeg,
        mimeType: "image/svg+xml",
        filename: "x.svg",
        byteSize: jpeg.byteLength,
        startedAt: Date.now(),
      }),
    ).rejects.toThrow("FORMAT_UNSUPPORTED");
  });
});
