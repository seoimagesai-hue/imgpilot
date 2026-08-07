export const GUEST_ROTATE_OPERATION = "rotate.same_format" as const;

export const GUEST_ROTATE_ANGLES = [90, 180, 270] as const;
export type GuestRotateAngle = (typeof GUEST_ROTATE_ANGLES)[number];

export type GuestRotateOptions = {
  angle: GuestRotateAngle;
  flipHorizontal: boolean;
  flipVertical: boolean;
};

export function defaultGuestRotateOptions(): GuestRotateOptions {
  return {angle: 90, flipHorizontal: false, flipVertical: false};
}

export function parseGuestRotateOptions(raw: unknown): GuestRotateOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of ["quality", "sharp", "storageKey", "mimeType"]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  const angle = obj.angle;
  if (typeof angle !== "number" || !(GUEST_ROTATE_ANGLES as readonly number[]).includes(angle)) {
    throw new Error("INVALID_ANGLE");
  }
  return {
    angle: angle as GuestRotateAngle,
    flipHorizontal: Boolean(obj.flipHorizontal),
    flipVertical: Boolean(obj.flipVertical),
  };
}

export function guestRotateOptionsEqual(a: GuestRotateOptions, b: GuestRotateOptions): boolean {
  return (
    a.angle === b.angle &&
    a.flipHorizontal === b.flipHorizontal &&
    a.flipVertical === b.flipVertical
  );
}
