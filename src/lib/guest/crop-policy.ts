/**
 * Guest crop policy — normalized crop trust boundary (browser selection is advisory).
 * Pixel math always uses trusted source dimensions from the server.
 */

export const GUEST_CROP_OPERATION = "crop.same_format" as const;

/** Minimum output edge after trusted integer conversion. */
export const GUEST_CROP_MIN_EDGE_PX = 16;

export const GUEST_CROP_ASPECT_RATIOS = [
  "free",
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
] as const;

export type GuestCropAspectRatio = (typeof GUEST_CROP_ASPECT_RATIOS)[number];

export type NormalizedCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GuestCropOptions = {
  normalizedCrop: NormalizedCropRect;
  aspectRatio: GuestCropAspectRatio;
  /** Advisory UI zoom; not trusted for geometry (coordinates carry the result). */
  zoom: number;
};

export type PixelCropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function isGuestCropAspectRatio(value: string): value is GuestCropAspectRatio {
  return (GUEST_CROP_ASPECT_RATIOS as readonly string[]).includes(value);
}

export function aspectRatioValue(aspect: GuestCropAspectRatio): number | null {
  switch (aspect) {
    case "free":
      return null;
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "3:4":
      return 3 / 4;
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
  }
}

export function defaultGuestCropOptions(): GuestCropOptions {
  return {
    normalizedCrop: {x: 0.1, y: 0.1, width: 0.8, height: 0.8},
    aspectRatio: "free",
    zoom: 1,
  };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Validate advisory normalized crop from the browser.
 * Rejects negatives, zeros, NaN, and out-of-bounds rectangles.
 */
export function validateNormalizedCrop(rect: unknown): NormalizedCropRect {
  if (!rect || typeof rect !== "object") {
    throw new Error("INVALID_CROP");
  }
  const obj = rect as Record<string, unknown>;
  const x = obj.x;
  const y = obj.y;
  const width = obj.width;
  const height = obj.height;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) {
    throw new Error("INVALID_CROP");
  }
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new Error("INVALID_CROP");
  }
  if (x > 1 || y > 1 || width > 1 || height > 1) {
    throw new Error("INVALID_CROP");
  }
  if (x + width > 1 + 1e-9 || y + height > 1 + 1e-9) {
    throw new Error("OUT_OF_BOUNDS");
  }
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
    width: Math.min(1, Math.max(0, width)),
    height: Math.min(1, Math.max(0, height)),
  };
}

export function parseGuestCropOptions(raw: unknown): GuestCropOptions {
  const defaults = defaultGuestCropOptions();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Record<string, unknown>;

  const aspectRatio =
    typeof obj.aspectRatio === "string" && isGuestCropAspectRatio(obj.aspectRatio)
      ? obj.aspectRatio
      : defaults.aspectRatio;

  let zoom = defaults.zoom;
  if (isFiniteNumber(obj.zoom)) {
    zoom = Math.min(4, Math.max(1, obj.zoom));
  }

  const normalizedCrop = validateNormalizedCrop(obj.normalizedCrop ?? defaults.normalizedCrop);
  return {normalizedCrop, aspectRatio, zoom};
}

/**
 * Convert normalized crop → integer pixels using trusted oriented dimensions.
 * Rounds and clamps so the extract region stays inside the image and meets min edge.
 */
export function normalizedCropToPixels(
  sourceWidth: number,
  sourceHeight: number,
  rect: NormalizedCropRect,
  minEdge: number = GUEST_CROP_MIN_EDGE_PX,
): PixelCropRect {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth < 1 ||
    sourceHeight < 1
  ) {
    throw new Error("INVALID_SOURCE");
  }
  if (sourceWidth < minEdge || sourceHeight < minEdge) {
    throw new Error("SOURCE_TOO_SMALL");
  }

  const crop = validateNormalizedCrop(rect);

  let left = Math.round(crop.x * sourceWidth);
  let top = Math.round(crop.y * sourceHeight);
  let width = Math.round(crop.width * sourceWidth);
  let height = Math.round(crop.height * sourceHeight);

  // Clamp into bounds after rounding.
  left = Math.max(0, Math.min(sourceWidth - 1, left));
  top = Math.max(0, Math.min(sourceHeight - 1, top));
  width = Math.max(1, Math.min(sourceWidth - left, width));
  height = Math.max(1, Math.min(sourceHeight - top, height));

  if (width < minEdge || height < minEdge) {
    throw new Error("CROP_TOO_SMALL");
  }

  if (left + width > sourceWidth || top + height > sourceHeight) {
    throw new Error("OUT_OF_BOUNDS");
  }

  return {left, top, width, height};
}

/** Stable options fingerprint for idempotent same-crop reuse. */
export function guestCropOptionsFingerprint(options: GuestCropOptions): string {
  const c = options.normalizedCrop;
  const round = (n: number) => Math.round(n * 1_000_000) / 1_000_000;
  return JSON.stringify({
    x: round(c.x),
    y: round(c.y),
    width: round(c.width),
    height: round(c.height),
    aspectRatio: options.aspectRatio,
  });
}

export function guestCropOptionsEqual(a: GuestCropOptions, b: GuestCropOptions): boolean {
  return guestCropOptionsFingerprint(a) === guestCropOptionsFingerprint(b);
}
