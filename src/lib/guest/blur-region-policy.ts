export const GUEST_BLUR_REGION_OPERATION = "blur.region" as const;

export type GuestNormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GuestBlurRegionOptions = {
  /** Normalized 0–1 rectangle relative to oriented image. */
  region: GuestNormalizedRect;
  strength: "light" | "medium" | "strong";
};

export function defaultGuestBlurRegionOptions(): GuestBlurRegionOptions {
  return {
    region: {x: 0.25, y: 0.25, width: 0.5, height: 0.5},
    strength: "medium",
  };
}

export function parseGuestBlurRegionOptions(raw: unknown): GuestBlurRegionOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of ["quality", "sharp", "storageKey", "faceDetect"]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  const strength = obj.strength;
  if (strength !== "light" && strength !== "medium" && strength !== "strong") {
    throw new Error("INVALID_STRENGTH");
  }
  const region = obj.region;
  if (!region || typeof region !== "object") throw new Error("INVALID_REGION");
  const r = region as Record<string, unknown>;
  const x = Number(r.x);
  const y = Number(r.y);
  const width = Number(r.width);
  const height = Number(r.height);
  if (![x, y, width, height].every((n) => Number.isFinite(n))) throw new Error("INVALID_REGION");
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.0001 || y + height > 1.0001) {
    throw new Error("INVALID_REGION");
  }
  return {
    region: {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: Math.max(0.02, Math.min(1, width)),
      height: Math.max(0.02, Math.min(1, height)),
    },
    strength,
  };
}

export function guestBlurRegionOptionsEqual(
  a: GuestBlurRegionOptions,
  b: GuestBlurRegionOptions,
): boolean {
  return (
    a.strength === b.strength &&
    a.region.x === b.region.x &&
    a.region.y === b.region.y &&
    a.region.width === b.region.width &&
    a.region.height === b.region.height
  );
}

export function blurSigmaForStrength(strength: GuestBlurRegionOptions["strength"]): number {
  switch (strength) {
    case "light":
      return 4;
    case "strong":
      return 18;
    case "medium":
    default:
      return 10;
  }
}
