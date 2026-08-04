/** Shared conversion target format ids — safe for client and server. */
export const CONVERSION_TARGET_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type ConversionTargetFormat = (typeof CONVERSION_TARGET_FORMATS)[number];

export function isConversionTargetFormat(
  value: string | null | undefined,
): value is ConversionTargetFormat {
  return Boolean(value && (CONVERSION_TARGET_FORMATS as readonly string[]).includes(value));
}
