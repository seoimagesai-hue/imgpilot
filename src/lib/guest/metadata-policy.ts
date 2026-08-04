/**
 * Guest image metadata viewer — safe allow-listed schema only.
 * Viewer-only: never rewrites the source image.
 */

export const GUEST_METADATA_OPERATION = "metadata.inspect" as const;
export const GUEST_METADATA_SCHEMA_VERSION = "guest-image-metadata-v2" as const;

/** Approximate max JSON size for stored/returned safe summary. */
export const GUEST_METADATA_RESULT_MAX_CHARS = 48_000;

export const GUEST_METADATA_STRING_MAX = 120;

export type GuestMetadataOptions = {
  schemaVersion: typeof GUEST_METADATA_SCHEMA_VERSION;
};

export type SafeMetadataGps = {
  present: boolean;
  readable: boolean;
  latitude: number | null;
  longitude: number | null;
  altitudeMeters: number | null;
};

export type SafeMetadataResult = {
  schemaVersion: typeof GUEST_METADATA_SCHEMA_VERSION;
  file: {
    filename: string | null;
    format: string;
    mimeType: string;
    byteSize: number;
  };
  image: {
    width: number;
    height: number;
    aspectRatio: string | null;
    pixelCount: number;
    orientation: number | null;
    animated: boolean;
    frameCount: number;
    hasAlpha: boolean | null;
    colorSpace: string | null;
    channels: number | null;
    bitDepth: string | null;
    densityX: number | null;
    densityY: number | null;
    densityUnit: string | null;
    printWidthInches: number | null;
    printHeightInches: number | null;
    iccProfilePresent: boolean | null;
    progressive: boolean | null;
    chromaSubsampling: string | null;
  };
  camera: {
    make: string | null;
    model: string | null;
    lens: string | null;
    iso: number | null;
    exposureTime: string | null;
    aperture: string | null;
    focalLength: string | null;
    flash: string | null;
    whiteBalance: string | null;
    exposureProgram: string | null;
    meteringMode: string | null;
    dateTaken: string | null;
    software: string | null;
  };
  gps: SafeMetadataGps;
  durationMs: number;
};

export function defaultGuestMetadataOptions(): GuestMetadataOptions {
  return {schemaVersion: GUEST_METADATA_SCHEMA_VERSION};
}

export function parseGuestMetadataOptions(raw: unknown): GuestMetadataOptions {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    return defaultGuestMetadataOptions();
  }
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of [
    "exif",
    "raw",
    "tags",
    "storageKey",
    "xmp",
    "iptc",
    "makerNote",
    "thumbnail",
    "scrubbed",
  ]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  return defaultGuestMetadataOptions();
}

export function guestMetadataOptionsEqual(
  a: GuestMetadataOptions | {scrubbed?: boolean},
  b: GuestMetadataOptions | {scrubbed?: boolean},
): boolean {
  if ("scrubbed" in a || "scrubbed" in b) return false;
  return true; // single inspect options shape
}

export function isGuestMetadataMime(mime: string | null | undefined): boolean {
  const m = (mime || "").toLowerCase();
  return m === "image/jpeg" || m === "image/jpg" || m === "image/png" || m === "image/webp";
}

export function sanitizeMetadataString(raw: unknown, max = GUEST_METADATA_STRING_MAX): string | null {
  if (raw == null) return null;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  let s = String(raw).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!s) return null;
  if (s.length > max) s = s.slice(0, max);
  return s;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function aspectRatioLabel(width: number, height: number): string | null {
  if (!width || !height) return null;
  const g = gcd(width, height);
  return `${width / g}:${height / g}`;
}

export function assertSafeMetadataResultSize(result: SafeMetadataResult): void {
  const len = JSON.stringify(result).length;
  if (len > GUEST_METADATA_RESULT_MAX_CHARS) {
    throw new Error("RESULT_TOO_LARGE");
  }
}

/** Plain-text lines for copy / TXT export (locale labels supplied by caller). */
export type MetadataExportLabels = {
  file: string;
  image: string;
  camera: string;
  gps: string;
  color: string;
  resolution: string;
  animation: string;
  privacy: string;
  filename: string;
  format: string;
  mimeType: string;
  byteSize: string;
  width: string;
  height: string;
  aspectRatio: string;
  pixelCount: string;
  orientation: string;
  animated: string;
  frameCount: string;
  hasAlpha: string;
  colorSpace: string;
  channels: string;
  bitDepth: string;
  density: string;
  printSize: string;
  printSizeNote: string;
  icc: string;
  progressive: string;
  chroma: string;
  make: string;
  model: string;
  lens: string;
  iso: string;
  exposureTime: string;
  aperture: string;
  focalLength: string;
  flash: string;
  whiteBalance: string;
  exposureProgram: string;
  meteringMode: string;
  dateTaken: string;
  software: string;
  gpsPresent: string;
  gpsAbsent: string;
  gpsUnreadable: string;
  latitude: string;
  longitude: string;
  altitude: string;
  gpsSensitive: string;
  na: string;
  yes: string;
  no: string;
};

function line(label: string, value: string | number | null | undefined, na: string): string | null {
  if (value == null || value === "") return null;
  return `${label}: ${value}`;
}

export function formatSafeMetadataTxt(
  result: SafeMetadataResult,
  labels: MetadataExportLabels,
  extras?: {expiresAt?: string | null},
): string {
  const na = labels.na;
  const sections: string[] = [];

  const fileLines = [
    line(labels.filename, result.file.filename, na),
    line(labels.format, result.file.format, na),
    line(labels.mimeType, result.file.mimeType, na),
    line(labels.byteSize, result.file.byteSize, na),
  ].filter(Boolean);
  if (fileLines.length) sections.push(`${labels.file}\n${fileLines.join("\n")}`);

  const imageLines = [
    line(labels.width, result.image.width, na),
    line(labels.height, result.image.height, na),
    line(labels.aspectRatio, result.image.aspectRatio, na),
    line(labels.pixelCount, result.image.pixelCount, na),
    line(labels.orientation, result.image.orientation, na),
    line(labels.hasAlpha, result.image.hasAlpha == null ? null : result.image.hasAlpha ? labels.yes : labels.no, na),
    line(labels.colorSpace, result.image.colorSpace, na),
    line(labels.channels, result.image.channels, na),
    line(labels.bitDepth, result.image.bitDepth, na),
    line(labels.icc, result.image.iccProfilePresent == null ? null : result.image.iccProfilePresent ? labels.yes : labels.no, na),
    line(labels.progressive, result.image.progressive == null ? null : result.image.progressive ? labels.yes : labels.no, na),
    line(labels.chroma, result.image.chromaSubsampling, na),
  ].filter(Boolean);
  if (imageLines.length) sections.push(`${labels.image}\n${imageLines.join("\n")}`);

  const cam = result.camera;
  const cameraLines = [
    line(labels.make, cam.make, na),
    line(labels.model, cam.model, na),
    line(labels.lens, cam.lens, na),
    line(labels.iso, cam.iso, na),
    line(labels.exposureTime, cam.exposureTime, na),
    line(labels.aperture, cam.aperture, na),
    line(labels.focalLength, cam.focalLength, na),
    line(labels.flash, cam.flash, na),
    line(labels.whiteBalance, cam.whiteBalance, na),
    line(labels.exposureProgram, cam.exposureProgram, na),
    line(labels.meteringMode, cam.meteringMode, na),
    line(labels.dateTaken, cam.dateTaken, na),
    line(labels.software, cam.software, na),
  ].filter(Boolean);
  if (cameraLines.length) sections.push(`${labels.camera}\n${cameraLines.join("\n")}`);

  const gpsLines: string[] = [labels.gpsSensitive];
  if (!result.gps.present) gpsLines.push(labels.gpsAbsent);
  else if (!result.gps.readable) gpsLines.push(labels.gpsUnreadable);
  else {
    gpsLines.push(labels.gpsPresent);
    gpsLines.push(`${labels.latitude}: ${result.gps.latitude}`);
    gpsLines.push(`${labels.longitude}: ${result.gps.longitude}`);
    if (result.gps.altitudeMeters != null) {
      gpsLines.push(`${labels.altitude}: ${result.gps.altitudeMeters}`);
    }
  }
  sections.push(`${labels.gps}\n${gpsLines.join("\n")}`);

  const dens =
    result.image.densityX != null || result.image.densityY != null
      ? `${result.image.densityX ?? "—"} × ${result.image.densityY ?? "—"} ${result.image.densityUnit ?? ""}`.trim()
      : null;
  const print =
    result.image.printWidthInches != null && result.image.printHeightInches != null
      ? `${result.image.printWidthInches.toFixed(2)} × ${result.image.printHeightInches.toFixed(2)} in (${labels.printSizeNote})`
      : null;
  const resLines = [line(labels.density, dens, na), line(labels.printSize, print, na)].filter(Boolean);
  if (resLines.length) sections.push(`${labels.resolution}\n${resLines.join("\n")}`);

  const animLines = [
    line(labels.animated, result.image.animated ? labels.yes : labels.no, na),
    line(labels.frameCount, result.image.frameCount, na),
  ].filter(Boolean);
  if (animLines.length) sections.push(`${labels.animation}\n${animLines.join("\n")}`);

  if (extras?.expiresAt) {
    sections.push(`${labels.privacy}\nExpires: ${extras.expiresAt}`);
  }

  return sections.join("\n\n") + "\n";
}

export function formatSafeMetadataJson(result: SafeMetadataResult): string {
  // Drop durationMs from export for stability (keep schema fields only).
  const {durationMs: _d, ...rest} = result;
  return `${JSON.stringify(rest, null, 2)}\n`;
}

export function copyDimensionsText(result: SafeMetadataResult): string {
  return `${result.image.width}×${result.image.height}`;
}

export function copyGpsText(result: SafeMetadataResult, sensitiveLabel: string): string | null {
  if (!result.gps.present || !result.gps.readable) return null;
  const parts = [
    sensitiveLabel,
    `latitude: ${result.gps.latitude}`,
    `longitude: ${result.gps.longitude}`,
  ];
  if (result.gps.altitudeMeters != null) parts.push(`altitude_m: ${result.gps.altitudeMeters}`);
  return parts.join("\n");
}
