/**
 * Guest public bulk limits — Prompt 10.
 * Server is authoritative; UI reads safe public slices only.
 */

export const GUEST_BULK_TOOL_CODES = ["compress", "resize", "convert"] as const;
export type GuestBulkToolCode = (typeof GUEST_BULK_TOOL_CODES)[number];

export const GUEST_BULK_MAX_FILES_DEFAULT = 5;
export const GUEST_BULK_MAX_BATCH_BYTES_DEFAULT = 25 * 1024 * 1024;
export const GUEST_BULK_MAX_ZIP_BYTES_DEFAULT = 50 * 1024 * 1024;
export const GUEST_BULK_UPLOAD_CONCURRENCY = 3;
/** Sequential processing — respects GUEST_MAX_ACTIVE_JOBS = 1. */
export const GUEST_BULK_PROCESS_CONCURRENCY = 1;
export const GUEST_BULK_MAX_ACTIVE = 1;

/** Authenticated public-bulk elevation (still temporary guest storage; not dashboard projects). */
export const AUTH_PUBLIC_BULK_MAX_FILES_DEFAULT = 20;
export const AUTH_PUBLIC_BULK_MAX_BATCH_BYTES_DEFAULT = 80 * 1024 * 1024;

export type GuestBulkPublicPolicy = {
  maxFiles: number;
  maxBatchBytes: number;
  maxFileBytes: number;
  maxZipBytes: number;
  maxActiveBulkJobs: number;
  uploadConcurrency: number;
  processConcurrency: number;
  retentionMs: number;
  /** Each successfully started child job counts as one guest operation. */
  operationsPerFile: 1;
  bulkAiGuestAllowed: false;
  zipEnabled: true;
  tools: {
    compress: true;
    resize: true;
    convert: true;
    aiAltText: false;
    crop: false;
    geotag: false;
    metadataViewer: false;
    metadataEditor: false;
  };
};

export function isGuestBulkToolCode(value: string): value is GuestBulkToolCode {
  return (GUEST_BULK_TOOL_CODES as readonly string[]).includes(value);
}

export function operationForBulkTool(tool: GuestBulkToolCode): string {
  switch (tool) {
    case "compress":
      return "compress.same_format";
    case "resize":
      return "resize.same_format";
    case "convert":
      return "convert.format";
    default:
      return "compress.same_format";
  }
}

export function sanitizeZipEntryName(raw: string, fallback: string): string {
  const base = String(raw || fallback)
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/^\.+/, "")
    .trim();
  const safe = (base || fallback).slice(0, 120);
  if (!safe || safe.includes("..") || /[/\\]/.test(safe)) return fallback;
  return safe;
}

/** Resolve duplicate archive names: photo.webp, photo (2).webp, … */
export function uniqueZipNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const n = sanitizeZipEntryName(name, "output.bin");
    const count = (seen.get(n.toLowerCase()) ?? 0) + 1;
    seen.set(n.toLowerCase(), count);
    if (count === 1) return n;
    const dot = n.lastIndexOf(".");
    if (dot <= 0) return `${n} (${count})`;
    return `${n.slice(0, dot)} (${count})${n.slice(dot)}`;
  });
}

export function neutralizeCsvCell(value: string): string {
  let v = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  if (/[",\n]/.test(v) || v.startsWith("'")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
