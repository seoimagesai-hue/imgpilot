/**
 * Prompt 28 — server-side Webflow v2 Data API client.
 * Site access token only (`Authorization: Bearer {token}` — never OAuth).
 * Env-configurable timeouts, hard response-byte caps, safe JSON parsing, and
 * manual redirect handling. Never logs the access token or raw response
 * bodies (which may echo the site's CMS content back on error pages).
 *
 * This client only ever updates EXISTING CMS collection items — it never
 * creates collections/items and never calls the site-wide publish endpoint.
 * Asset upload is the documented two-step flow: create asset metadata
 * (`POST /sites/{siteId}/assets`) then a direct multipart POST to the
 * returned pre-signed Amazon S3 `uploadUrl`.
 */
import {getWebflowMaxResponseBytes, getWebflowRequestTimeoutSeconds} from "@/lib/env";
import {WEBFLOW_API_BASE, assertSafeWebflowApiHost, assertSafeWebflowUploadUrl} from "@/server/webflow/url";
import {WebflowError} from "@/server/webflow/errors";

type RawFetchResult = {status: number; body: string; truncated: boolean};

async function readLimitedBody(response: Response, maxBytes: number): Promise<{text: string; truncated: boolean}> {
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

/** Low-level fetch wrapper against the Webflow API: bounded timeout, bounded response bytes, no redirects followed. */
async function webflowFetch(
  url: string,
  init: {method: string; headers: Record<string, string>; body?: BodyInit},
): Promise<RawFetchResult> {
  await assertSafeWebflowApiHost();
  const timeoutMs = getWebflowRequestTimeoutSeconds() * 1000;
  const maxBytes = getWebflowMaxResponseBytes();
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
      throw new WebflowError("WEBFLOW_API_UNAVAILABLE", "Webflow returned a redirect; redirects are not followed.");
    }
    const {text, truncated} = await readLimitedBody(response, maxBytes);
    if (truncated) {
      throw new WebflowError("WEBFLOW_RESPONSE_TOO_LARGE", "Webflow response exceeded the maximum allowed size.");
    }
    return {status: response.status, body: text, truncated};
  } catch (error) {
    if (error instanceof WebflowError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WebflowError("WEBFLOW_TIMEOUT", "The request to Webflow timed out.");
    }
    throw new WebflowError("WEBFLOW_NETWORK_ERROR", "Could not reach Webflow.");
  } finally {
    clearTimeout(timer);
  }
}

/** Direct multipart POST to a pre-signed Amazon S3 `uploadUrl` — never routed through `webflowFetch`. */
async function s3UploadFetch(
  url: string,
  body: FormData,
): Promise<RawFetchResult> {
  assertSafeWebflowUploadUrl(url);
  const timeoutMs = getWebflowRequestTimeoutSeconds() * 1000;
  const maxBytes = getWebflowMaxResponseBytes();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      body,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
      throw new WebflowError("ASSET_UPLOAD_FAILED", "The asset upload target returned a redirect.");
    }
    const {text, truncated} = await readLimitedBody(response, maxBytes);
    return {status: response.status, body: truncated ? "" : text, truncated};
  } catch (error) {
    if (error instanceof WebflowError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WebflowError("WEBFLOW_TIMEOUT", "The asset upload timed out.");
    }
    throw new WebflowError("WEBFLOW_NETWORK_ERROR", "Could not reach the asset upload target.");
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(token: string): Record<string, string> {
  return {accept: "application/json", authorization: `Bearer ${token}`};
}

function safeParseJson(body: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new WebflowError("WEBFLOW_RESPONSE_UNPARSEABLE", "Webflow returned an unexpected response.");
  }
}

function assertNotAuthPermissionOrRateLimitFailure(status: number): void {
  if (status === 401) {
    throw new WebflowError("WEBFLOW_AUTHENTICATION_FAILED", "Webflow rejected the provided site access token.");
  }
  if (status === 403) {
    throw new WebflowError("WEBFLOW_PERMISSION_DENIED", "The Webflow site token lacks the required scope.");
  }
  if (status === 429) {
    throw new WebflowError("RATE_LIMITED", "Webflow rate limit reached; retry later.");
  }
}

/** Allow only Webflow-operated CDN hosts for rendering — never trust arbitrary third-party URLs. */
export function isSafeWebflowAssetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "uploads-ssl.webflow.com" ||
      host === "cdn.prod.website-files.com" ||
      host.endsWith(".website-files.com") ||
      host === "webflow.com" ||
      host.endsWith(".webflow.com")
    );
  } catch {
    return false;
  }
}

function safeAssetUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return isSafeWebflowAssetUrl(raw) ? raw : "";
}

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export type WebflowSiteSummary = {
  siteId: string;
  displayNameSafe: string;
  shortNameSafe: string;
  defaultHostnameSafe: string;
};

function mapSite(obj: Record<string, unknown>): WebflowSiteSummary {
  const shortName = typeof obj.shortName === "string" ? obj.shortName.slice(0, 200) : "";
  return {
    siteId: obj.id != null ? String(obj.id) : "",
    displayNameSafe: typeof obj.displayName === "string" ? obj.displayName.slice(0, 200) : "",
    shortNameSafe: shortName,
    defaultHostnameSafe: shortName ? `${shortName}.webflow.io` : "",
  };
}

/** GET /sites — used at connection-verification time to confirm the token works and (optionally) list choices. */
export async function listSites(token: string): Promise<WebflowSiteSummary[]> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/sites`, {method: "GET", headers: authHeaders(token)});
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const sites = Array.isArray(obj.sites) ? obj.sites : [];
  return sites.filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object").map(mapSite);
}

/** GET /sites/{siteId} — used to (re)confirm access to a specific selected site. */
export async function getSite(token: string, siteId: string): Promise<WebflowSiteSummary> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/sites/${encodeURIComponent(siteId)}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_SITE_NOT_FOUND", "The Webflow site was not found or is not accessible.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  return mapSite(safeParseJson(result.body));
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export type WebflowCollectionSummary = {
  collectionId: string;
  displayNameSafe: string;
  slugSafe: string;
};

function mapCollectionSummary(obj: Record<string, unknown>): WebflowCollectionSummary {
  return {
    collectionId: obj.id != null ? String(obj.id) : "",
    displayNameSafe: typeof obj.displayName === "string" ? obj.displayName.slice(0, 200) : "",
    slugSafe: typeof obj.slug === "string" ? obj.slug.slice(0, 200) : "",
  };
}

/** GET /sites/{siteId}/collections — existing collections only; never creates one. */
export async function listCollections(token: string, siteId: string): Promise<WebflowCollectionSummary[]> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/sites/${encodeURIComponent(siteId)}/collections`, {
    method: "GET",
    headers: authHeaders(token),
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_SITE_NOT_FOUND", "The Webflow site was not found or is not accessible.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const collections = Array.isArray(obj.collections) ? obj.collections : [];
  return collections
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
    .map(mapCollectionSummary);
}

export type WebflowCollectionField = {
  id: string;
  slug: string;
  type: string;
  displayNameSafe: string;
  isRequired: boolean;
};

export type WebflowCollectionDetail = WebflowCollectionSummary & {
  fields: WebflowCollectionField[];
};

function mapField(obj: Record<string, unknown>): WebflowCollectionField {
  return {
    id: obj.id != null ? String(obj.id) : "",
    slug: typeof obj.slug === "string" ? obj.slug.slice(0, 200) : "",
    type: typeof obj.type === "string" ? obj.type.slice(0, 100) : "",
    displayNameSafe: typeof obj.displayName === "string" ? obj.displayName.slice(0, 200) : "",
    isRequired: obj.isRequired === true,
  };
}

/** GET /collections/{collectionId} — field schema is required to validate a field mapping before saving it. */
export async function getCollection(token: string, collectionId: string): Promise<WebflowCollectionDetail> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/collections/${encodeURIComponent(collectionId)}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_COLLECTION_NOT_FOUND", "The Webflow collection was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const fields = Array.isArray(obj.fields) ? obj.fields : [];
  return {
    ...mapCollectionSummary(obj),
    fields: fields.filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object").map(mapField),
  };
}

// ---------------------------------------------------------------------------
// Collection items (CMS)
// ---------------------------------------------------------------------------

export type WebflowCollectionItemSummary = {
  itemId: string;
  nameSafe: string;
  slugSafe: string;
  isArchived: boolean;
  isDraft: boolean;
  lastUpdatedSafe: string;
};

export type WebflowCollectionItemDetail = WebflowCollectionItemSummary & {
  fieldData: Record<string, unknown>;
};

function mapItem(obj: Record<string, unknown>): WebflowCollectionItemDetail {
  const fieldData =
    obj.fieldData && typeof obj.fieldData === "object" ? (obj.fieldData as Record<string, unknown>) : {};
  return {
    itemId: obj.id != null ? String(obj.id) : "",
    nameSafe: typeof fieldData.name === "string" ? fieldData.name.slice(0, 300) : "",
    slugSafe: typeof fieldData.slug === "string" ? fieldData.slug.slice(0, 300) : "",
    isArchived: obj.isArchived === true,
    isDraft: obj.isDraft === true,
    lastUpdatedSafe: typeof obj.lastUpdated === "string" ? obj.lastUpdated.slice(0, 64) : "",
    fieldData,
  };
}

const ITEMS_DEFAULT_LIMIT = 20;
const ITEMS_MAX_LIMIT = 100;

/** GET /collections/{collectionId}/items — bounded page of EXISTING items only; optional client-side name filter. */
export async function listCollectionItems(
  token: string,
  collectionId: string,
  params: {offset?: number; limit?: number; nameFilter?: string | null},
): Promise<{items: WebflowCollectionItemSummary[]; total: number}> {
  const limit = Math.max(1, Math.min(params.limit ?? ITEMS_DEFAULT_LIMIT, ITEMS_MAX_LIMIT));
  const offset = Math.max(0, params.offset ?? 0);
  const search = new URLSearchParams();
  search.set("limit", String(limit));
  search.set("offset", String(offset));
  const result = await webflowFetch(
    `${WEBFLOW_API_BASE}/collections/${encodeURIComponent(collectionId)}/items?${search.toString()}`,
    {method: "GET", headers: authHeaders(token)},
  );
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_COLLECTION_NOT_FOUND", "The Webflow collection was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  let items = rawItems
    .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object")
    .map(mapItem);
  const nameFilter = params.nameFilter?.trim().toLowerCase();
  if (nameFilter) {
    items = items.filter((i) => i.nameSafe.toLowerCase().includes(nameFilter));
  }
  const pagination = obj.pagination && typeof obj.pagination === "object" ? (obj.pagination as Record<string, unknown>) : {};
  const total = typeof pagination.total === "number" ? pagination.total : items.length;
  return {items, total};
}

/** GET /collections/{collectionId}/items/{itemId} — used at eligibility/publish time to confirm the item still exists. */
export async function getCollectionItem(
  token: string,
  collectionId: string,
  itemId: string,
): Promise<WebflowCollectionItemDetail> {
  const result = await webflowFetch(
    `${WEBFLOW_API_BASE}/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
    {method: "GET", headers: authHeaders(token)},
  );
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_CMS_ITEM_NOT_FOUND", "The Webflow CMS item was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("WEBFLOW_API_UNAVAILABLE", `Webflow API responded with HTTP ${result.status}.`);
  }
  return mapItem(safeParseJson(result.body));
}

/**
 * PATCH /collections/{collectionId}/items/{itemId} — updates ONLY the
 * supplied `fieldData` keys on an EXISTING item. Never creates items, never
 * archives/drafts/publishes, and never calls the site-wide publish endpoint.
 */
export async function patchCollectionItem(
  token: string,
  collectionId: string,
  itemId: string,
  fieldDataPatch: Record<string, unknown>,
): Promise<WebflowCollectionItemDetail> {
  const result = await webflowFetch(
    `${WEBFLOW_API_BASE}/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      headers: {...authHeaders(token), "content-type": "application/json"},
      body: JSON.stringify({fieldData: fieldDataPatch}),
    },
  );
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_CMS_ITEM_NOT_FOUND", "The Webflow CMS item was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("CMS_UPDATE_FAILED", `Webflow CMS item update failed with HTTP ${result.status}.`);
  }
  return mapItem(safeParseJson(result.body));
}

// ---------------------------------------------------------------------------
// Assets (two-step upload)
// ---------------------------------------------------------------------------

export type WebflowAssetCreateResult = {
  assetId: string;
  uploadUrl: string;
  uploadDetails: Record<string, string>;
};

/** Step 1 — POST /sites/{siteId}/assets: create asset metadata and receive the S3 upload target. */
export async function createAsset(
  token: string,
  siteId: string,
  params: {fileName: string; fileHash: string},
): Promise<WebflowAssetCreateResult> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/sites/${encodeURIComponent(siteId)}/assets`, {
    method: "POST",
    headers: {...authHeaders(token), "content-type": "application/json"},
    body: JSON.stringify({fileName: params.fileName, fileHash: params.fileHash}),
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("WEBFLOW_SITE_NOT_FOUND", "The Webflow site was not found or is not accessible.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("ASSET_UPLOAD_FAILED", `Webflow asset creation failed with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const uploadDetailsRaw =
    obj.uploadDetails && typeof obj.uploadDetails === "object" ? (obj.uploadDetails as Record<string, unknown>) : {};
  const uploadDetails: Record<string, string> = {};
  for (const [key, value] of Object.entries(uploadDetailsRaw)) {
    if (typeof value === "string") uploadDetails[key] = value;
  }
  const uploadUrl = typeof obj.uploadUrl === "string" ? obj.uploadUrl : "";
  if (!uploadUrl || Object.keys(uploadDetails).length === 0) {
    throw new WebflowError("ASSET_UPLOAD_FAILED", "Webflow did not return an upload target for the asset.");
  }
  return {
    assetId: obj.id != null ? String(obj.id) : "",
    uploadUrl,
    uploadDetails,
  };
}

/** Step 2 — direct multipart POST of the asset bytes to the pre-signed S3 `uploadUrl` from step 1. */
export async function uploadAssetBinary(
  uploadUrl: string,
  uploadDetails: Record<string, string>,
  bytes: Buffer,
  contentType: string,
  fileName: string,
): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(uploadDetails)) {
    form.append(key, value);
  }
  form.append("file", new Blob([bytes as unknown as BlobPart], {type: contentType}), fileName);

  const result = await s3UploadFetch(uploadUrl, form);
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("ASSET_UPLOAD_FAILED", `Asset upload to storage failed with HTTP ${result.status}.`);
  }
}

export type WebflowAssetResult = {
  assetId: string;
  hostedUrlSafe: string;
  originalFileNameSafe: string;
};

/** GET /assets/{assetId} — ground truth used to verify the asset exists and to obtain its safe hosted URL. */
export async function getAsset(token: string, siteId: string, assetId: string): Promise<WebflowAssetResult> {
  const result = await webflowFetch(`${WEBFLOW_API_BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new WebflowError("ASSET_VERIFY_FAILED", "The remote Webflow asset was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WebflowError("ASSET_VERIFY_FAILED", `Webflow asset verification failed with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  if (typeof obj.siteId === "string" && obj.siteId && obj.siteId !== siteId) {
    throw new WebflowError("ASSET_VERIFY_FAILED", "The remote Webflow asset does not belong to the expected site.");
  }
  return {
    assetId: obj.id != null ? String(obj.id) : assetId,
    hostedUrlSafe: safeAssetUrl(obj.hostedUrl),
    originalFileNameSafe: typeof obj.originalFileName === "string" ? obj.originalFileName.slice(0, 300) : "",
  };
}
