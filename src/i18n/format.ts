/**
 * Locale-aware display formatters.
 * Policy: file extensions stay ASCII; technical dimensions use Western digits.
 */
export function formatNumber(value: number, locale = "en", options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, {style: "percent", maximumFractionDigits: 0}).format(value);
}

export function formatDateTime(value: Date | string | number, locale = "en"): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(
  from: Date | string | number,
  locale = "en",
  now = Date.now(),
): string {
  const then = (from instanceof Date ? from : new Date(from)).getTime();
  const deltaSec = Math.round((then - now) / 1000);
  const abs = Math.abs(deltaSec);
  const rtf = new Intl.RelativeTimeFormat(locale, {numeric: "auto"});
  if (abs < 60) return rtf.format(deltaSec, "second");
  if (abs < 3600) return rtf.format(Math.round(deltaSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(deltaSec / 3600), "hour");
  return rtf.format(Math.round(deltaSec / 86400), "day");
}

export {formatByteSize} from "@/lib/format-bytes";
