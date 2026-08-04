/**
 * Central guest free-tier policy — Consumer Redesign v2 Phase 1.
 * No hardcoded limits inside routes.
 */

export const GUEST_COOKIE_NAME_DEFAULT = "seoimages_guest";

/** Immutable asset retention: createdAt + 1 hour. */
export const GUEST_ASSET_TTL_MS = 60 * 60 * 1000;

/** Rolling window for operation counters. */
export const GUEST_OPS_WINDOW_MS = 24 * 60 * 60 * 1000;

export const GUEST_MAX_FILE_BYTES_DEFAULT = 10 * 1024 * 1024;
export const GUEST_MAX_OPS_PER_ROLLING_24H_DEFAULT = 5;
export const GUEST_MAX_ACTIVE_JOBS = 1;

/** Tool codes used for navigation / future tools (links only in Phase 1). */
export const GUEST_TOOL_CODES = [
  "home",
  "compress-image",
  "resize-image",
  "crop-image",
  "convert-image",
  "geotag-image",
  "image-metadata",
  "ai-alt-text",
  "image-metadata-editor",
  "bulk-image-tools",
] as const;

export type GuestToolCode = (typeof GUEST_TOOL_CODES)[number];

export type GuestCohort = "a" | "b";

export type GuestPublicPolicy = {
  maxFileBytes: number;
  operationsPerRolling24h: number;
  allowedMimeTypes: readonly string[];
  retentionMs: number;
  /** Sharp runtime AVIF encode probe (guest Convert UI). */
  avifEncodeSupported: boolean;
  /** Whether server AI provider is configured (never includes secrets). */
  aiConfigured: boolean;
};

export function isGuestToolCode(value: string): value is GuestToolCode {
  return (GUEST_TOOL_CODES as readonly string[]).includes(value);
}

export function assignGuestCohort(seed: string): GuestCohort {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? "a" : "b";
}

export function guestAssetExpiresAt(createdAt: Date, now = new Date()): Date {
  return new Date(createdAt.getTime() + GUEST_ASSET_TTL_MS);
}

export function isGuestExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
