/**
 * Guest geotag policy — JPEG-only GPS write; browser selection is advisory.
 */

export const GUEST_GEOTAG_OPERATION = "geotag.write_gps" as const;
export const GUEST_GEOTAG_METADATA_POLICY_VERSION = "guest-geotag-v2" as const;

/** Decimal degrees tolerance for EXIF round-trip. */
export const GUEST_GEOTAG_COORD_TOLERANCE = 0.00001;

/** Max decimal places accepted/stored. */
export const GUEST_GEOTAG_COORD_DECIMALS = 6;

export const GUEST_GEOTAG_ALTITUDE_MIN_M = -500;
export const GUEST_GEOTAG_ALTITUDE_MAX_M = 10000;
export const GUEST_GEOTAG_LABEL_MAX_LEN = 120;

export type GuestGeotagOptions = {
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  locationLabel: string | null;
  replaceExistingGps: boolean;
  metadataPolicyVersion: typeof GUEST_GEOTAG_METADATA_POLICY_VERSION;
};

export type DecimalDms = {
  degrees: number;
  minutes: number;
  seconds: number;
  ref: "N" | "S" | "E" | "W";
};

export type SafeGpsSummary = {
  present: boolean;
  readable: boolean;
  latitude: number | null;
  longitude: number | null;
  altitudeMeters: number | null;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function roundCoord(value: number): number {
  const f = 10 ** GUEST_GEOTAG_COORD_DECIMALS;
  return Math.round(value * f) / f;
}

export function validateLatitude(value: unknown): number {
  if (!isFiniteNumber(value)) throw new Error("LATITUDE_INVALID");
  if (value < -90 || value > 90) throw new Error("LATITUDE_INVALID");
  return roundCoord(value);
}

export function validateLongitude(value: unknown): number {
  if (!isFiniteNumber(value)) throw new Error("LONGITUDE_INVALID");
  if (value < -180 || value > 180) throw new Error("LONGITUDE_INVALID");
  return roundCoord(value);
}

export function validateAltitude(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (!isFiniteNumber(value)) throw new Error("ALTITUDE_INVALID");
  if (value < GUEST_GEOTAG_ALTITUDE_MIN_M || value > GUEST_GEOTAG_ALTITUDE_MAX_M) {
    throw new Error("ALTITUDE_INVALID");
  }
  return Math.round(value * 10) / 10;
}

export function sanitizeLocationLabel(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw !== "string") throw new Error("LABEL_INVALID");
  // Strip HTML-ish tags and control chars.
  let s = raw.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!s) return null;
  if (s.length > GUEST_GEOTAG_LABEL_MAX_LEN) {
    s = s.slice(0, GUEST_GEOTAG_LABEL_MAX_LEN);
  }
  return s;
}

export function decimalToDms(value: number, axis: "lat" | "lon"): DecimalDms {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesDecimal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60 * 10000) / 10000;
  if (axis === "lat") {
    return {degrees, minutes, seconds, ref: value < 0 ? "S" : "N"};
  }
  return {degrees, minutes, seconds, ref: value < 0 ? "W" : "E"};
}

export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  ref: string,
): number {
  const sign = ref === "S" || ref === "W" ? -1 : 1;
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

export function coordsWithinTolerance(
  expected: number,
  actual: number,
  tolerance = GUEST_GEOTAG_COORD_TOLERANCE,
): boolean {
  return Math.abs(expected - actual) <= tolerance;
}

export function defaultGuestGeotagOptions(): GuestGeotagOptions {
  return {
    latitude: 0,
    longitude: 0,
    altitudeMeters: null,
    locationLabel: null,
    replaceExistingGps: false,
    metadataPolicyVersion: GUEST_GEOTAG_METADATA_POLICY_VERSION,
  };
}

export function parseGuestGeotagOptions(raw: unknown): GuestGeotagOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;

  for (const banned of [
    "exif",
    "tags",
    "storageKey",
    "gpsIfd",
    "rawExif",
    "verified",
    "sharp",
  ]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }

  const latitude = validateLatitude(obj.latitude);
  const longitude = validateLongitude(obj.longitude);
  const altitudeMeters = validateAltitude(obj.altitudeMeters);
  const locationLabel = sanitizeLocationLabel(obj.locationLabel);
  const replaceExistingGps = obj.replaceExistingGps === true;

  return {
    latitude,
    longitude,
    altitudeMeters,
    locationLabel,
    replaceExistingGps,
    metadataPolicyVersion: GUEST_GEOTAG_METADATA_POLICY_VERSION,
  };
}

export function guestGeotagOptionsEqual(a: GuestGeotagOptions, b: GuestGeotagOptions): boolean {
  return (
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.altitudeMeters === b.altitudeMeters &&
    a.locationLabel === b.locationLabel &&
    a.replaceExistingGps === b.replaceExistingGps
  );
}

export function isGuestGeotagJpegMime(mime: string | null | undefined): boolean {
  const m = (mime || "").toLowerCase();
  return m === "image/jpeg" || m === "image/jpg";
}
