/**
 * Prompt 26 — server-side WordPress REST API client.
 * HTTP Basic auth (`username:applicationPassword`), env-configurable timeouts,
 * hard response-byte caps, and safe JSON parsing. Never logs the Authorization
 * header, the application password, or raw response bodies (which may echo
 * credentials back on some error pages).
 */
import {getWordpressMaxResponseBytes, getWordpressRequestTimeoutSeconds} from "@/lib/env";
import {assertSafeWordpressUrl, buildWordpressRestUrl} from "@/server/wordpress/url";
import {WordPressError} from "@/server/wordpress/errors";

function basicAuthHeader(username: string, applicationPassword: string): string {
  return `Basic ${Buffer.from(`${username}:${applicationPassword}`, "utf8").toString("base64")}`;
}

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
async function wordpressFetch(
  url: string,
  init: {method: string; headers: Record<string, string>; body?: BodyInit},
): Promise<RawFetchResult> {
  const timeoutMs = getWordpressRequestTimeoutSeconds() * 1000;
  const maxBytes = getWordpressMaxResponseBytes();
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
      throw new WordPressError(
        "WORDPRESS_URL_UNSAFE",
        "The WordPress site returned a redirect; redirects are not followed.",
      );
    }
    const {text, truncated} = await readLimitedBody(response, maxBytes);
    return {status: response.status, body: text, truncated};
  } catch (error) {
    if (error instanceof WordPressError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new WordPressError("WORDPRESS_TIMEOUT", "The request to the WordPress site timed out.");
    }
    throw new WordPressError("WORDPRESS_NETWORK_ERROR", "Could not reach the WordPress site.");
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
    throw new WordPressError("WORDPRESS_RESPONSE_UNPARSEABLE", "WordPress REST API returned an unexpected response.");
  }
}

function assertNotAuthOrPermissionFailure(status: number): void {
  if (status === 401) {
    throw new WordPressError("WORDPRESS_AUTHENTICATION_FAILED", "WordPress rejected the provided credentials.");
  }
  if (status === 403) {
    throw new WordPressError("WORDPRESS_PERMISSION_DENIED", "The WordPress account lacks the required permission.");
  }
}

export type WordpressDiscoveryResult = {
  siteTitle: string | null;
  namespacesPresent: boolean;
};

/** GET the REST API root to confirm it is reachable and enabled. No credentials required. */
export async function discoverRest(siteUrlNormalized: string): Promise<WordpressDiscoveryResult> {
  await assertSafeWordpressUrl(siteUrlNormalized);
  let result: RawFetchResult;
  try {
    result = await wordpressFetch(buildWordpressRestUrl(siteUrlNormalized, "wp-json/"), {
      method: "GET",
      headers: {accept: "application/json"},
    });
  } catch (error) {
    if (error instanceof WordPressError) throw error;
    throw new WordPressError("WORDPRESS_REST_UNAVAILABLE", "Could not reach the WordPress REST API.");
  }
  if (result.status === 404) {
    throw new WordPressError("WORDPRESS_REST_UNAVAILABLE", "WordPress REST API is not available on this site.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError(
      "WORDPRESS_REST_UNAVAILABLE",
      `WordPress REST API responded with HTTP ${result.status}.`,
    );
  }
  const obj = safeParseJson(result.body);
  const namespaces = Array.isArray(obj.namespaces) ? obj.namespaces : [];
  return {
    siteTitle: typeof obj.name === "string" ? obj.name.slice(0, 200) : null,
    namespacesPresent: namespaces.length > 0,
  };
}

export type WordpressAuthenticatedUser = {
  wordpressUserId: string;
  displayNameSafe: string;
  capabilities: Record<string, boolean>;
};

/** GET /wp/v2/users/me with Basic auth — validates credentials and captures capabilities. */
export async function authenticateAndGetUser(params: {
  siteUrlNormalized: string;
  username: string;
  applicationPassword: string;
}): Promise<WordpressAuthenticatedUser> {
  await assertSafeWordpressUrl(params.siteUrlNormalized);
  const url = buildWordpressRestUrl(params.siteUrlNormalized, "wp-json/wp/v2/users/me?context=edit");
  const result = await wordpressFetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: basicAuthHeader(params.username, params.applicationPassword),
    },
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError(
      "WORDPRESS_REST_UNAVAILABLE",
      `WordPress REST API responded with HTTP ${result.status}.`,
    );
  }
  const obj = safeParseJson(result.body);
  const rawCaps = obj.capabilities && typeof obj.capabilities === "object" ? obj.capabilities : {};
  const capabilities: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(rawCaps as Record<string, unknown>)) {
    if (typeof value === "boolean") capabilities[key] = value;
  }
  return {
    wordpressUserId: obj.id != null ? String(obj.id) : "",
    displayNameSafe: typeof obj.name === "string" ? obj.name.slice(0, 200) : "",
    capabilities,
  };
}

/** GET /wp/v2/media?per_page=1 with Basic auth — confirms the media endpoint is reachable and permitted. */
export async function checkMediaEndpoint(params: {
  siteUrlNormalized: string;
  username: string;
  applicationPassword: string;
}): Promise<{ok: true}> {
  await assertSafeWordpressUrl(params.siteUrlNormalized);
  const url = buildWordpressRestUrl(params.siteUrlNormalized, "wp-json/wp/v2/media?per_page=1&context=edit");
  const result = await wordpressFetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: basicAuthHeader(params.username, params.applicationPassword),
    },
  });
  if (result.status === 404) {
    throw new WordPressError("WORDPRESS_MEDIA_ENDPOINT_UNAVAILABLE", "WordPress media REST endpoint is not available.");
  }
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError(
      "WORDPRESS_REST_UNAVAILABLE",
      `WordPress REST API responded with HTTP ${result.status}.`,
    );
  }
  return {ok: true};
}

export type WordpressMediaResult = {
  remoteMediaId: string;
  remoteMediaUrlSafe: string;
  remoteFilename: string;
  remoteMimeType: string;
  remoteWidth: number | null;
  remoteHeight: number | null;
};

function mapMediaResponse(obj: Record<string, unknown>): WordpressMediaResult {
  const mediaDetails =
    obj.media_details && typeof obj.media_details === "object"
      ? (obj.media_details as Record<string, unknown>)
      : {};
  const sourceUrl = typeof obj.source_url === "string" ? obj.source_url : "";
  let remoteMediaUrlSafe = "";
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol === "https:") remoteMediaUrlSafe = sourceUrl;
  } catch {
    remoteMediaUrlSafe = "";
  }
  return {
    remoteMediaId: obj.id != null ? String(obj.id) : "",
    remoteMediaUrlSafe,
    remoteFilename:
      typeof obj.media_details === "object" && typeof (mediaDetails as {file?: unknown}).file === "string"
        ? String((mediaDetails as {file?: unknown}).file).split("/").pop() ?? ""
        : "",
    remoteMimeType: typeof obj.mime_type === "string" ? obj.mime_type : "",
    remoteWidth: typeof mediaDetails.width === "number" ? mediaDetails.width : null,
    remoteHeight: typeof mediaDetails.height === "number" ? mediaDetails.height : null,
  };
}

/** POST /wp/v2/media (multipart) — uploads the file and, best-effort, initial metadata fields. */
export async function uploadMedia(params: {
  siteUrlNormalized: string;
  username: string;
  applicationPassword: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
}): Promise<WordpressMediaResult> {
  await assertSafeWordpressUrl(params.siteUrlNormalized);
  const url = buildWordpressRestUrl(params.siteUrlNormalized, "wp-json/wp/v2/media");

  const form = new FormData();
  // Buffer's underlying ArrayBufferLike type isn't structurally assignable to the
  // BlobPart typed-array constraint in newer TS lib defs; the runtime bytes are fine.
  form.append("file", new Blob([params.bytes as unknown as BlobPart], {type: params.contentType}), params.filename);
  if (params.title) form.append("title", params.title);
  if (params.altText) form.append("alt_text", params.altText);
  if (params.caption) form.append("caption", params.caption);
  if (params.description) form.append("description", params.description);

  const result = await wordpressFetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: basicAuthHeader(params.username, params.applicationPassword),
    },
    body: form,
  });

  assertNotAuthOrPermissionFailure(result.status);
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError("WORDPRESS_UPLOAD_FAILED", `WordPress media upload failed with HTTP ${result.status}.`);
  }
  return mapMediaResponse(safeParseJson(result.body));
}

/** PATCH /wp/v2/media/{id} — update title/alt_text/caption/description on an existing media item. */
export async function updateMedia(params: {
  siteUrlNormalized: string;
  username: string;
  applicationPassword: string;
  remoteMediaId: string;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
}): Promise<WordpressMediaResult> {
  await assertSafeWordpressUrl(params.siteUrlNormalized);
  const url = buildWordpressRestUrl(
    params.siteUrlNormalized,
    `wp-json/wp/v2/media/${encodeURIComponent(params.remoteMediaId)}`,
  );
  const fields: Record<string, string> = {};
  if (params.title != null) fields.title = params.title;
  if (params.altText != null) fields.alt_text = params.altText;
  if (params.caption != null) fields.caption = params.caption;
  if (params.description != null) fields.description = params.description;

  const result = await wordpressFetch(url, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: basicAuthHeader(params.username, params.applicationPassword),
    },
    body: JSON.stringify(fields),
  });

  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new WordPressError("WORDPRESS_METADATA_UPDATE_FAILED", "The remote WordPress media item was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError(
      "WORDPRESS_METADATA_UPDATE_FAILED",
      `WordPress media metadata update failed with HTTP ${result.status}.`,
    );
  }
  return mapMediaResponse(safeParseJson(result.body));
}

/** GET /wp/v2/media/{id} — used to verify the remote item still exists after upload/update. */
export async function getMedia(params: {
  siteUrlNormalized: string;
  username: string;
  applicationPassword: string;
  remoteMediaId: string;
}): Promise<WordpressMediaResult> {
  await assertSafeWordpressUrl(params.siteUrlNormalized);
  const url = buildWordpressRestUrl(
    params.siteUrlNormalized,
    `wp-json/wp/v2/media/${encodeURIComponent(params.remoteMediaId)}?context=edit`,
  );
  const result = await wordpressFetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: basicAuthHeader(params.username, params.applicationPassword),
    },
  });
  assertNotAuthOrPermissionFailure(result.status);
  if (result.status === 404) {
    throw new WordPressError("WORDPRESS_VERIFY_FAILED", "The remote WordPress media item was not found.");
  }
  if (result.status < 200 || result.status >= 300) {
    throw new WordPressError("WORDPRESS_VERIFY_FAILED", `WordPress media verification failed with HTTP ${result.status}.`);
  }
  return mapMediaResponse(safeParseJson(result.body));
}
