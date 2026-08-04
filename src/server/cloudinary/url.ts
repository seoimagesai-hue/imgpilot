/**
 * Prompt 29 — Cloudinary API base + SSRF safety.
 * Locked decision: only `api.cloudinary.com` is ever contacted for
 * verify/upload/resource/context operations, and only `res.cloudinary.com`
 * is ever treated as a safe delivery host for rendering URLs back to users.
 */
import {ApiError} from "@/server/api/errors";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";
import {CloudinaryError} from "@/server/cloudinary/errors";

export const CLOUDINARY_API_HOST = "api.cloudinary.com";
export const CLOUDINARY_API_BASE = `https://${CLOUDINARY_API_HOST}`;
export const CLOUDINARY_DELIVERY_HOST = "res.cloudinary.com";

/**
 * Validate that `api.cloudinary.com` still resolves to a safe (non-private)
 * address. Re-uses the outbound-webhook SSRF defenses so every integration
 * shares one hardened implementation. Called again immediately before every
 * outbound request (DNS rebinding protection).
 */
export async function assertSafeCloudinaryApiHost(): Promise<void> {
  try {
    await assertSafeWebhookUrl(CLOUDINARY_API_BASE);
  } catch (error) {
    if (error instanceof ApiError && error.code === "WEBHOOK_URL_UNREACHABLE") {
      throw new CloudinaryError("CLOUDINARY_API_UNAVAILABLE", "The Cloudinary API host could not be resolved.");
    }
    const message = error instanceof Error ? error.message : "Cloudinary API host is not allowed.";
    throw new CloudinaryError("CLOUDINARY_API_UNAVAILABLE", message);
  }
}

/** Allow only the Cloudinary-operated delivery CDN host for rendering — never trust arbitrary third-party URLs. */
export function isSafeCloudinaryDeliveryHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host === CLOUDINARY_DELIVERY_HOST || host.endsWith(`.${CLOUDINARY_DELIVERY_HOST}`);
  } catch {
    return false;
  }
}

export function safeCloudinaryDeliveryUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return isSafeCloudinaryDeliveryHost(raw) ? raw : "";
}
