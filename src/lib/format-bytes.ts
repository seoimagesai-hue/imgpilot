/**
 * Locale-aware byte size formatting for display only.
 * Never persist formatted strings in the database.
 */
export function formatByteSize(bytes: number, locale = "en"): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    unitIndex === 0
      ? new Intl.NumberFormat(locale, {maximumFractionDigits: 0}).format(value)
      : new Intl.NumberFormat(locale, {maximumFractionDigits: value >= 10 ? 1 : 1}).format(value);

  return `${formatted} ${units[unitIndex]}`;
}
