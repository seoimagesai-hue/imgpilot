/**
 * Runtime AVIF encode capability for guest Convert UI + server validation.
 */
import sharp from "sharp";

let cached: boolean | null = null;

/**
 * True when Sharp can encode (and round-trip decode) a tiny AVIF.
 * Result is memoized for the process lifetime.
 */
export async function isGuestAvifEncodeSupported(): Promise<boolean> {
  if (cached != null) return cached;

  try {
    const formats = sharp.format as unknown as Record<string, {output?: boolean} | undefined>;
    if (!formats.avif?.output) {
      cached = false;
      return false;
    }

    const encoded = await sharp({
      create: {width: 8, height: 8, channels: 3, background: {r: 10, g: 20, b: 30}},
    })
      .avif({quality: 40, effort: 2})
      .toBuffer();

    const decoded = await sharp(encoded).metadata();
    cached = String(decoded.format) === "avif" && (decoded.width ?? 0) === 8;
    return cached;
  } catch {
    cached = false;
    return false;
  }
}

/** Test helper — reset memoization between cases. */
export function resetGuestAvifCapabilityCacheForTests(): void {
  cached = null;
}
