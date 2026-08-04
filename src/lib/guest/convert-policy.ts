/**
 * Guest convert policy — separate from dashboard conversion-policy
 * (dashboard forbids PNG→JPEG silently; guest allows explicit flatten).
 */

export const GUEST_CONVERT_OPERATION = "convert.format" as const;

export const GUEST_CONVERT_SOURCE_FORMATS = ["jpeg", "png", "webp"] as const;
export type GuestConvertSourceFormat = (typeof GUEST_CONVERT_SOURCE_FORMATS)[number];

export const GUEST_CONVERT_TARGET_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type GuestConvertTargetFormat = (typeof GUEST_CONVERT_TARGET_FORMATS)[number];

export const GUEST_CONVERT_QUALITY_PRESETS = ["smaller", "balanced", "higher"] as const;
export type GuestConvertQualityPreset = (typeof GUEST_CONVERT_QUALITY_PRESETS)[number];

export const GUEST_JPEG_BACKGROUNDS = ["white", "black"] as const;
export type GuestJpegBackground = (typeof GUEST_JPEG_BACKGROUNDS)[number];

/** Cross-format only — same-format belongs to Compress. */
export const GUEST_CONVERT_MATRIX: Record<
  GuestConvertSourceFormat,
  readonly GuestConvertTargetFormat[]
> = {
  jpeg: ["png", "webp", "avif"],
  png: ["jpeg", "webp", "avif"],
  webp: ["jpeg", "png", "avif"],
};

export type GuestConvertOptions = {
  targetFormat: GuestConvertTargetFormat;
  qualityPreset: GuestConvertQualityPreset;
  /** Required when flattening alpha → JPEG; otherwise null. */
  jpegBackground: GuestJpegBackground | null;
};

/** Server encoder mapping — never expose raw numbers in the UI. */
export type GuestConvertEncoderSettings = {
  jpegQuality: number;
  webpQuality: number;
  avifQuality: number;
  avifEffort: number;
  pngCompressionLevel: number;
};

export function isGuestConvertSourceFormat(
  value: string | null | undefined,
): value is GuestConvertSourceFormat {
  return Boolean(value && (GUEST_CONVERT_SOURCE_FORMATS as readonly string[]).includes(value));
}

export function isGuestConvertTargetFormat(
  value: string | null | undefined,
): value is GuestConvertTargetFormat {
  return Boolean(value && (GUEST_CONVERT_TARGET_FORMATS as readonly string[]).includes(value));
}

export function isGuestConvertQualityPreset(
  value: string | null | undefined,
): value is GuestConvertQualityPreset {
  return Boolean(value && (GUEST_CONVERT_QUALITY_PRESETS as readonly string[]).includes(value));
}

export function isGuestJpegBackground(
  value: string | null | undefined,
): value is GuestJpegBackground {
  return Boolean(value && (GUEST_JPEG_BACKGROUNDS as readonly string[]).includes(value));
}

export function sourceFormatFromMime(
  mime: string | null | undefined,
): GuestConvertSourceFormat | null {
  const m = (mime || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpeg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return null;
}

export function listGuestConvertTargets(
  source: GuestConvertSourceFormat,
  avifSupported: boolean,
): GuestConvertTargetFormat[] {
  return GUEST_CONVERT_MATRIX[source].filter((t) => t !== "avif" || avifSupported);
}

export function isGuestConvertAllowed(
  source: string | null | undefined,
  target: string | null | undefined,
  avifSupported: boolean,
): boolean {
  if (!isGuestConvertSourceFormat(source) || !isGuestConvertTargetFormat(target)) return false;
  if (source === target) return false;
  if (target === "avif" && !avifSupported) return false;
  return (GUEST_CONVERT_MATRIX[source] as readonly string[]).includes(target);
}

export function encoderSettingsForPreset(
  preset: GuestConvertQualityPreset,
): GuestConvertEncoderSettings {
  switch (preset) {
    case "smaller":
      return {
        jpegQuality: 65,
        webpQuality: 65,
        avifQuality: 40,
        avifEffort: 4,
        pngCompressionLevel: 9,
      };
    case "higher":
      return {
        jpegQuality: 90,
        webpQuality: 90,
        avifQuality: 65,
        avifEffort: 6,
        pngCompressionLevel: 4,
      };
    case "balanced":
    default:
      return {
        jpegQuality: 80,
        webpQuality: 80,
        avifQuality: 50,
        avifEffort: 5,
        pngCompressionLevel: 7,
      };
  }
}

export function defaultGuestConvertOptions(
  source: GuestConvertSourceFormat | null,
  avifSupported: boolean,
): GuestConvertOptions {
  const targets = source ? listGuestConvertTargets(source, avifSupported) : [];
  const targetFormat = targets[0] ?? "webp";
  return {
    targetFormat,
    qualityPreset: "balanced",
    jpegBackground: null,
  };
}

export function parseGuestConvertOptions(
  raw: unknown,
  context: {
    sourceFormat: GuestConvertSourceFormat;
    hasAlpha: boolean;
    avifSupported: boolean;
  },
): GuestConvertOptions {
  if (!raw || typeof raw !== "object") {
    throw new Error("INVALID_OPTIONS");
  }
  const obj = raw as Record<string, unknown>;

  // Reject raw quality / Sharp-like fields.
  for (const banned of [
    "quality",
    "effort",
    "compressionLevel",
    "sharp",
    "storageKey",
    "mimeType",
    "extension",
    "hasAlpha",
  ]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }

  const targetFormatRaw = obj.targetFormat;
  const qualityPresetRaw = obj.qualityPreset;
  if (typeof targetFormatRaw !== "string" || !isGuestConvertTargetFormat(targetFormatRaw)) {
    throw new Error("INVALID_TARGET");
  }
  if (typeof qualityPresetRaw !== "string" || !isGuestConvertQualityPreset(qualityPresetRaw)) {
    throw new Error("INVALID_PRESET");
  }
  if (!isGuestConvertAllowed(context.sourceFormat, targetFormatRaw, context.avifSupported)) {
    throw new Error("UNSUPPORTED_PAIR");
  }

  let jpegBackground: GuestJpegBackground | null = null;
  if (targetFormatRaw === "jpeg" && context.hasAlpha) {
    if (!isGuestJpegBackground(typeof obj.jpegBackground === "string" ? obj.jpegBackground : null)) {
      throw new Error("JPEG_BACKGROUND_REQUIRED");
    }
    jpegBackground = obj.jpegBackground as GuestJpegBackground;
  } else if (typeof obj.jpegBackground === "string" && isGuestJpegBackground(obj.jpegBackground)) {
    if (targetFormatRaw === "jpeg") {
      jpegBackground = obj.jpegBackground;
    }
  }

  return {
    targetFormat: targetFormatRaw,
    qualityPreset: qualityPresetRaw,
    jpegBackground,
  };
}

export function guestConvertOptionsEqual(a: GuestConvertOptions, b: GuestConvertOptions): boolean {
  return (
    a.targetFormat === b.targetFormat &&
    a.qualityPreset === b.qualityPreset &&
    a.jpegBackground === b.jpegBackground
  );
}

export function guestConvertExtension(format: GuestConvertTargetFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export function guestConvertMime(format: GuestConvertTargetFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
  }
}
