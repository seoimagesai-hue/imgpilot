/** Minimal export-policy stub for Phase 1 typecheck. */

export const EXPORT_MAX_ITEMS = 500;

export const EXPORT_PACKAGE_KINDS = [
  "zip",
  "csv",
  "json",
  "txt",
  "html",
  "sidecar",
] as const;

export type ExportPackageKind = (typeof EXPORT_PACKAGE_KINDS)[number];
