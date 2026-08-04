/**
 * Guest resize policy — methods, presets, no-upscale, aspect ratio.
 * Exact size method is defined but locked for UI until a later prompt.
 */
export const GUEST_RESIZE_OPERATION = "resize.same_format" as const;

export const GUEST_RESIZE_METHODS = ["by_width", "by_height", "fit_inside", "exact_size"] as const;
export type GuestResizeMethod = (typeof GUEST_RESIZE_METHODS)[number];

export const GUEST_RESIZE_PRESETS = ["social", "website", "thumbnail", "custom"] as const;
export type GuestResizePreset = (typeof GUEST_RESIZE_PRESETS)[number];

/** Soft caps for guest pixel inputs (not dashboard quotas). */
export const GUEST_RESIZE_MAX_EDGE = 8192;
export const GUEST_RESIZE_MIN_EDGE = 1;

export type GuestResizeOptions = {
  method: GuestResizeMethod;
  /** Target width (px) — required for by_width / fit_inside / exact_size */
  width: number | null;
  /** Target height (px) — required for by_height / fit_inside / exact_size */
  height: number | null;
  maintainAspectRatio: boolean;
  preventUpscale: boolean;
  preset: GuestResizePreset;
};

/** Quick-preset templates (applied as fit_inside boxes). */
export const GUEST_RESIZE_PRESET_BOX: Record<
  Exclude<GuestResizePreset, "custom">,
  {width: number; height: number}
> = {
  social: {width: 1080, height: 1080},
  website: {width: 1920, height: 1080},
  thumbnail: {width: 400, height: 400},
};

export function isGuestResizeMethod(value: string): value is GuestResizeMethod {
  return (GUEST_RESIZE_METHODS as readonly string[]).includes(value);
}

export function isGuestResizePreset(value: string): value is GuestResizePreset {
  return (GUEST_RESIZE_PRESETS as readonly string[]).includes(value);
}

export function defaultGuestResizeOptions(): GuestResizeOptions {
  return {
    method: "fit_inside",
    width: GUEST_RESIZE_PRESET_BOX.website.width,
    height: GUEST_RESIZE_PRESET_BOX.website.height,
    maintainAspectRatio: true,
    preventUpscale: true,
    preset: "website",
  };
}

function clampEdge(n: number): number {
  if (!Number.isFinite(n)) return GUEST_RESIZE_MIN_EDGE;
  return Math.min(GUEST_RESIZE_MAX_EDGE, Math.max(GUEST_RESIZE_MIN_EDGE, Math.round(n)));
}

export function parseGuestResizeOptions(raw: unknown): GuestResizeOptions {
  const defaults = defaultGuestResizeOptions();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Record<string, unknown>;

  const method =
    typeof obj.method === "string" && isGuestResizeMethod(obj.method) ? obj.method : defaults.method;
  const preset =
    typeof obj.preset === "string" && isGuestResizePreset(obj.preset) ? obj.preset : "custom";

  let width =
    obj.width == null || obj.width === ""
      ? null
      : clampEdge(typeof obj.width === "number" ? obj.width : Number(obj.width));
  let height =
    obj.height == null || obj.height === ""
      ? null
      : clampEdge(typeof obj.height === "number" ? obj.height : Number(obj.height));

  if (preset !== "custom" && preset in GUEST_RESIZE_PRESET_BOX) {
    const box = GUEST_RESIZE_PRESET_BOX[preset as Exclude<GuestResizePreset, "custom">];
    width = box.width;
    height = box.height;
  }

  return {
    method: method === "exact_size" ? "exact_size" : method,
    width,
    height,
    maintainAspectRatio: obj.maintainAspectRatio !== false,
    preventUpscale: obj.preventUpscale !== false,
    preset,
  };
}

export type GuestResizeTarget = {
  width: number;
  height: number;
  scaled: boolean;
};

/**
 * Pure dimension math for guest resize.
 * exact_size with preventUpscale=false can enlarge (not unlocked in UI yet).
 */
export function computeGuestResizeTarget(
  sourceWidth: number,
  sourceHeight: number,
  options: GuestResizeOptions,
): GuestResizeTarget {
  if (sourceWidth < 1 || sourceHeight < 1) {
    throw new Error("INVALID_SOURCE");
  }

  const method = options.method === "exact_size" ? "exact_size" : options.method;
  let tw = sourceWidth;
  let th = sourceHeight;

  if (method === "by_width") {
    if (options.width == null) throw new Error("WIDTH_REQUIRED");
    tw = clampEdge(options.width);
    if (options.maintainAspectRatio) {
      th = clampEdge((sourceHeight * tw) / sourceWidth);
    } else if (options.height != null) {
      th = clampEdge(options.height);
    }
  } else if (method === "by_height") {
    if (options.height == null) throw new Error("HEIGHT_REQUIRED");
    th = clampEdge(options.height);
    if (options.maintainAspectRatio) {
      tw = clampEdge((sourceWidth * th) / sourceHeight);
    } else if (options.width != null) {
      tw = clampEdge(options.width);
    }
  } else if (method === "fit_inside") {
    if (options.width == null || options.height == null) throw new Error("BOX_REQUIRED");
    const maxW = clampEdge(options.width);
    const maxH = clampEdge(options.height);
    const s = options.preventUpscale
      ? Math.min(maxW / sourceWidth, maxH / sourceHeight, 1)
      : Math.min(maxW / sourceWidth, maxH / sourceHeight);
    tw = clampEdge(sourceWidth * s);
    th = clampEdge(sourceHeight * s);
  } else {
    // exact_size
    if (options.width == null || options.height == null) throw new Error("EXACT_REQUIRED");
    tw = clampEdge(options.width);
    th = clampEdge(options.height);
    if (options.maintainAspectRatio) {
      const s = Math.min(tw / sourceWidth, th / sourceHeight);
      tw = clampEdge(sourceWidth * s);
      th = clampEdge(sourceHeight * s);
    }
  }

  if (options.preventUpscale) {
    tw = Math.min(tw, sourceWidth);
    th = Math.min(th, sourceHeight);
  }

  const scaled = tw !== sourceWidth || th !== sourceHeight;
  return {width: tw, height: th, scaled};
}
