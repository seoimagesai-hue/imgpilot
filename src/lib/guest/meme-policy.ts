export const GUEST_MEME_OPERATION = "meme.caption" as const;

export type GuestMemeOptions = {
  topText: string;
  bottomText: string;
};

export function defaultGuestMemeOptions(): GuestMemeOptions {
  return {topText: "TOP TEXT", bottomText: "BOTTOM TEXT"};
}

export function parseGuestMemeOptions(raw: unknown): GuestMemeOptions {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_OPTIONS");
  const obj = raw as Record<string, unknown>;
  for (const banned of ["quality", "sharp", "storageKey", "fontFile"]) {
    if (banned in obj) throw new Error("INVALID_OPTIONS");
  }
  const topText = typeof obj.topText === "string" ? obj.topText.trim() : "";
  const bottomText = typeof obj.bottomText === "string" ? obj.bottomText.trim() : "";
  if (topText.length > 80 || bottomText.length > 80) throw new Error("INVALID_TEXT");
  if (!topText && !bottomText) throw new Error("INVALID_TEXT");
  return {topText, bottomText};
}

export function guestMemeOptionsEqual(a: GuestMemeOptions, b: GuestMemeOptions): boolean {
  return a.topText === b.topText && a.bottomText === b.bottomText;
}
