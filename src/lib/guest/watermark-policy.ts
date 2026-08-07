export const GUEST_WATERMARK_OPERATION = "watermark.same_format" as const;

export const GUEST_WATERMARK_POSITIONS = [
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type GuestWatermarkPosition = (typeof GUEST_WATERMARK_POSITIONS)[number];

export type GuestWatermarkOptions = {
  text: string;
  position: GuestWatermarkPosition;
  opacity: number;
};

export function defaultGuestWatermarkOptions(): GuestWatermarkOptions {
  return {text: "Img Pilot", position: "bottom-right", opacity: 0.35};
}

export function parseGuestWatermarkOptions(raw: unknown): GuestWatermarkOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of ["quality", "sharp", "storageKey", "fontFile", "imageKey"]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  if (text.length < 1 || text.length > 48) throw new Error("INVALID_TEXT");
  const position = obj.position;
  if (
    typeof position !== "string" ||
    !(GUEST_WATERMARK_POSITIONS as readonly string[]).includes(position)
  ) {
    throw new Error("INVALID_POSITION");
  }
  const opacity = typeof obj.opacity === "number" ? obj.opacity : Number(obj.opacity);
  if (!Number.isFinite(opacity) || opacity < 0.15 || opacity > 0.85) {
    throw new Error("INVALID_OPACITY");
  }
  return {
    text,
    position: position as GuestWatermarkPosition,
    opacity: Math.round(opacity * 100) / 100,
  };
}

export function guestWatermarkOptionsEqual(
  a: GuestWatermarkOptions,
  b: GuestWatermarkOptions,
): boolean {
  return a.text === b.text && a.position === b.position && a.opacity === b.opacity;
}
