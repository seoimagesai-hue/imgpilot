/**
 * Shared guest compress policy (client + server safe).
 */
export const GUEST_COMPRESS_OPERATION = "compress.same_format" as const;

export const GUEST_COMPRESS_PRESETS = ["low", "balanced", "high"] as const;
export type GuestCompressPreset = (typeof GUEST_COMPRESS_PRESETS)[number];

export const GUEST_COMPRESS_PRESET_QUALITY: Record<GuestCompressPreset, number> = {
  low: 40,
  balanced: 70,
  high: 85,
};

export const GUEST_COMPRESS_PRESET_PNG_LEVEL: Record<GuestCompressPreset, number> = {
  low: 9,
  balanced: 7,
  high: 4,
};

export type GuestCompressOptions = {
  quality: number;
  preset: GuestCompressPreset | "custom";
};

export function isGuestCompressPreset(value: string): value is GuestCompressPreset {
  return (GUEST_COMPRESS_PRESETS as readonly string[]).includes(value);
}

export function clampGuestCompressQuality(raw: number): number {
  if (!Number.isFinite(raw)) return GUEST_COMPRESS_PRESET_QUALITY.balanced;
  return Math.min(100, Math.max(1, Math.round(raw)));
}

export function guestCompressPresetForQuality(quality: number): GuestCompressPreset | "custom" {
  const q = clampGuestCompressQuality(quality);
  for (const preset of GUEST_COMPRESS_PRESETS) {
    if (Math.abs(GUEST_COMPRESS_PRESET_QUALITY[preset] - q) <= 3) return preset;
  }
  return "custom";
}

export function qualityFromGuestCompressPreset(preset: GuestCompressPreset): number {
  return GUEST_COMPRESS_PRESET_QUALITY[preset];
}

export function pngLevelFromGuestQuality(quality: number): number {
  const q = clampGuestCompressQuality(quality);
  const preset = guestCompressPresetForQuality(q);
  if (preset !== "custom") return GUEST_COMPRESS_PRESET_PNG_LEVEL[preset];
  return Math.min(9, Math.max(0, Math.round(9 - ((q - 1) / 99) * 9)));
}

export function parseGuestCompressOptions(raw: unknown): GuestCompressOptions {
  if (!raw || typeof raw !== "object") {
    return {
      quality: GUEST_COMPRESS_PRESET_QUALITY.balanced,
      preset: "balanced",
    };
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.preset === "string" && isGuestCompressPreset(obj.preset) && obj.quality == null) {
    return {
      quality: qualityFromGuestCompressPreset(obj.preset),
      preset: obj.preset,
    };
  }
  const quality = clampGuestCompressQuality(
    typeof obj.quality === "number" ? obj.quality : Number(obj.quality),
  );
  const preset =
    typeof obj.preset === "string" && isGuestCompressPreset(obj.preset)
      ? Math.abs(GUEST_COMPRESS_PRESET_QUALITY[obj.preset] - quality) <= 3
        ? obj.preset
        : guestCompressPresetForQuality(quality)
      : guestCompressPresetForQuality(quality);
  return {quality, preset};
}

export type GuestCompressSizeSaved = {
  inputBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
};

export function computeGuestCompressSizeSaved(
  inputBytes: number,
  outputBytes: number,
): GuestCompressSizeSaved {
  const inB = Math.max(0, Math.floor(inputBytes));
  const outB = Math.max(0, Math.floor(outputBytes));
  const savedBytes = Math.max(0, inB - outB);
  const savedPercent = inB > 0 ? Math.round((savedBytes / inB) * 100) : 0;
  return {inputBytes: inB, outputBytes: outB, savedBytes, savedPercent};
}
