/**
 * Prompt 29 — server-side Cloudinary Upload API + Admin API client, called
 * via plain `fetch` (no `cloudinary` npm package). Every upload/context call
 * is signed server-side (see `policy.ts#signUploadParams`); every Admin API
 * call uses HTTP Basic auth (`api_key:api_secret`). Env-configurable
 * timeouts, hard response-byte caps, safe JSON parsing, and manual redirect
 * handling. Never logs cloud_name, api_key, api_secret, or raw response
 * bodies.
 *
 * This client never calls destroy/delete on a remote asset, and every
 * upload is sent with `overwrite=false` — an existing asset is never
 * silently replaced.
 */
import {getCloudinaryMaxResponseBytes, getCloudinaryRequestTimeoutSeconds} from "@/lib/env";
import {CloudinaryError} from "@/server/cloudinary/errors";
import {buildContextString, parseContextObject, signUploadParams} from "@/server/cloudinary/policy";
import {assertSafeCloudinaryApiHost, CLOUDINARY_API_BASE, safeCloudinaryDeliveryUrl} from "@/server/cloudinary/url";

export type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

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

/** Low-level fetch wrapper against the Cloudinary API: bounded timeout, bounded response bytes, no redirects followed. */
async function cloudinaryFetch(
  url: string,
  init: {method: string; headers: Record<string, string>; body?: BodyInit},
): Promise<RawFetchResult> {
  await assertSafeCloudinaryApiHost();
  const timeoutMs = getCloudinaryRequestTimeoutSeconds() * 1000;
  const maxBytes = getCloudinaryMaxResponseBytes();
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
      throw new CloudinaryError(
        "CLOUDINARY_API_UNAVAILABLE",
        "Cloudinary returned a redirect; redirects are not followed.",
      );
    }
    const {text, truncated} = await readLimitedBody(response, maxBytes);
    if (truncated) {
      throw new CloudinaryError("CLOUDINARY_RESPONSE_TOO_LARGE", "Cloudinary response exceeded the maximum allowed size.");
    }
    return {status: response.status, body: text, truncated};
  } catch (error) {
    if (error instanceof CloudinaryError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CloudinaryError("CLOUDINARY_TIMEOUT", "The request to Cloudinary timed out.");
    }
    throw new CloudinaryError("CLOUDINARY_NETWORK_ERROR", "Could not reach Cloudinary.");
  } finally {
    clearTimeout(timer);
  }
}

function basicAuthHeader(apiKey: string, apiSecret: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`, "utf8").toString("base64")}`;
}

function safeParseJson(body: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new CloudinaryError("CLOUDINARY_RESPONSE_UNPARSEABLE", "Cloudinary returned an unexpected response.");
  }
}

function assertNotAuthPermissionOrRateLimitFailure(status: number): void {
  if (status === 401) {
    throw new CloudinaryError("CLOUDINARY_AUTHENTICATION_FAILED", "Cloudinary rejected the provided credentials.");
  }
  if (status === 403) {
    throw new CloudinaryError("CLOUDINARY_PERMISSION_DENIED", "The Cloudinary credentials lack the required scope.");
  }
  if (status === 420 || status === 429) {
    throw new CloudinaryError("RATE_LIMITED", "Cloudinary rate limit reached; retry later.");
  }
}

function cloudBase(cloudName: string): string {
  return `${CLOUDINARY_API_BASE}/v1_1/${encodeURIComponent(cloudName)}`;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export type CloudinaryVerifyResult = {
  ok: true;
  planSafe: string;
};

/** GET /v1_1/{cloud}/ping — confirms cloud_name + api_key + api_secret are a valid, matching triple. */
export async function verifyCredentials(credentials: CloudinaryCredentials): Promise<CloudinaryVerifyResult> {
  const result = await cloudinaryFetch(`${cloudBase(credentials.cloudName)}/ping`, {
    method: "GET",
    headers: {accept: "application/json", authorization: basicAuthHeader(credentials.apiKey, credentials.apiSecret)},
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new CloudinaryError("CLOUDINARY_AUTHENTICATION_FAILED", "The Cloudinary cloud name was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new CloudinaryError("CLOUDINARY_API_UNAVAILABLE", `Cloudinary API responded with HTTP ${result.status}.`);
  }
  const obj = safeParseJson(result.body);
  const status = typeof obj.status === "string" ? obj.status : "";
  if (status && status !== "ok") {
    throw new CloudinaryError("CLOUDINARY_API_UNAVAILABLE", "Cloudinary ping did not return a healthy status.");
  }
  return {ok: true, planSafe: ""};
}

// ---------------------------------------------------------------------------
// Upload (signed Upload API — no cloudinary npm package)
// ---------------------------------------------------------------------------

export type CloudinaryUploadResult = {
  assetId: string;
  publicId: string;
  version: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  resourceType: string;
  secureUrlSafe: string;
};

function mapUploadResponse(obj: Record<string, unknown>): CloudinaryUploadResult {
  return {
    assetId: obj.asset_id != null ? String(obj.asset_id) : "",
    publicId: obj.public_id != null ? String(obj.public_id) : "",
    version: obj.version != null ? String(obj.version) : "",
    format: typeof obj.format === "string" ? obj.format : null,
    width: typeof obj.width === "number" ? obj.width : null,
    height: typeof obj.height === "number" ? obj.height : null,
    bytes: typeof obj.bytes === "number" ? obj.bytes : null,
    resourceType: typeof obj.resource_type === "string" ? obj.resource_type : "image",
    secureUrlSafe: safeCloudinaryDeliveryUrl(obj.secure_url),
  };
}

/**
 * POST /v1_1/{cloud}/image/upload — signed multipart upload of bytes already
 * validated server-side. `overwrite=false` and a server-generated
 * `public_id` are always sent so an existing asset is never replaced.
 */
export async function uploadImage(params: {
  credentials: CloudinaryCredentials;
  publicId: string;
  folder: string;
  bytes: Buffer;
  mimeType: string;
  filename: string;
  context?: {altText?: string | null; caption?: string | null; title?: string | null; description?: string | null};
}): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const contextString = params.context ? buildContextString(params.context) : "";

  const signableParams: Record<string, string | number | boolean> = {
    timestamp,
    public_id: params.publicId,
    folder: params.folder,
    overwrite: false,
    unique_filename: false,
  };
  if (contextString) signableParams.context = contextString;
  // Locked decision — CLOUDINARY_MAX_EAGER=0: no `eager` param is ever sent.

  const signature = signUploadParams(signableParams, params.credentials.apiSecret);

  const form = new FormData();
  form.append("api_key", params.credentials.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("public_id", params.publicId);
  form.append("folder", params.folder);
  form.append("overwrite", "false");
  form.append("unique_filename", "false");
  if (contextString) form.append("context", contextString);
  form.append("file", new Blob([params.bytes as unknown as BlobPart], {type: params.mimeType}), params.filename);

  const result = await cloudinaryFetch(`${cloudBase(params.credentials.cloudName)}/image/upload`, {
    method: "POST",
    headers: {accept: "application/json"},
    body: form,
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    const obj = safeParseJson(result.body);
    const message = typeof obj.error === "object" && obj.error && typeof (obj.error as Record<string, unknown>).message === "string"
      ? String((obj.error as Record<string, unknown>).message)
      : `Cloudinary upload failed with HTTP ${result.status}.`;
    if (/too large/i.test(message)) {
      throw new CloudinaryError("ASSET_TOO_LARGE", "Image exceeds Cloudinary's upload size limit.");
    }
    if (/format/i.test(message) && /not allowed|invalid/i.test(message)) {
      throw new CloudinaryError("ASSET_UNSUPPORTED_FORMAT", "Image format is not supported by Cloudinary.");
    }
    throw new CloudinaryError("ASSET_UPLOAD_FAILED", message);
  }
  return mapUploadResponse(safeParseJson(result.body));
}

// ---------------------------------------------------------------------------
// Admin API — read-only resource lookup (ground truth after upload/context)
// ---------------------------------------------------------------------------

export type CloudinaryResourceResult = CloudinaryUploadResult & {
  context: {alt: string; caption: string; title: string; description: string};
};

function mapResourceResponse(obj: Record<string, unknown>): CloudinaryResourceResult {
  const upload = mapUploadResponse(obj);
  return {...upload, context: parseContextObject(obj.context as Record<string, unknown> | undefined)};
}

/** GET /v1_1/{cloud}/resources/image/upload/{public_id} — ground truth used to verify an asset + read its context. */
export async function getResource(params: {
  credentials: CloudinaryCredentials;
  publicId: string;
}): Promise<CloudinaryResourceResult> {
  const url = `${cloudBase(params.credentials.cloudName)}/resources/image/upload/${encodeURIComponent(params.publicId)}?context=true`;
  const result = await cloudinaryFetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: basicAuthHeader(params.credentials.apiKey, params.credentials.apiSecret),
    },
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status === 404) {
    throw new CloudinaryError("ASSET_VERIFY_FAILED", "The remote Cloudinary asset was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new CloudinaryError("ASSET_VERIFY_FAILED", `Cloudinary asset verification failed with HTTP ${result.status}.`);
  }
  return mapResourceResponse(safeParseJson(result.body));
}

// ---------------------------------------------------------------------------
// Metadata (context) updates — Upload API explicit context endpoint
// ---------------------------------------------------------------------------

/**
 * POST /v1_1/{cloud}/image/context — updates ONLY the structured metadata
 * context (alt|caption|title|description) on an EXISTING asset. Never
 * re-uploads bytes and never calls destroy/delete.
 */
export async function updateContext(params: {
  credentials: CloudinaryCredentials;
  publicId: string;
  context: {altText?: string | null; caption?: string | null; title?: string | null; description?: string | null};
}): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const contextString = buildContextString(params.context);

  const signableParams: Record<string, string | number | boolean> = {
    timestamp,
    command: "add",
    context: contextString,
    public_ids: params.publicId,
  };
  const signature = signUploadParams(signableParams, params.credentials.apiSecret);

  const form = new FormData();
  form.append("api_key", params.credentials.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("command", "add");
  form.append("context", contextString);
  form.append("public_ids[]", params.publicId);

  const result = await cloudinaryFetch(`${cloudBase(params.credentials.cloudName)}/image/context`, {
    method: "POST",
    headers: {accept: "application/json"},
    body: form,
  });
  assertNotAuthPermissionOrRateLimitFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new CloudinaryError("METADATA_UPDATE_FAILED", `Cloudinary context update failed with HTTP ${result.status}.`);
  }
}
