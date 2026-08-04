/**
 * JPEG GPS read/write via piexifjs.
 * Privacy policy (Prompt 6): strip non-GPS EXIF; keep Orientation only when present.
 */
import piexif from "piexifjs";
import {
  coordsWithinTolerance,
  decimalToDms,
  dmsToDecimal,
  type GuestGeotagOptions,
  type SafeGpsSummary,
} from "@/server/guest/geotag-policy";

function jpegToDataUri(buffer: Buffer): string {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

function dataUriToBuffer(dataUri: string): Buffer {
  const b64 = dataUri.replace(/^data:image\/jpeg;base64,/, "");
  return Buffer.from(b64, "base64");
}

function rationalFromNumber(n: number): [number, number] {
  // Fixed 1e4 denominator for seconds-like stability.
  const den = 10000;
  return [Math.round(n * den), den];
}

function numberFromRational(r: unknown): number | null {
  if (Array.isArray(r) && r.length >= 2) {
    const num = Number(r[0]);
    const den = Number(r[1]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (typeof r === "number" && Number.isFinite(r)) return r;
  return null;
}

function dmsArrayFromDecimal(value: number, axis: "lat" | "lon"): [[number, number], [number, number], [number, number]] {
  const dms = decimalToDms(value, axis);
  return [
    [dms.degrees, 1],
    [dms.minutes, 1],
    rationalFromNumber(dms.seconds),
  ];
}

function decimalFromDmsArray(
  arr: unknown,
  ref: unknown,
): number | null {
  if (!Array.isArray(arr) || arr.length < 3) return null;
  const d = numberFromRational(arr[0]);
  const m = numberFromRational(arr[1]);
  const s = numberFromRational(arr[2]);
  if (d == null || m == null || s == null) return null;
  const refStr = typeof ref === "string" ? ref : "N";
  return dmsToDecimal(d, m, s, refStr);
}

export function readSafeGpsFromJpeg(buffer: Buffer): SafeGpsSummary {
  try {
    const exif = piexif.load(jpegToDataUri(buffer));
    const gps = exif.GPS || {};
    const lat = decimalFromDmsArray(
      gps[piexif.GPSIFD.GPSLatitude],
      gps[piexif.GPSIFD.GPSLatitudeRef],
    );
    const lon = decimalFromDmsArray(
      gps[piexif.GPSIFD.GPSLongitude],
      gps[piexif.GPSIFD.GPSLongitudeRef],
    );
    if (lat == null || lon == null) {
      const hasAnyGps = Object.keys(gps).length > 0;
      return {
        present: hasAnyGps,
        readable: false,
        latitude: null,
        longitude: null,
        altitudeMeters: null,
      };
    }

    let altitudeMeters: number | null = null;
    const alt = numberFromRational(gps[piexif.GPSIFD.GPSAltitude]);
    if (alt != null) {
      const ref = gps[piexif.GPSIFD.GPSAltitudeRef];
      // 0 = above sea level, 1 = below
      const below = ref === 1 || ref === "1";
      altitudeMeters = Math.round((below ? -alt : alt) * 10) / 10;
    }

    return {
      present: true,
      readable: true,
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lon * 1e6) / 1e6,
      altitudeMeters,
    };
  } catch {
    return {
      present: false,
      readable: false,
      latitude: null,
      longitude: null,
      altitudeMeters: null,
    };
  }
}

/**
 * Write GPS tags; strip other EXIF (keep Orientation). Prefer binary string round-trip.
 */
export function writeGpsToJpeg(buffer: Buffer, options: GuestGeotagOptions): Buffer {
  const dataUri = jpegToDataUri(buffer);
  let orientation: number | undefined;
  try {
    const existing = piexif.load(dataUri);
    const o = existing["0th"]?.[piexif.ImageIFD.Orientation];
    if (typeof o === "number" && o >= 1 && o <= 8) orientation = o;
  } catch {
    // no existing exif
  }

  const zeroth: Record<number, unknown> = {};
  if (orientation != null) {
    zeroth[piexif.ImageIFD.Orientation] = orientation;
  }

  const latDms = decimalToDms(options.latitude, "lat");
  const lonDms = decimalToDms(options.longitude, "lon");

  const gps: Record<number, unknown> = {};
  gps[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
  gps[piexif.GPSIFD.GPSLatitudeRef] = latDms.ref;
  gps[piexif.GPSIFD.GPSLatitude] = dmsArrayFromDecimal(options.latitude, "lat");
  gps[piexif.GPSIFD.GPSLongitudeRef] = lonDms.ref;
  gps[piexif.GPSIFD.GPSLongitude] = dmsArrayFromDecimal(options.longitude, "lon");

  if (options.altitudeMeters != null) {
    const absAlt = Math.abs(options.altitudeMeters);
    gps[piexif.GPSIFD.GPSAltitudeRef] = options.altitudeMeters < 0 ? 1 : 0;
    gps[piexif.GPSIFD.GPSAltitude] = rationalFromNumber(absAlt);
  }

  const exifBytes = piexif.dump({
    "0th": zeroth,
    Exif: {},
    GPS: gps,
    "1st": {},
    thumbnail: undefined,
  });

  const outUri = piexif.insert(exifBytes, dataUri);
  return dataUriToBuffer(outUri);
}

export function verifyGpsRoundTrip(
  buffer: Buffer,
  options: GuestGeotagOptions,
): {ok: true; read: SafeGpsSummary} | {ok: false; reason: string} {
  const read = readSafeGpsFromJpeg(buffer);
  if (!read.readable || read.latitude == null || read.longitude == null) {
    return {ok: false, reason: "UNREADABLE"};
  }
  if (!coordsWithinTolerance(options.latitude, read.latitude)) {
    return {ok: false, reason: "LAT_MISMATCH"};
  }
  if (!coordsWithinTolerance(options.longitude, read.longitude)) {
    return {ok: false, reason: "LON_MISMATCH"};
  }
  if (options.altitudeMeters != null) {
    if (read.altitudeMeters == null) return {ok: false, reason: "ALT_MISSING"};
    if (Math.abs(options.altitudeMeters - read.altitudeMeters) > 0.5) {
      return {ok: false, reason: "ALT_MISMATCH"};
    }
  }
  return {ok: true, read};
}
