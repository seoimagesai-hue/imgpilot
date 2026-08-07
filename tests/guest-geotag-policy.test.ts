import {describe, expect, it} from "vitest";
import {
  coordsWithinTolerance,
  decimalToDms,
  dmsToDecimal,
  GUEST_GEOTAG_OPERATION,
  guestGeotagOptionsEqual,
  isGuestGeotagJpegMime,
  parseGuestGeotagOptions,
  sanitizeLocationLabel,
  validateAltitude,
  validateLatitude,
  validateLongitude,
} from "@/lib/guest/geotag-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";

describe("guest geotag architecture", () => {
  it("registers geotag.write_gps in shared processing policy", () => {
    expect(GUEST_GEOTAG_OPERATION).toBe("geotag.write_gps");
    expect(isGuestSupportedOperation(GUEST_GEOTAG_OPERATION)).toBe(true);
  });

  it("accepts JPEG mime only for geotag writing", () => {
    expect(isGuestGeotagJpegMime("image/jpeg")).toBe(true);
    expect(isGuestGeotagJpegMime("image/jpg")).toBe(true);
    expect(isGuestGeotagJpegMime("image/png")).toBe(false);
    expect(isGuestGeotagJpegMime("image/webp")).toBe(false);
    expect(isGuestGeotagJpegMime("image/svg+xml")).toBe(false);
  });
});

describe("guest geotag coordinates", () => {
  it("accepts north/south/east/west and zero", () => {
    expect(validateLatitude(33.6844)).toBe(33.6844);
    expect(validateLatitude(-33.6844)).toBe(-33.6844);
    expect(validateLongitude(73.0479)).toBe(73.0479);
    expect(validateLongitude(-73.0479)).toBe(-73.0479);
    expect(validateLatitude(0)).toBe(0);
    expect(validateLongitude(0)).toBe(0);
  });

  it("accepts boundaries and rejects out of range / non-finite", () => {
    expect(validateLatitude(90)).toBe(90);
    expect(validateLatitude(-90)).toBe(-90);
    expect(validateLongitude(180)).toBe(180);
    expect(validateLongitude(-180)).toBe(-180);
    expect(() => validateLatitude(90.0001)).toThrow("LATITUDE_INVALID");
    expect(() => validateLongitude(180.1)).toThrow("LONGITUDE_INVALID");
    expect(() => validateLatitude(Number.NaN)).toThrow("LATITUDE_INVALID");
    expect(() => validateLongitude(Number.POSITIVE_INFINITY)).toThrow("LONGITUDE_INVALID");
  });

  it("normalizes precision to 6 decimals", () => {
    expect(validateLatitude(33.684412345)).toBe(33.684412);
  });

  it("validates altitude and sanitizes labels", () => {
    expect(validateAltitude(null)).toBeNull();
    expect(validateAltitude(540)).toBe(540);
    expect(validateAltitude(-12.34)).toBe(-12.3);
    expect(() => validateAltitude(20000)).toThrow("ALTITUDE_INVALID");
    expect(sanitizeLocationLabel("Islamabad, Pakistan")).toBe("Islamabad, Pakistan");
    expect(sanitizeLocationLabel("<b>x</b>")).toBe("x");
    expect(sanitizeLocationLabel("a".repeat(200))?.length).toBe(120);
  });

  it("parses safe options and rejects arbitrary EXIF bags", () => {
    const ok = parseGuestGeotagOptions({
      latitude: 33.6844,
      longitude: 73.0479,
      altitudeMeters: 540,
      locationLabel: "Islamabad, Pakistan",
      replaceExistingGps: true,
    });
    expect(ok.metadataPolicyVersion).toBe("guest-geotag-v2");
    expect(ok.replaceExistingGps).toBe(true);
    expect(() =>
      parseGuestGeotagOptions({
        latitude: 1,
        longitude: 2,
        exif: {GPS: {}},
      }),
    ).toThrow("INVALID_OPTIONS");
    expect(() =>
      parseGuestGeotagOptions({
        latitude: 1,
        longitude: 2,
        tags: [],
      }),
    ).toThrow("INVALID_OPTIONS");
  });

  it("compares options for idempotency", () => {
    const a = parseGuestGeotagOptions({latitude: 1, longitude: 2, replaceExistingGps: false});
    const b = parseGuestGeotagOptions({latitude: 1, longitude: 2});
    expect(guestGeotagOptionsEqual(a, b)).toBe(true);
  });
});

describe("guest geotag DMS helpers", () => {
  it("converts decimal to DMS with correct refs", () => {
    expect(decimalToDms(33.6844, "lat").ref).toBe("N");
    expect(decimalToDms(-33.6844, "lat").ref).toBe("S");
    expect(decimalToDms(73.0479, "lon").ref).toBe("E");
    expect(decimalToDms(-73.0479, "lon").ref).toBe("W");
    expect(decimalToDms(0, "lat").ref).toBe("N");
    expect(decimalToDms(0, "lon").ref).toBe("E");
  });

  it("round-trips within tolerance", () => {
    const samples = [33.6844, -37.8136, 0, 90, -90, 73.0479, -144.9631, 180, -180];
    for (const value of samples) {
      const axis = Math.abs(value) <= 90 ? "lat" : "lon";
      const dms = decimalToDms(value, axis);
      const back = dmsToDecimal(dms.degrees, dms.minutes, dms.seconds, dms.ref);
      expect(coordsWithinTolerance(value, back)).toBe(true);
    }
  });
});
