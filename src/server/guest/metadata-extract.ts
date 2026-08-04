/**
 * Allow-listed metadata extraction for guest Metadata Viewer.
 * Never returns raw EXIF/XMP/IPTC or serial/owner fields.
 */
import sharp, {type Metadata} from "sharp";
import piexif from "piexifjs";
import {
  aspectRatioLabel,
  assertSafeMetadataResultSize,
  GUEST_METADATA_SCHEMA_VERSION,
  isGuestMetadataMime,
  sanitizeMetadataString,
  type SafeMetadataResult,
} from "@/server/guest/metadata-policy";
import {readSafeGpsFromJpeg} from "@/server/guest/gps-exif";

function jpegToDataUri(buffer: Buffer): string {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

function rationalToString(r: unknown): string | null {
  if (Array.isArray(r) && r.length >= 2) {
    const num = Number(r[0]);
    const den = Number(r[1]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    if (den === 1) return String(num);
    return `${num}/${den}`;
  }
  if (typeof r === "number" && Number.isFinite(r)) return String(r);
  return null;
}

function rationalToNumber(r: unknown): number | null {
  if (Array.isArray(r) && r.length >= 2) {
    const num = Number(r[0]);
    const den = Number(r[1]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (typeof r === "number" && Number.isFinite(r)) return r;
  return null;
}

const FLASH_MAP: Record<number, string> = {
  0: "No flash",
  1: "Flash fired",
  5: "Flash fired, return not detected",
  7: "Flash fired, return detected",
  16: "No flash, compulsory",
  24: "No flash, auto",
  25: "Flash fired, auto",
};

function mapFlash(value: unknown): string | null {
  if (typeof value !== "number") return sanitizeMetadataString(value);
  return FLASH_MAP[value] ?? `Flash code ${value}`;
}

function emptyCamera(): SafeMetadataResult["camera"] {
  return {
    make: null,
    model: null,
    lens: null,
    iso: null,
    exposureTime: null,
    aperture: null,
    focalLength: null,
    flash: null,
    whiteBalance: null,
    exposureProgram: null,
    meteringMode: null,
    dateTaken: null,
    software: null,
  };
}

function readJpegCamera(buffer: Buffer): SafeMetadataResult["camera"] {
  const camera = emptyCamera();
  try {
    const exif = piexif.load(jpegToDataUri(buffer));
    const zeroth = exif["0th"] || {};
    const exifIfd = exif.Exif || {};

    camera.make = sanitizeMetadataString(zeroth[piexif.ImageIFD.Make]);
    camera.model = sanitizeMetadataString(zeroth[piexif.ImageIFD.Model]);
    camera.software = sanitizeMetadataString(zeroth[piexif.ImageIFD.Software]);
    camera.lens = sanitizeMetadataString(exifIfd[piexif.ExifIFD.LensModel]);

    const iso = exifIfd[piexif.ExifIFD.ISOSpeedRatings];
    if (typeof iso === "number" && Number.isFinite(iso)) camera.iso = Math.round(iso);
    else if (Array.isArray(iso) && typeof iso[0] === "number") camera.iso = Math.round(iso[0]);

    camera.exposureTime = rationalToString(exifIfd[piexif.ExifIFD.ExposureTime]);
    const fnum = rationalToNumber(exifIfd[piexif.ExifIFD.FNumber]);
    camera.aperture = fnum != null ? `f/${Math.round(fnum * 10) / 10}` : null;
    const fl = rationalToNumber(exifIfd[piexif.ExifIFD.FocalLength]);
    camera.focalLength = fl != null ? `${Math.round(fl * 10) / 10} mm` : null;
    camera.flash = mapFlash(exifIfd[piexif.ExifIFD.Flash]);

    const wb = exifIfd[piexif.ExifIFD.WhiteBalance];
    if (wb === 0) camera.whiteBalance = "Auto";
    else if (wb === 1) camera.whiteBalance = "Manual";
    else camera.whiteBalance = sanitizeMetadataString(wb);

    camera.exposureProgram = sanitizeMetadataString(exifIfd[piexif.ExifIFD.ExposureProgram]);
    camera.meteringMode = sanitizeMetadataString(exifIfd[piexif.ExifIFD.MeteringMode]);

    const dt =
      sanitizeMetadataString(exifIfd[piexif.ExifIFD.DateTimeOriginal]) ||
      sanitizeMetadataString(zeroth[piexif.ImageIFD.DateTime]);
    // Keep original EXIF date string shape when present; do not invent a Date.
    camera.dateTaken = dt;
  } catch {
    // No EXIF or unreadable — return empty allow-list.
  }
  return camera;
}

export async function extractSafeGuestMetadata(params: {
  buffer: Buffer;
  mimeType: string;
  filename: string | null;
  byteSize: number;
  startedAt: number;
}): Promise<SafeMetadataResult> {
  if (!isGuestMetadataMime(params.mimeType)) {
    throw new Error("FORMAT_UNSUPPORTED");
  }

  let meta: Metadata;
  try {
    meta = await sharp(params.buffer, {
      failOn: "error",
      animated: true,
      limitInputPixels: 40_000_000,
    }).metadata();
  } catch {
    throw new Error("PARSE_FAILED");
  }

  const format = (meta.format || params.mimeType.replace("image/", "")).toLowerCase();
  if (!["jpeg", "jpg", "png", "webp"].includes(format)) {
    throw new Error("FORMAT_UNSUPPORTED");
  }
  const normalizedFormat = format === "jpg" ? "jpeg" : format;

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error("PARSE_FAILED");

  const density = typeof meta.density === "number" && meta.density > 0 ? meta.density : null;
  const printWidthInches = density ? Math.round((width / density) * 100) / 100 : null;
  const printHeightInches = density ? Math.round((height / density) * 100) / 100 : null;

  const pages = meta.pages && meta.pages > 1 ? meta.pages : 1;
  const animated = Boolean(
    (meta.pages && meta.pages > 1) || (Array.isArray(meta.delay) && meta.delay.length > 1),
  );

  const mime =
    normalizedFormat === "jpeg"
      ? "image/jpeg"
      : normalizedFormat === "png"
        ? "image/png"
        : "image/webp";

  const isJpeg = normalizedFormat === "jpeg";
  const camera = isJpeg ? readJpegCamera(params.buffer) : emptyCamera();
  const gps = isJpeg
    ? readSafeGpsFromJpeg(params.buffer)
    : {
        present: false,
        readable: false,
        latitude: null,
        longitude: null,
        altitudeMeters: null,
      };

  const result: SafeMetadataResult = {
    schemaVersion: GUEST_METADATA_SCHEMA_VERSION,
    file: {
      filename: sanitizeMetadataString(params.filename, 180),
      format: normalizedFormat,
      mimeType: mime,
      byteSize: params.byteSize,
    },
    image: {
      width,
      height,
      aspectRatio: aspectRatioLabel(width, height),
      pixelCount: width * height,
      orientation: typeof meta.orientation === "number" ? meta.orientation : null,
      animated,
      frameCount: pages,
      hasAlpha: typeof meta.hasAlpha === "boolean" ? meta.hasAlpha : null,
      colorSpace: sanitizeMetadataString(meta.space),
      channels: typeof meta.channels === "number" ? meta.channels : null,
      bitDepth: meta.depth != null ? String(meta.depth) : null,
      densityX: density,
      densityY: density,
      densityUnit: density != null ? "dpi" : null,
      printWidthInches,
      printHeightInches,
      iccProfilePresent: typeof meta.hasProfile === "boolean" ? meta.hasProfile : null,
      progressive: typeof meta.isProgressive === "boolean" ? meta.isProgressive : null,
      chromaSubsampling: sanitizeMetadataString(meta.chromaSubsampling),
    },
    camera,
    gps: {
      present: gps.present,
      readable: gps.readable,
      latitude: gps.latitude,
      longitude: gps.longitude,
      altitudeMeters: gps.altitudeMeters,
    },
    durationMs: Date.now() - params.startedAt,
  };

  assertSafeMetadataResultSize(result);
  return result;
}
