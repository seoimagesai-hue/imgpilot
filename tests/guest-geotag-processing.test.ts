import {createHash} from "node:crypto";
import {describe, expect, it} from "vitest";
import sharp from "sharp";
import {
  parseGuestGeotagOptions,
  type GuestGeotagOptions,
} from "@/lib/guest/geotag-policy";
import {
  readSafeGpsFromJpeg,
  verifyGpsRoundTrip,
  writeGpsToJpeg,
} from "@/server/guest/gps-exif";

async function makeJpeg(): Promise<Buffer> {
  return sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: {r: 10, g: 80, b: 160},
    },
  })
    .jpeg()
    .toBuffer();
}

describe("guest geotag EXIF write and round-trip", () => {
  it("writes north/east GPS and verifies read-back", async () => {
    const source = await makeJpeg();
    const checksum = createHash("sha256").update(source).digest("hex");
    const options = parseGuestGeotagOptions({
      latitude: 33.6844,
      longitude: 73.0479,
      altitudeMeters: 540,
      locationLabel: "Islamabad, Pakistan",
      replaceExistingGps: false,
    }) as GuestGeotagOptions;

    const out = writeGpsToJpeg(source, options);
    expect(createHash("sha256").update(source).digest("hex")).toBe(checksum);

    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(64);
    expect(meta.height).toBe(48);

    const verified = verifyGpsRoundTrip(out, options);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.read.latitude).toBeCloseTo(33.6844, 5);
      expect(verified.read.longitude).toBeCloseTo(73.0479, 5);
      expect(verified.read.altitudeMeters).toBeCloseTo(540, 0);
    }
  });

  it("writes south/west and negative altitude", async () => {
    const source = await makeJpeg();
    const options = parseGuestGeotagOptions({
      latitude: -37.8136,
      longitude: -144.9631,
      altitudeMeters: -5,
      replaceExistingGps: true,
    });
    const out = writeGpsToJpeg(source, options);
    const verified = verifyGpsRoundTrip(out, options);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.read.latitude! < 0).toBe(true);
      expect(verified.read.longitude! < 0).toBe(true);
      expect(verified.read.altitudeMeters).toBeCloseTo(-5, 0);
    }
  });

  it("writes zero coordinates with N/E refs", async () => {
    const source = await makeJpeg();
    const options = parseGuestGeotagOptions({latitude: 0, longitude: 0});
    const out = writeGpsToJpeg(source, options);
    const read = readSafeGpsFromJpeg(out);
    expect(read.present).toBe(true);
    expect(read.readable).toBe(true);
    expect(read.latitude).toBe(0);
    expect(read.longitude).toBe(0);
  });

  it("removes previous GPS when rewriting", async () => {
    const source = await makeJpeg();
    const first = parseGuestGeotagOptions({latitude: 10, longitude: 20, altitudeMeters: 100});
    const mid = writeGpsToJpeg(source, first);
    expect(readSafeGpsFromJpeg(mid).latitude).toBeCloseTo(10, 4);

    const second = parseGuestGeotagOptions({
      latitude: -15.5,
      longitude: 120.25,
      replaceExistingGps: true,
    });
    const out = writeGpsToJpeg(mid, second);
    const read = readSafeGpsFromJpeg(out);
    expect(read.latitude).toBeCloseTo(-15.5, 4);
    expect(read.longitude).toBeCloseTo(120.25, 4);
    expect(read.altitudeMeters).toBeNull();
  });

  it("does not expose non-GPS private fields from safe summary", async () => {
    const piexif = await import("piexifjs");
    const raw = await makeJpeg();
    const dataUri = `data:image/jpeg;base64,${raw.toString("base64")}`;
    const zeroth: Record<number, unknown> = {};
    zeroth[piexif.ImageIFD.Make] = "SecretCamera";
    zeroth[piexif.ImageIFD.Orientation] = 1;
    const withMake = Buffer.from(
      piexif.insert(piexif.dump({"0th": zeroth, Exif: {}, GPS: {}}), dataUri).replace(
        /^data:image\/jpeg;base64,/,
        "",
      ),
      "base64",
    );
    const options = parseGuestGeotagOptions({latitude: 1.5, longitude: 2.5});
    const out = writeGpsToJpeg(withMake, options);
    const summary = readSafeGpsFromJpeg(out);
    expect(summary).toEqual({
      present: true,
      readable: true,
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      altitudeMeters: null,
    });
    // Rewritten EXIF should not retain Make.
    const reloaded = piexif.load(`data:image/jpeg;base64,${out.toString("base64")}`);
    expect(reloaded["0th"]?.[piexif.ImageIFD.Make]).toBeUndefined();
  });

  it("fails verification when coordinates do not match", async () => {
    const source = await makeJpeg();
    const written = parseGuestGeotagOptions({latitude: 10, longitude: 20});
    const out = writeGpsToJpeg(source, written);
    const mismatch = parseGuestGeotagOptions({latitude: 11, longitude: 20});
    expect(verifyGpsRoundTrip(out, mismatch).ok).toBe(false);
  });
});
