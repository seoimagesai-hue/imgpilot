/**
 * Prompt 27 — server-side Shopify Admin REST API client.
 * Custom App Admin API access token only (`X-Shopify-Access-Token` header —
 * never OAuth). Env-configurable timeouts, hard response-byte caps, safe JSON
 * parsing, and manual redirect handling. Never logs the access token or raw
 * response bodies (which may echo the shop's data back on error pages).
 * Publish targets EXISTING products only, via the REST product images API
 * (base64 `image.attachment`) — this client never creates products/variants
 * and never touches orders/inventory.
 */
import {getShopifyMaxResponseBytes, getShopifyRequestTimeoutSeconds} from "@/lib/env";
import {assertSafeShopifyShop, buildShopifyRestUrl} from "@/server/shopify/url";
import {SHOPIFY_API_VERSION} from "@/server/shopify/policy";
import {ShopifyError} from "@/server/shopify/errors";

type RawFetchResult = {status: number; body: string; truncated: boolean};

async function readLimitedBody(
  response: Response,
  maxBytes: number,
): Promise<{text: string; truncated: boolean}> {
  const reader = response.body?.getReader();
  if (!reader) return {text: "", truncated: false};
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  try {
    while (total < maxBytes) {
      const {done, value} = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxBytes - total;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        total += remaining;
        truncated = true;
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // best-effort
    }
  }
  return {text: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8"), truncated};
}

/** Low-level fetch wrapper: bounded timeout, bounded response bytes, no redirects followed. */
async function shopifyFetch(
  url: string,
  init: {method: string; headers: Record<string, string>; body?: BodyInit},
): Promise<RawFetchResult> {
  const timeoutMs = getShopifyRequestTimeoutSeconds() * 1000;
  const maxBytes = getShopifyMaxResponseBytes();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
      throw new ShopifyError("SHOPIFY_SHOP_UNSAFE", "Shopify returned a redirect; redirects are not followed.");
    }
    const {text, truncated} = await readLimitedBody(response, maxBytes);
    if (truncated) {
      throw new ShopifyError("SHOPIFY_RESPONSE_TOO_LARGE", "Shopify response exceeded the maximum allowed size.");
    }
    return {status: response.status, body: text, truncated};
  } catch (error) {
    if (error instanceof ShopifyError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShopifyError("SHOPIFY_TIMEOUT", "The request to Shopify timed out.");
    }
    throw new ShopifyError("SHOPIFY_NETWORK_ERROR", "Could not reach Shopify.");
  } finally {
    clearTimeout(timer);
  }
}

function safeParseJson(body: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new ShopifyError("SHOPIFY_RESPONSE_UNPARSEABLE", "Shopify Admin API returned an unexpected response.");
  }
}

function assertNotAuthOrPermissionFailure(status: number): void {
  if (status === 401) {
    throw new ShopifyError("SHOPIFY_AUTHENTICATION_FAILED", "Shopify rejected the provided access token.");
  }
  if (status === 403) {
    throw new ShopifyError("SHOPIFY_PERMISSION_DENIED", "The Shopify Custom App lacks the required scope.");
  }
}

/** Allow only Shopify-operated CDN/API hosts — never render or trust arbitrary third-party URLs. */
export function isSafeShopifyCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith(".myshopify.com") ||
      host.endsWith(".shopify.com") ||
      host === "shopify.com" ||
      host.endsWith(".shopifycdn.com") ||
      host === "shopifycdn.com"
    );
  } catch {
    return false;
  }
}

function safeMediaUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return isSafeShopifyCdnUrl(raw) ? raw : "";
}

export type ShopifyVerifiedShop = {
  shopId: string;
  shopNameSafe: string;
  planNameSafe: string;
};

/** GET /admin/api/{version}/shop.json — validates the access token and captures safe shop metadata. */
export async function verifyShop(params: {
  shopDomain: string;
  accessToken: string;
}): Promise<ShopifyVerifiedShop> {
  await assertSafeShopifyShop(params.shopDomain);
  const url = buildShopifyRestUrl(`https://${params.shopDomain}`, SHOPIFY_API_VERSION, "shop.json");
  const result = await shopifyFetch(url, {
    method: "GET",
    headers: {accept: "application/json", "X-Shopify-Access-Token": params.accessToken},
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError("SHOPIFY_REST_UNAVAILABLE", `Shopify Admin API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const shop = obj.shop && typeof obj.shop === "object" ? (obj.shop as Record<string, unknown>) : {};
  return {
    shopId: shop.id != null ? String(shop.id) : "",
    shopNameSafe: typeof shop.name === "string" ? shop.name.slice(0, 200) : "",
    planNameSafe:
      shop.plan_name === undefined || shop.plan_name === null
        ? ""
        : String((shop.plan_display_name as string | undefined) ?? shop.plan_name).slice(0, 200),
  };
}

export type ShopifyProductSummary = {
  productId: string;
  titleSafe: string;
  handleSafe: string;
  statusSafe: string;
  imageUrlSafe: string;
};

function mapProductSummary(obj: Record<string, unknown>): ShopifyProductSummary {
  const image = obj.image && typeof obj.image === "object" ? (obj.image as Record<string, unknown>) : null;
  return {
    productId: obj.id != null ? String(obj.id) : "",
    titleSafe: typeof obj.title === "string" ? obj.title.slice(0, 300) : "",
    handleSafe: typeof obj.handle === "string" ? obj.handle.slice(0, 300) : "",
    statusSafe: typeof obj.status === "string" ? obj.status.slice(0, 50) : "",
    imageUrlSafe: image ? safeMediaUrl(image.src) : "",
  };
}

/** GET /products.json?title=&limit=&fields=… — search existing products by title. Never creates products. */
export async function searchProducts(params: {
  shopDomain: string;
  accessToken: string;
  query?: string | null;
  limit?: number;
}): Promise<ShopifyProductSummary[]> {
  await assertSafeShopifyShop(params.shopDomain);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 50));
  const search = new URLSearchParams();
  search.set("limit", String(limit));
  search.set("fields", "id,title,handle,status,image");
  if (params.query && params.query.trim()) {
    search.set("title", params.query.trim().slice(0, 200));
  }
  const url = buildShopifyRestUrl(
    `https://${params.shopDomain}`,
    SHOPIFY_API_VERSION,
    `products.json?${search.toString()}`,
  );
  const result = await shopifyFetch(url, {
    method: "GET",
    headers: {accept: "application/json", "X-Shopify-Access-Token": params.accessToken},
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError("SHOPIFY_REST_UNAVAILABLE", `Shopify Admin API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const products = Array.isArray(obj.products) ? obj.products : [];
  return products
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
    .map(mapProductSummary);
}

/** GET /products/{id}.json — used at eligibility/publish time to confirm the product still exists. */
export async function getProduct(params: {
  shopDomain: string;
  accessToken: string;
  productId: string;
}): Promise<ShopifyProductSummary> {
  await assertSafeShopifyShop(params.shopDomain);
  const url = buildShopifyRestUrl(
    `https://${params.shopDomain}`,
    SHOPIFY_API_VERSION,
    `products/${encodeURIComponent(params.productId)}.json?fields=id,title,handle,status,image`,
  );
  const result = await shopifyFetch(url, {
    method: "GET",
    headers: {accept: "application/json", "X-Shopify-Access-Token": params.accessToken},
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new ShopifyError("SHOPIFY_PRODUCT_NOT_FOUND", "The Shopify product was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError("SHOPIFY_REST_UNAVAILABLE", `Shopify Admin API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const product = obj.product && typeof obj.product === "object" ? (obj.product as Record<string, unknown>) : {};
  return mapProductSummary(product);
}

export type ShopifyProductImageResult = {
  remoteImageId: string;
  remoteMediaUrlSafe: string;
  remoteFilename: string;
  remoteMimeType: string;
  remoteWidth: number | null;
  remoteHeight: number | null;
  altSafe: string | null;
};

function mapProductImage(obj: Record<string, unknown>, requestedFilename: string): ShopifyProductImageResult {
  const src = safeMediaUrl(obj.src);
  const filenameFromSrc = src ? (src.split("?")[0]!.split("/").pop() ?? "") : "";
  return {
    remoteImageId: obj.id != null ? String(obj.id) : "",
    remoteMediaUrlSafe: src,
    remoteFilename: filenameFromSrc || requestedFilename,
    // Shopify does not return a MIME type for product images; derive from the request.
    remoteMimeType: "",
    remoteWidth: typeof obj.width === "number" ? obj.width : null,
    remoteHeight: typeof obj.height === "number" ? obj.height : null,
    altSafe: typeof obj.alt === "string" ? obj.alt.slice(0, 500) : null,
  };
}

/**
 * POST /products/{id}/images.json — attaches a base64-encoded image to an
 * EXISTING product. Never creates products or variants. Shopify assigns the
 * image id; the returned id must be persisted immediately so a retry never
 * re-uploads a duplicate image.
 */
export async function uploadProductImage(params: {
  shopDomain: string;
  accessToken: string;
  productId: string;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  alt?: string | null;
}): Promise<ShopifyProductImageResult> {
  await assertSafeShopifyShop(params.shopDomain);
  const url = buildShopifyRestUrl(
    `https://${params.shopDomain}`,
    SHOPIFY_API_VERSION,
    `products/${encodeURIComponent(params.productId)}/images.json`,
  );
  const payload: Record<string, unknown> = {
    image: {
      attachment: params.bytes.toString("base64"),
      filename: params.filename,
    },
  };
  if (params.alt) {
    (payload.image as Record<string, unknown>).alt = params.alt;
  }

  const result = await shopifyFetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Shopify-Access-Token": params.accessToken,
    },
    body: JSON.stringify(payload),
  });

  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new ShopifyError("SHOPIFY_PRODUCT_NOT_FOUND", "The Shopify product was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError("SHOPIFY_UPLOAD_FAILED", `Shopify product image upload failed with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const image = obj.image && typeof obj.image === "object" ? (obj.image as Record<string, unknown>) : {};
  const mapped = mapProductImage(image, params.filename);
  if (!mapped.remoteMimeType) mapped.remoteMimeType = params.mimeType;
  return mapped;
}

/** PUT /products/{id}/images/{imageId}.json — update only the alt text on an existing product image. */
export async function updateProductImageAlt(params: {
  shopDomain: string;
  accessToken: string;
  productId: string;
  remoteImageId: string;
  alt: string | null;
}): Promise<ShopifyProductImageResult> {
  await assertSafeShopifyShop(params.shopDomain);
  const url = buildShopifyRestUrl(
    `https://${params.shopDomain}`,
    SHOPIFY_API_VERSION,
    `products/${encodeURIComponent(params.productId)}/images/${encodeURIComponent(params.remoteImageId)}.json`,
  );
  const result = await shopifyFetch(url, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Shopify-Access-Token": params.accessToken,
    },
    body: JSON.stringify({image: {id: Number(params.remoteImageId) || params.remoteImageId, alt: params.alt}}),
  });

  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new ShopifyError("SHOPIFY_METADATA_UPDATE_FAILED", "The remote Shopify product image was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError(
      "SHOPIFY_METADATA_UPDATE_FAILED",
      `Shopify product image alt-text update failed with HTTP ${result.status}.`,
    );
  }
  const obj = safeParseJson(result.body);
  const image = obj.image && typeof obj.image === "object" ? (obj.image as Record<string, unknown>) : {};
  return mapProductImage(image, "");
}

/** GET /products/{id}/images/{imageId}.json — used to verify the remote image still exists after upload/update. */
export async function getProductImage(params: {
  shopDomain: string;
  accessToken: string;
  productId: string;
  remoteImageId: string;
}): Promise<ShopifyProductImageResult> {
  await assertSafeShopifyShop(params.shopDomain);
  const url = buildShopifyRestUrl(
    `https://${params.shopDomain}`,
    SHOPIFY_API_VERSION,
    `products/${encodeURIComponent(params.productId)}/images/${encodeURIComponent(params.remoteImageId)}.json`,
  );
  const result = await shopifyFetch(url, {
    method: "GET",
    headers: {accept: "application/json", "X-Shopify-Access-Token": params.accessToken},
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new ShopifyError("SHOPIFY_VERIFY_FAILED", "The remote Shopify product image was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ShopifyError("SHOPIFY_VERIFY_FAILED", `Shopify product image verification failed with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const image = obj.image && typeof obj.image === "object" ? (obj.image as Record<string, unknown>) : {};
  return mapProductImage(image, "");
}
