/**
 * Live E2E: session → upload → job → download for every public guest tool.
 * Usage: npx tsx scripts/verify-all-guest-tools-live.ts [baseUrl]
 */
import sharp from "sharp";
import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const BASE = process.argv[2] || process.env.VERIFY_BASE_URL || "http://127.0.0.1:3000";
const cookieName = process.env.GUEST_COOKIE_NAME || "seoimages_guest";
const outDir = join(process.cwd(), ".verify-tmp");
mkdirSync(outDir, {recursive: true});

type Row = {tool: string; ok: boolean; detail: string};
const rows: Row[] = [];

function log(tool: string, ok: boolean, detail: string) {
  rows.push({tool, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"}  ${tool} — ${detail}`);
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {__rawLen: text.length, __status: res.status};
  }
}

function extractCookie(res: Response): string | null {
  const anyHeaders = res.headers as Headers & {getSetCookie?: () => string[]};
  const list =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (() => {
          const single = res.headers.get("set-cookie");
          return single ? [single] : [];
        })();
  for (const c of list) {
    const m = c.match(new RegExp(`${cookieName}=([^;]+)`, "i"));
    if (m) return m[1];
  }
  return null;
}

async function session(toolCode: string) {
  const res = await fetch(`${BASE}/api/guest/session`, {
    method: "POST",
    headers: {"content-type": "application/json", "x-forwarded-for": "203.0.113.50"},
    body: JSON.stringify({locale: "en", toolCode}),
  });
  const body = await parseJson(res);
  const token = extractCookie(res);
  return {res, body, token};
}

async function jpegFixture() {
  return sharp({
    create: {width: 240, height: 180, channels: 3, background: {r: 40, g: 120, b: 200}},
  })
    .jpeg({quality: 85})
    .toBuffer();
}

async function upload(token: string, bytes: Buffer, filename: string, mime: string) {
  const authRes = await fetch(`${BASE}/api/guest/upload/authorize`, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
    body: JSON.stringify({
      originalFilename: filename,
      mimeType: mime,
      sizeBytes: bytes.byteLength,
    }),
  });
  const authBody = await parseJson(authRes);
  if (!authRes.ok || authBody.ok !== true) {
    return {ok: false as const, stage: "authorize", detail: `${authRes.status}:${String(authBody.error || "")}`};
  }
  const uploadId = String(authBody.uploadId);
  const uploadUrl = String(authBody.uploadUrl);
  const headers = (authBody.headers || {}) as Record<string, string>;
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {"content-type": mime, ...headers},
    body: bytes,
  });
  if (!put.ok) return {ok: false as const, stage: "put", detail: `http=${put.status}`};
  const conf = await fetch(`${BASE}/api/guest/upload/confirm`, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
    body: JSON.stringify({uploadId}),
  });
  const confBody = await parseJson(conf);
  if (!conf.ok || confBody.ok !== true) {
    return {ok: false as const, stage: "confirm", detail: `${conf.status}:${String(confBody.error || "")}`};
  }
  return {ok: true as const, uploadId};
}

async function runJob(
  token: string,
  uploadId: string,
  operation: string,
  options: Record<string, unknown>,
) {
  const res = await fetch(`${BASE}/api/guest/jobs`, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
    body: JSON.stringify({uploadId, operation, options}),
  });
  const body = await parseJson(res);
  return {res, body};
}

async function download(token: string, jobId: string) {
  const res = await fetch(`${BASE}/api/guest/download`, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
    body: JSON.stringify({jobId}),
  });
  const body = await parseJson(res);
  if (!res.ok || body.ok !== true || typeof body.url !== "string") {
    return {ok: false as const, bytes: 0, detail: `${res.status}:${String(body.error || "")}`};
  }
  const file = await fetch(String(body.url));
  const buf = Buffer.from(await file.arrayBuffer());
  return {ok: file.ok && buf.byteLength > 0, bytes: buf.byteLength, detail: `bytes=${buf.byteLength}`};
}

type Case = {
  name: string;
  toolCode: string;
  operation: string;
  options: Record<string, unknown>;
  expectsDownload: boolean;
  /** AI may be unconfigured — treat BLOCKED separately */
  allowBlocked?: boolean;
};

const CASES: Case[] = [
  {
    name: "compress",
    toolCode: "compress-image",
    operation: "compress.same_format",
    options: {preset: "balanced"},
    expectsDownload: true,
  },
  {
    name: "resize",
    toolCode: "resize-image",
    operation: "resize.same_format",
    options: {method: "by_width", width: 120, height: null, allowUpscale: false, maintainAspectRatio: true, preventUpscale: true, preset: "custom"},
    expectsDownload: true,
  },
  {
    name: "crop",
    toolCode: "crop-image",
    operation: "crop.same_format",
    options: {
      normalizedCrop: {x: 0.1, y: 0.1, width: 0.6, height: 0.6},
      aspectRatio: "free",
      zoom: 1,
    },
    expectsDownload: true,
  },
  {
    name: "convert",
    toolCode: "convert-image",
    operation: "convert.format",
    options: {targetFormat: "webp", qualityPreset: "balanced"},
    expectsDownload: true,
  },
  {
    name: "rotate",
    toolCode: "rotate-image",
    operation: "rotate.same_format",
    options: {angle: 90, flipHorizontal: false, flipVertical: false},
    expectsDownload: true,
  },
  {
    name: "watermark",
    toolCode: "watermark-image",
    operation: "watermark.same_format",
    options: {text: "Img Pilot", position: "bottom-right", opacity: 0.35},
    expectsDownload: true,
  },
  {
    name: "blur",
    toolCode: "blur-region",
    operation: "blur.region",
    options: {
      region: {x: 0.25, y: 0.25, width: 0.5, height: 0.5},
      strength: "medium",
    },
    expectsDownload: true,
  },
  {
    name: "meme",
    toolCode: "meme-generator",
    operation: "meme.caption",
    options: {topText: "TOP TEXT", bottomText: "BOTTOM TEXT"},
    expectsDownload: true,
  },
  {
    name: "geotag",
    toolCode: "geotag-image",
    operation: "geotag.write_gps",
    options: {
      latitude: 24.86,
      longitude: 67.0,
      altitudeMeters: 12,
      locationLabel: null,
      replaceExistingGps: true,
    },
    expectsDownload: true,
  },
  {
    name: "metadata",
    toolCode: "image-metadata",
    operation: "metadata.inspect",
    options: {},
    expectsDownload: false,
  },
  {
    name: "metadata-editor",
    toolCode: "image-metadata-editor",
    operation: "metadata.edit",
    options: {sourceMode: "blank"},
    expectsDownload: false,
  },
  {
    name: "ai-alt",
    toolCode: "ai-alt-text",
    operation: "ai.generate_alt_text",
    options: {tone: "neutral", language: "en", purpose: "general"},
    expectsDownload: false,
    allowBlocked: true,
  },
];

async function runCase(c: Case, bytes: Buffer) {
  const s = await session(c.toolCode);
  if (!s.token || s.body.ok !== true) {
    log(c.name, false, `session ${s.res.status}:${String(s.body.error || "")}`);
    return;
  }
  const up = await upload(s.token, bytes, `${c.name}.jpg`, "image/jpeg");
  if (!up.ok) {
    log(c.name, false, `upload ${up.stage}:${up.detail}`);
    return;
  }
  const job = await runJob(s.token, up.uploadId, c.operation, c.options);
  const jobId = String(job.body.jobId || "");
  const status = String(job.body.status || "");
  const err = String(job.body.error || "");

  if (c.allowBlocked && (!job.res.ok || err.includes("AI") || err.includes("NOT_CONFIGURED") || status === "failed")) {
    // Confirm status endpoint separately
    const st = await fetch(`${BASE}/api/guest/alt-text/status`);
    const stBody = await parseJson(st);
    if (stBody.configured === false) {
      log(c.name, true, `BLOCKED ai_unconfigured (expected)`);
      return;
    }
  }

  if (!job.res.ok || job.body.ok !== true) {
    log(c.name, false, `job http=${job.res.status} err=${err} status=${status}`);
    return;
  }

  if (!c.expectsDownload) {
    log(c.name, true, `job_ok status=${status || "ok"} jobId=yes`);
    return;
  }

  if (!jobId) {
    log(c.name, false, "missing jobId");
    return;
  }
  const dl = await download(s.token, jobId);
  log(c.name, dl.ok, dl.ok ? `download ${dl.detail}` : `download ${dl.detail}`);
}

async function runBulk(bytes: Buffer) {
  const s = await session("bulk-image-tools");
  if (!s.token || s.body.ok !== true) {
    // fallback short code used by older cutover
    const s2 = await session("bulk");
    if (!s2.token || s2.body.ok !== true) {
      log("bulk", false, `session failed`);
      return;
    }
    return runBulkWithToken(s2.token, bytes);
  }
  return runBulkWithToken(s.token, bytes);
}

async function runBulkWithToken(token: string, bytes: Buffer) {
  const create = await fetch(`${BASE}/api/guest/bulk`, {
    method: "POST",
    headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
    body: JSON.stringify({
      toolCode: "compress",
      options: {preset: "balanced"},
      files: [
        {originalFilename: "b1.jpg", mimeType: "image/jpeg", sizeBytes: bytes.byteLength},
        {originalFilename: "b2.jpg", mimeType: "image/jpeg", sizeBytes: bytes.byteLength},
      ],
    }),
  });
  const cBody = await parseJson(create);
  if (!create.ok || cBody.ok !== true) {
    log("bulk", false, `create ${create.status}:${String(cBody.error || "")}`);
    return;
  }
  const bulkJobId = String(cBody.bulkJobId || "");
  const items = (cBody.items as {itemId: string}[]) || [];
  for (let i = 0; i < items.length; i++) {
    const up = await upload(token, bytes, `b${i + 1}.jpg`, "image/jpeg");
    if (!up.ok) {
      log("bulk", false, `item upload ${up.stage}`);
      return;
    }
    const at = await fetch(`${BASE}/api/guest/bulk/${bulkJobId}/attach`, {
      method: "POST",
      headers: {"content-type": "application/json", cookie: `${cookieName}=${token}`},
      body: JSON.stringify({itemId: items[i].itemId, uploadId: up.uploadId}),
    });
    if (!at.ok) {
      log("bulk", false, `attach http=${at.status}`);
      return;
    }
  }
  const proc = await fetch(`${BASE}/api/guest/bulk/${bulkJobId}/process`, {
    method: "POST",
    headers: {cookie: `${cookieName}=${token}`},
  });
  const pBody = await parseJson(proc);
  const status = String(pBody.status || "");
  const ok = proc.ok && (status === "completed" || status === "partial");
  log("bulk", ok, `process status=${status} err=${String(pBody.error || "")}`);
}

async function main() {
  console.log(`base=${BASE}`);
  const ready = await fetch(`${BASE}/api/health/ready`);
  const readyBody = await parseJson(ready);
  console.log(`ready http=${ready.status} status=${String(readyBody.status)}`);

  const bytes = await jpegFixture();
  for (const c of CASES) {
    try {
      await runCase(c, bytes);
    } catch (e) {
      log(c.name, false, e instanceof Error ? e.message : "exception");
    }
  }
  try {
    await runBulk(bytes);
  } catch (e) {
    log("bulk", false, e instanceof Error ? e.message : "exception");
  }

  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.filter((r) => !r.ok).length;
  const report = {at: new Date().toISOString(), base: BASE, passed, failed, rows};
  const path = join(outDir, "all-guest-tools-live.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`report=${path}`);
  console.log(`tally passed=${passed} failed=${failed}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
