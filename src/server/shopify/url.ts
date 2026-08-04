/**
 * Prompt 27 — Shopify shop domain normalization + SSRF safety.
 * Locked decision: only `https://{shop}.myshopify.com` is ever contacted —
 * custom domains and app-proxy hosts are out of scope. Re-uses the webhooks
 * SSRF defenses so both delivery targets share one hardened implementation.
 */
import {ApiError} from "@/server/api/errors";
import {assertSafeWebhookUrl} from "@/server/webhooks/url-safety";
import {ShopifyError} from "@/server/shopify/errors";

const SHOP_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

/**
 * Normalize user-supplied shop input (bare handle, full domain, or URL) to a
 * canonical `{handle}.myshopify.com` domain plus its HTTPS API base URL.
 */
export function normalizeShopDomain(input: string): {shopDomain: string; apiBaseUrl: string} {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    throw new ShopifyError("INVALID_REQUEST", "Shop is required.");
  }

  let host = trimmed;
  if (trimmed.includes("://")) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new ShopifyError("INVALID_REQUEST", "Shop is not a valid domain or URL.");
    }
    if (parsed.protocol !== "https:") {
      throw new ShopifyError("SHOPIFY_SHOP_UNSAFE", "Shopify shops must use HTTPS.");
    }
    if (parsed.username || parsed.password) {
      throw new ShopifyError("SHOPIFY_SHOP_UNSAFE", "Shop URL must not include credentials.");
    }
    host = parsed.hostname;
  } else {
    // Strip any accidental path/query a caller may have pasted.
    host = trimmed.split("/")[0]!;
  }

  const shopDomain = host.endsWith(".myshopify.com") ? host : `${host}.myshopify.com`;

  if (!SHOP_DOMAIN_RE.test(shopDomain)) {
    throw new ShopifyError(
      "INVALID_REQUEST",
      "Shop must be a valid *.myshopify.com domain.",
    );
  }

  // Canonical shop origin; Admin REST paths are built via buildShopifyRestUrl.
  return {shopDomain, apiBaseUrl: `https://${shopDomain}`};
}

/**
 * Validate the shop domain is safe to contact (matches the locked
 * `*.myshopify.com` pattern, HTTPS, no private/internal IPs). Call again
 * immediately before every outbound request (DNS rebinding protection).
 */
export async function assertSafeShopifyShop(shopDomain: string): Promise<void> {
  if (!SHOP_DOMAIN_RE.test(shopDomain)) {
    throw new ShopifyError("SHOPIFY_SHOP_UNSAFE", "Shop domain must be a valid *.myshopify.com domain.");
  }
  try {
    await assertSafeWebhookUrl(`https://${shopDomain}`);
  } catch (error) {
    if (error instanceof ApiError && error.code === "WEBHOOK_URL_UNREACHABLE") {
      throw new ShopifyError("SHOPIFY_SHOP_UNREACHABLE", "Shopify shop hostname could not be resolved.");
    }
    const message = error instanceof Error ? error.message : "Shop is not allowed.";
    throw new ShopifyError("SHOPIFY_SHOP_UNSAFE", message);
  }
}

/** Build an Admin REST API path (`{apiBaseUrl}/admin/api/{version}/{path}`) without duplicating slashes. */
export function buildShopifyRestUrl(apiBaseUrl: string, apiVersion: string, path: string): string {
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${apiBaseUrl}/admin/api/${apiVersion}/${trimmedPath}`;
}
