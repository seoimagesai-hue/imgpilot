/**
 * Prompt 26 — WordPress site URL normalization + SSRF safety.
 * Self-hosted HTTPS only (locked decision). Re-uses the webhooks SSRF
 * defenses so both delivery targets share one hardened implementation.
 */
import {ApiError} from "@/server/api/errors";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";
import {WordPressError} from "@/server/wordpress/errors";

/** Normalize a user-supplied site URL to `https://host[:port]` with no path/query/fragment. */
export function normalizeSiteUrl(input: string): {normalized: string; host: string} {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new WordPressError("INVALID_REQUEST", "Site URL is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new WordPressError("INVALID_REQUEST", "Site URL must use https://.");
  }
  if (url.username || url.password) {
    throw new WordPressError("INVALID_REQUEST", "Site URL must not contain credentials.");
  }
  const host = url.hostname.toLowerCase();
  const port = url.port ? `:${url.port}` : "";
  return {normalized: `https://${host}${port}`, host};
}

/**
 * Validate the site URL is safe to contact (HTTPS, no private/internal IPs).
 * Call again immediately before every outbound request (DNS rebinding protection).
 */
export async function assertSafeWordpressUrl(siteUrlNormalized: string): Promise<void> {
  try {
    await assertSafeWebhookUrl(siteUrlNormalized);
  } catch (error) {
    if (error instanceof ApiError && error.code === "WEBHOOK_URL_UNREACHABLE") {
      throw new WordPressError("WORDPRESS_URL_UNREACHABLE", "WordPress site hostname could not be resolved.");
    }
    const message = error instanceof Error ? error.message : "Site URL is not allowed.";
    throw new WordPressError("WORDPRESS_URL_UNSAFE", message);
  }
}

/** Build a REST API path under the site's `/wp-json/` root without duplicating slashes. */
export function buildWordpressRestUrl(siteUrlNormalized: string, path: string): string {
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${siteUrlNormalized}/${trimmedPath}`;
}
