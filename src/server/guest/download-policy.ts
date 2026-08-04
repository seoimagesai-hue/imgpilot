/**
 * Guest signed download policy.
 * Downloads MUST NOT extend guest asset expiry.
 */

export const GUEST_DOWNLOAD_URL_TTL_SECONDS = 300;
export const GUEST_DOWNLOAD_URL_TTL_MIN = 60;
export const GUEST_DOWNLOAD_URL_TTL_MAX = 900;

export function clampGuestDownloadTtl(seconds: number): number {
  if (!Number.isFinite(seconds)) return GUEST_DOWNLOAD_URL_TTL_SECONDS;
  return Math.min(
    GUEST_DOWNLOAD_URL_TTL_MAX,
    Math.max(GUEST_DOWNLOAD_URL_TTL_MIN, Math.floor(seconds)),
  );
}
