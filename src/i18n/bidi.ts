/**
 * LTR isolation for technical tokens inside RTL copy.
 * Product policy: keep filenames, format codes, dimensions, URLs, and
 * keyboard shortcuts in Latin/LTR even in Arabic/Urdu UI.
 */
export function ltrIsolate(value: string): string {
  // Unicode LRI…PDI isolates; safe in HTML text nodes.
  return `\u2066${value}\u2069`;
}

export function formatDimensionsLtr(width: number, height: number): string {
  // Always Western digits for technical dimensions (product policy).
  return ltrIsolate(`${width}×${height}`);
}
