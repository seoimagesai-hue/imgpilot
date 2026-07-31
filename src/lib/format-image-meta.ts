export function formatDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
): string | null {
  if (width == null || height == null || width <= 0 || height <= 0) return null;
  return `${width}×${height}`;
}

export function formatPixelCount(count: number | null | undefined, locale: string): string | null {
  if (count == null) return null;
  if (count >= 1_000_000) {
    const mp = count / 1_000_000;
    return `${mp.toLocaleString(locale, {maximumFractionDigits: 1})} MP`;
  }
  return count.toLocaleString(locale);
}
