/** Guest upload validation policy — shared by all tools. */

export const GUEST_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const GUEST_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const GUEST_MAX_WIDTH = 20_000;
export const GUEST_MAX_HEIGHT = 20_000;
export const GUEST_MAX_PIXELS = 40_000_000;

export function guestExtensionFromFilename(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export function isGuestMimeAllowed(mimeType: string): boolean {
  return (GUEST_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
}

export function isGuestExtensionAllowed(ext: string): boolean {
  return (GUEST_ALLOWED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}
