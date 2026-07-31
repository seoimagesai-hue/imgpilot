/**
 * Prompt 9 live delete/replace verification:
 * - User A upload → validate → delete → HeadObject gone
 * - User A replacement: begin → PUT → confirm → validate → promote → old gone, new remains
 * - User B isolation + signed-out API checks (when baseUrl reachable)
 * - Cleanup of only this run's users/projects/images/R2 keys
 *
 * Never prints secrets, full storage keys, or signed URL query strings.
 *
 * Usage:
 *   npx tsx scripts/verify-delete-replace-live.ts [baseUrl]
 */
import {eq, inArray} from "drizzle-orm";
import sharp from "sharp";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  const suffix = detail ? ` (${detail})` : "";
  console.log(`${status.toUpperCase()}: ${name}${suffix}`);
}

function assert(name: string, ok: boolean, detail?: string): asserts ok {
  set(name, ok ? "Passed" : "Failed", detail);
  if (!ok) throw new Error(name);
}

type CookieJar = Map<string, string>;

function saveCookies(jar: CookieJar, res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx > 0) jar.set(pair.slice(0, eqIdx), pair.slice(eqIdx + 1));
  }
}

function cookieHeader(jar: CookieJar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function redactUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.origin}/[object]?[redacted]`;
  } catch {
    return "[redacted]";
  }
}

async function readJsonSafe(
  res: Response,
): Promise<{ok?: boolean; error?: string; uploadUrl?: string} | null> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {ok?: boolean; error?: string; uploadUrl?: string};
  } catch {
    return null;
  }
}

async function login(baseUrl: string, email: string, password: string) {
  const jar: CookieJar = new Map();
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {headers: {cookie: cookieHeader(jar)}});
  saveCookies(jar, csrfRes);
  const csrfJson = (await csrfRes.json()) as {csrfToken?: string};
  if (!csrfJson.csrfToken) throw new Error("csrf missing");

  const body = new URLSearchParams({
    csrfToken: csrfJson.csrfToken,
    email,
    password,
    redirect: "false",
    json: "true",
    callbackUrl: `${baseUrl}/en/dashboard`,
  });
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  saveCookies(jar, loginRes);
  const hasSession = [...jar.keys()].some((k) => /session-token/i.test(k));
  return {jar, hasSession, status: loginRes.status};
}

async function uploadAndValidate(params: {
  userId: string;
  projectId: string;
  filename: string;
  jpeg: Buffer;
  authorizeProjectUploads: typeof import("../src/server/images/upload-service").authorizeProjectUploads;
  confirmProjectUpload: typeof import("../src/server/images/upload-service").confirmProjectUpload;
  validateOwnedImage: typeof import("../src/server/images/validation-service").validateOwnedImage;
  getImageForOwnedProject: typeof import("../src/server/images/queries").getImageForOwnedProject;
}) {
  const auth = await params.authorizeProjectUploads({
    userId: params.userId,
    projectId: params.projectId,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: params.filename,
        mimeType: "image/jpeg",
        sizeBytes: params.jpeg.length,
      },
    ],
  });
  if (!auth.ok || !auth.results[0]?.ok) {
    throw new Error(`authorize failed for ${params.filename}`);
  }
  const item = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };

  const putRes = await fetch(item.uploadUrl, {
    method: "PUT",
    headers: item.headers,
    body: new Uint8Array(params.jpeg),
  });
  if (!putRes.ok) throw new Error(`PUT failed status=${putRes.status}`);

  const confirm = await params.confirmProjectUpload({
    userId: params.userId,
    projectId: params.projectId,
    imageId: item.imageId,
  });
  if (!confirm.ok) throw new Error("confirm failed");

  const validated = await params.validateOwnedImage({
    userId: params.userId,
    projectId: params.projectId,
    imageId: item.imageId,
  });
  if (!validated.ok || validated.status !== "validated") {
    throw new Error("validate failed");
  }

  const row = await params.getImageForOwnedProject(params.userId, params.projectId, item.imageId);
  if (!row?.storageKey) throw new Error("missing storage key after validate");

  return {imageId: item.imageId, storageKey: row.storageKey};
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Delete and replace live flow", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  let serverOk = false;
  try {
    const health = await fetch(`${baseUrl}/en/login`, {redirect: "manual"});
    serverOk = health.status === 200;
  } catch {
    serverOk = false;
  }
  if (serverOk) assert("Production server", true, baseUrl);
  else set("Production server", "Not run", "server unreachable — HTTP isolation checks skipped");

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images, imageReplacements} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {getImageForOwnedProject} = await import("../src/server/images/queries");
  const {deleteOwnedImage} = await import("../src/server/images/delete-service");
  const {
    beginOwnedImageReplacement,
    confirmOwnedReplacementUpload,
    validateOwnedReplacement,
    promoteOwnedReplacement,
  } = await import("../src/server/images/replace-service");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `del-a-${stamp}@example.com`;
  const emailB = `del-b-${stamp}@example.com`;
  const password = `Del-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);
  const trackedKeys: string[] = [];

  await db.insert(users).values([
    {id: userAId, name: "Del User A", email: emailA, passwordHash},
    {id: userBId, name: "Del User B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `DelReplace ${stamp}`,
    websiteUrl: "https://a.example",
    description: "delete replace live",
    metadataLanguage: "en",
  });

  const jpegA = await sharp({
    create: {width: 48, height: 32, channels: 3, background: {r: 200, g: 80, b: 40}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const jpegB = await sharp({
    create: {width: 64, height: 48, channels: 3, background: {r: 40, g: 120, b: 200}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  // --- Delete flow ---
  const deleteTarget = await uploadAndValidate({
    userId: userAId,
    projectId: projectA.id,
    filename: "delete-me.jpg",
    jpeg: jpegA,
    authorizeProjectUploads,
    confirmProjectUpload,
    validateOwnedImage,
    getImageForOwnedProject,
  });
  trackedKeys.push(deleteTarget.storageKey);

  assert("Delete target exists before delete", await storage.objectExists(deleteTarget.storageKey));

  const deleted = await deleteOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: deleteTarget.imageId,
  });
  assert(
    "User A delete",
    deleted.ok && deleted.status === "deleted",
    deleted.ok ? undefined : (deleted as {error?: string}).error,
  );
  assert("HeadObject gone after delete", !(await storage.objectExists(deleteTarget.storageKey)));

  const deletedRow = await getImageForOwnedProject(userAId, projectA.id, deleteTarget.imageId);
  assert("Image row hidden after delete", deletedRow === null);

  // --- Replacement flow ---
  const replaceBase = await uploadAndValidate({
    userId: userAId,
    projectId: projectA.id,
    filename: "replace-base.jpg",
    jpeg: jpegA,
    authorizeProjectUploads,
    confirmProjectUpload,
    validateOwnedImage,
    getImageForOwnedProject,
  });
  trackedKeys.push(replaceBase.storageKey);
  const oldStorageKey = replaceBase.storageKey;

  const begin = await beginOwnedImageReplacement({
    userId: userAId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
    originalFilename: "replacement.jpg",
    mimeType: "image/jpeg",
    sizeBytes: jpegB.length,
  });
  assert("Begin replacement", begin.ok, begin.ok ? undefined : begin.error);
  if (!begin.ok) throw new Error("begin replacement failed");

  console.log(`replacementUpload=${redactUrl(begin.uploadUrl)}`);

  const replacePut = await fetch(begin.uploadUrl, {
    method: "PUT",
    headers: begin.headers,
    body: new Uint8Array(jpegB),
  });
  assert("Replacement R2 PUT", replacePut.ok, `status=${replacePut.status}`);

  const replaceConfirm = await confirmOwnedReplacementUpload({
    userId: userAId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
    replacementId: begin.replacementId,
  });
  assert("Confirm replacement upload", replaceConfirm.ok);

  const replaceValidate = await validateOwnedReplacement({
    userId: userAId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
    replacementId: begin.replacementId,
  });
  assert(
    "Validate replacement",
    replaceValidate.ok && replaceValidate.status === "validated",
    replaceValidate.ok ? undefined : replaceValidate.error,
  );

  const promote = await promoteOwnedReplacement({
    userId: userAId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
    replacementId: begin.replacementId,
  });
  assert(
    "Promote replacement",
    promote.ok && (promote.status === "complete" || promote.status === "old_storage_cleanup_failed"),
    promote.ok ? `status=${promote.status}` : promote.error,
  );

  const promotedImage = await getImageForOwnedProject(userAId, projectA.id, replaceBase.imageId);
  assert(
    "Image points at new storage key",
    Boolean(promotedImage && promotedImage.storageKey !== oldStorageKey),
  );
  if (promotedImage) trackedKeys.push(promotedImage.storageKey);

  assert("Old object gone after promote", !(await storage.objectExists(oldStorageKey)));
  assert(
    "New object remains after promote",
    Boolean(promotedImage && (await storage.objectExists(promotedImage.storageKey))),
  );

  // --- User B isolation (service layer) ---
  const bDelete = await deleteOwnedImage({
    userId: userBId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
  });
  assert(
    "User B delete blocked",
    !bDelete.ok &&
      (bDelete.error === "PROJECT_NOT_FOUND" || bDelete.error === "IMAGE_NOT_FOUND"),
  );

  const bBegin = await beginOwnedImageReplacement({
    userId: userBId,
    projectId: projectA.id,
    imageId: replaceBase.imageId,
    originalFilename: "evil.jpg",
    mimeType: "image/jpeg",
    sizeBytes: jpegB.length,
  });
  assert(
    "User B replace blocked",
    !bBegin.ok &&
      (bBegin.error === "PROJECT_NOT_FOUND" || bBegin.error === "IMAGE_NOT_FOUND"),
  );

  // --- HTTP isolation when server is up ---
  if (serverOk) {
    const sessionA = await login(baseUrl, emailA, password);
    const sessionB = await login(baseUrl, emailB, password);
    assert("User A session", sessionA.hasSession);
    assert("User B session", sessionB.hasSession);

    const bDeleteHttp = await fetch(
      `${baseUrl}/api/projects/${projectA.id}/images/${replaceBase.imageId}/delete`,
      {method: "POST", headers: {cookie: cookieHeader(sessionB.jar)}},
    );
    const bDeleteJson = await readJsonSafe(bDeleteHttp);
    assert(
      "User B HTTP delete",
      Boolean(bDeleteJson) &&
        (bDeleteHttp.status === 404 || bDeleteHttp.status === 401) &&
        bDeleteJson!.ok === false,
      bDeleteJson ? undefined : `non-json status=${bDeleteHttp.status}`,
    );

    const bReplaceHttp = await fetch(
      `${baseUrl}/api/projects/${projectA.id}/images/${replaceBase.imageId}/replace/begin`,
      {
        method: "POST",
        headers: {
          cookie: cookieHeader(sessionB.jar),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          originalFilename: "evil.jpg",
          mimeType: "image/jpeg",
          sizeBytes: jpegB.length,
        }),
      },
    );
    const bReplaceJson = await readJsonSafe(bReplaceHttp);
    assert(
      "User B HTTP replace begin",
      Boolean(bReplaceJson) &&
        (bReplaceHttp.status === 404 || bReplaceHttp.status === 401) &&
        bReplaceJson!.ok === false &&
        !bReplaceJson!.uploadUrl,
      bReplaceJson ? undefined : `non-json status=${bReplaceHttp.status}`,
    );

    const soDelete = await fetch(
      `${baseUrl}/api/projects/${projectA.id}/images/${replaceBase.imageId}/delete`,
      {method: "POST"},
    );
    const soDeleteJson = await readJsonSafe(soDelete);
    assert(
      "Signed-out HTTP delete",
      Boolean(soDeleteJson) && soDelete.status === 401 && soDeleteJson!.ok === false,
      soDeleteJson ? undefined : `non-json status=${soDelete.status}`,
    );

    const soReplace = await fetch(
      `${baseUrl}/api/projects/${projectA.id}/images/${replaceBase.imageId}/replace/begin`,
      {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          originalFilename: "evil.jpg",
          mimeType: "image/jpeg",
          sizeBytes: jpegB.length,
        }),
      },
    );
    const soReplaceJson = await readJsonSafe(soReplace);
    assert(
      "Signed-out HTTP replace begin",
      Boolean(soReplaceJson) && soReplace.status === 401 && soReplaceJson!.ok === false,
      soReplaceJson ? undefined : `non-json status=${soReplace.status}`,
    );
  } else {
    set("User B HTTP delete", "Not run");
    set("User B HTTP replace begin", "Not run");
    set("Signed-out HTTP delete", "Not run");
    set("Signed-out HTTP replace begin", "Not run");
  }

  set("Delete and replace live flow", "Passed");

  // --- Cleanup ---
  const projectImages = await db.select().from(images).where(eq(images.projectId, projectA.id));
  for (const row of projectImages) {
    if (row.storageKey.includes(`/projects/${projectA.id}/`)) {
      try {
        await storage.deleteObject(row.storageKey);
      } catch {
        // best effort
      }
    }
  }

  const replacements = await db
    .select()
    .from(imageReplacements)
    .where(eq(imageReplacements.projectId, projectA.id));
  for (const row of replacements) {
    for (const key of [row.newStorageKey, row.oldStorageKey]) {
      if (key && key.includes(`/projects/${projectA.id}/`)) {
        try {
          await storage.deleteObject(key);
        } catch {
          // ignore
        }
      }
    }
  }

  for (const key of trackedKeys) {
    if (!key.includes(`/projects/${projectA.id}/`)) continue;
    try {
      await storage.deleteObject(key);
    } catch {
      // ignore
    }
  }

  await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));

  const goneA = await db.select().from(users).where(eq(users.id, userAId));
  assert("Test-data cleanup", goneA.length === 0);

  await sql.end({timeout: 5});

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
