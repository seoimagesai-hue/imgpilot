/**
 * Prompt 28 — Webflow API base + SSRF safety.
 * Locked decision: only `https://api.webflow.com/v2` is ever contacted for
 * site/collection/CMS-item/asset-metadata operations. The two-step asset
 * upload's `uploadUrl` is a short-lived pre-signed Amazon S3 form-post
 * target that must be validated against a strict host allowlist before
 * every request — this integration never follows redirects and never
 * uploads bytes to an arbitrary or private host.
 */
import {ApiError} from "@/server/api/errors";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";
import {WebflowError} from "@/server/webflow/errors";

export const WEBFLOW_API_BASE = "https://api.webflow.com/v2";

/**
 * Validate that `api.webflow.com` still resolves to a safe (non-private)
 * address. Re-uses the outbound-webhook SSRF defenses so both delivery
 * targets share one hardened implementation. Called again immediately
 * before every outbound request (DNS rebinding protection).
 */
export async function assertSafeWebflowApiHost(): Promise<void> {
  try {
    await assertSafeWebhookUrl(WEBFLOW_API_BASE);
  } catch (error) {
    if (error instanceof ApiError && error.code === "WEBHOOK_URL_UNREACHABLE") {
      throw new WebflowError("WEBFLOW_API_UNAVAILABLE", "The Webflow API host could not be resolved.");
    }
    const message = error instanceof Error ? error.message : "Webflow API host is not allowed.";
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", message);
  }
}

const LOCAL_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "127.0.0.1", "::1"]);

/**
 * `POST /sites/{siteId}/assets` returns a short-lived pre-signed Amazon S3
 * form-post `uploadUrl`. Strict allowlist: HTTPS only, no embedded
 * credentials, and the host must be an Amazon S3 endpoint (bare
 * `s3.amazonaws.com`, any `*.amazonaws.com` regional/bucket-vhost host, or
 * otherwise contain `amazonaws`) — never localhost, never a private
 * address, never an arbitrary third-party host even if a response were
 * spoofed or malformed.
 */
export function assertSafeWebflowUploadUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new WebflowError("WEBFLOW_UPLOAD_URL_UNSAFE", "Webflow asset upload URL is not a valid URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new WebflowError("WEBFLOW_UPLOAD_URL_UNSAFE", "Webflow asset upload URL must use HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new WebflowError("WEBFLOW_UPLOAD_URL_UNSAFE", "Webflow asset upload URL must not include credentials.");
  }
  const host = parsed.hostname.toLowerCase();
  if (!host || LOCAL_HOSTNAMES.has(host) || host.endsWith(".localhost")) {
    throw new WebflowError("WEBFLOW_UPLOAD_URL_UNSAFE", "Webflow asset upload URL must not point to localhost.");
  }
  const isAllowedAmazonHost =
    host === "amazonaws.com" ||
    host === "s3.amazonaws.com" ||
    host.endsWith(".amazonaws.com") ||
    host.includes("amazonaws");
  if (!isAllowedAmazonHost) {
    throw new WebflowError(
      "WEBFLOW_UPLOAD_URL_UNSAFE",
      "Webflow asset upload URL host is not an allowed Amazon S3 endpoint.",
    );
  }
}
