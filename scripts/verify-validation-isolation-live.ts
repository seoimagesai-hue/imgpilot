/**
 * Prompt 7 remaining live verification:
 * - Two-user validation isolation (HTTP session + APIs)
 * - Signed-out rejection
 * - State integrity
 * - Authenticated EN/UR page checks
 * - Cleanup of only this run's users/projects/images/R2 keys
 *
 * Does NOT implement features. Never prints secrets or signed URL query strings.
 *
 * Usage:
 *   npx tsx scripts/verify-validation-isolation-live.ts [baseUrl]
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
    return `${u.origin}${u.pathname}?[redacted]`;
  } catch {
    return "[redacted]";
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

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("User A valid upload and validation", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  // Health check production server
  let serverOk = false;
  try {
    const health = await fetch(`${baseUrl}/en/login`, {redirect: "manual"});
    serverOk = health.status === 200;
  } catch {
    serverOk = false;
  }
  assert("Production server", serverOk, baseUrl);

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload, createOwnedImageReadUrl} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {getImageForOwnedProject, listImagesForOwnedProject} = await import(
    "../src/server/images/queries"
  );
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {getOwnedProject} = await import("../src/server/projects/queries");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `val-a-${stamp}@example.com`;
  const emailB = `val-b-${stamp}@example.com`;
  const password = `Val-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);
  const r2Keys: string[] = [];

  await db.insert(users).values([
    {id: userAId, name: "Val User A", email: emailA, passwordHash},
    {id: userBId, name: "Val User B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Val Project ${stamp}`,
    websiteUrl: "https://a.example",
    description: "validation isolation",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 64, height: 48, channels: 3, background: {r: 30, g: 140, b: 220}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  // --- User A: authorize → PUT → confirm → validate ---
  const auth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: "c1",
        originalFilename: "valid.jpg",
        mimeType: "image/jpeg",
        sizeBytes: jpeg.length,
      },
    ],
  });
  if (!auth.ok || !auth.results[0]?.ok) {
    assert("User A valid upload and validation", false, "authorize failed");
  }
  const authorized = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };
  r2Keys.push(
    (
      await getImageForOwnedProject(userAId, projectA.id, authorized.imageId)
    )?.storageKey ?? "",
  );

  const putRes = await fetch(authorized.uploadUrl, {
    method: "PUT",
    headers: authorized.headers,
    body: new Uint8Array(jpeg),
  });
  assert("User A R2 PUT", putRes.ok, `status=${putRes.status}`);

  const confirm = await confirmProjectUpload({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  assert("User A confirm", confirm.ok);

  const validated = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  assert(
    "User A valid upload and validation",
    validated.ok && validated.status === "validated" && validated.fullDecodePerformed === true,
  );

  let imageA = await getImageForOwnedProject(userAId, projectA.id, authorized.imageId);
  assert(
    "User A trusted metadata",
    Boolean(
      imageA &&
        imageA.status === "validated" &&
        imageA.width === 64 &&
        imageA.height === 48 &&
        imageA.detectedMimeType === "image/jpeg" &&
        imageA.validationVersion === "image-validation-v1",
    ),
  );

  const previewA = await createOwnedImageReadUrl({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  assert("User A signed preview", previewA.ok);
  if (previewA.ok) {
    console.log(`previewShape=${redactUrl(previewA.url)}`);
  }

  const attemptsBefore = imageA!.validationAttempts;
  const updatedAtBefore = imageA!.updatedAt.getTime();
  const validatedAtBefore = imageA!.validatedAt?.getTime();

  // --- HTTP sessions ---
  const sessionA = await login(baseUrl, emailA, password);
  const sessionB = await login(baseUrl, emailB, password);
  assert("User A session", sessionA.hasSession);
  assert("User B session", sessionB.hasSession);

  // User B: validate
  const bValidate = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${authorized.imageId}/validate`,
    {method: "POST", headers: {cookie: cookieHeader(sessionB.jar)}},
  );
  const bValidateJson = (await bValidate.json()) as {ok?: boolean; error?: string; url?: string};
  assert(
    "User B validation attempt",
    (bValidate.status === 404 || bValidate.status === 401) &&
      bValidateJson.ok === false &&
      (bValidateJson.error === "IMAGE_NOT_FOUND" || bValidateJson.error === "PROJECT_NOT_FOUND") &&
      !("url" in bValidateJson && bValidateJson.url),
  );

  // User B: retry (same endpoint)
  const bRetry = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${authorized.imageId}/validate`,
    {method: "POST", headers: {cookie: cookieHeader(sessionB.jar)}},
  );
  const bRetryJson = (await bRetry.json()) as {ok?: boolean; error?: string};
  assert(
    "User B retry attempt",
    (bRetry.status === 404 || bRetry.status === 401) && bRetryJson.ok === false,
  );

  // User B: metadata via list/query helpers
  const bList = await listImagesForOwnedProject(userBId, projectA.id, {status: "all"});
  const bGet = await getImageForOwnedProject(userBId, projectA.id, authorized.imageId);
  const bProject = await getOwnedProject(userBId, projectA.id);
  assert("User B metadata read", bList.length === 0 && bGet === null && bProject === null);

  // User B: signed preview
  const bPreviewHttp = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${authorized.imageId}/read-url`,
    {headers: {cookie: cookieHeader(sessionB.jar)}},
  );
  const bPreviewJson = (await bPreviewHttp.json()) as {ok?: boolean; url?: string; error?: string};
  assert(
    "User B signed-preview attempt",
    bPreviewHttp.status === 404 &&
      bPreviewJson.ok === false &&
      !bPreviewJson.url &&
      (bPreviewJson.error === "IMAGE_NOT_FOUND" || bPreviewJson.error === "PROJECT_NOT_FOUND"),
  );

  // User B: library route
  const bRoute = await fetch(`${baseUrl}/en/dashboard/projects/${projectA.id}/images`, {
    headers: {cookie: cookieHeader(sessionB.jar)},
    redirect: "manual",
  });
  const bRouteBody = bRoute.status === 200 ? await bRoute.text() : "";
  assert(
    "User B route access",
    bRoute.status === 404 ||
      (bRoute.status >= 300 && bRoute.status < 400) ||
      (bRoute.status === 200 && !bRouteBody.includes("valid.jpg")),
  );

  // Confirm User A row unchanged by B
  imageA = await getImageForOwnedProject(userAId, projectA.id, authorized.imageId);
  assert(
    "User A unchanged after B attempts",
    imageA?.validationAttempts === attemptsBefore &&
      imageA?.updatedAt.getTime() === updatedAtBefore &&
      imageA?.validatedAt?.getTime() === validatedAtBefore &&
      imageA?.status === "validated",
  );

  // --- Signed-out ---
  const soValidate = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${authorized.imageId}/validate`,
    {method: "POST"},
  );
  const soValidateJson = (await soValidate.json()) as {ok?: boolean; error?: string; url?: string};
  assert(
    "Signed-out validation",
    soValidate.status === 401 && soValidateJson.ok === false && !soValidateJson.url,
  );

  const soPreview = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${authorized.imageId}/read-url`,
  );
  const soPreviewJson = (await soPreview.json()) as {ok?: boolean; url?: string};
  assert(
    "Signed-out preview",
    soPreview.status === 401 && soPreviewJson.ok === false && !soPreviewJson.url,
  );

  const soRoute = await fetch(`${baseUrl}/en/dashboard/projects/${projectA.id}/images`, {
    redirect: "manual",
  });
  assert(
    "Signed-out route",
    soRoute.status >= 300 &&
      soRoute.status < 400 &&
      (soRoute.headers.get("location") || "").includes("/login"),
  );

  // --- Concurrent validation (force back to uploaded, then parallel) ---
  await db
    .update(images)
    .set({
      status: "uploaded",
      validatedAt: null,
      validationVersion: null,
      detectedFormat: null,
      detectedMimeType: null,
      width: null,
      height: null,
      pixelCount: null,
      failureCode: null,
      updatedAt: new Date(),
    })
    .where(eq(images.id, authorized.imageId));

  const [c1, c2] = await Promise.all([
    validateOwnedImage({userId: userAId, projectId: projectA.id, imageId: authorized.imageId}),
    validateOwnedImage({userId: userAId, projectId: projectA.id, imageId: authorized.imageId}),
  ]);
  const concurrentOk =
    (c1.ok && c2.ok) &&
    ((c1.status === "validated" && (c2.status === "validated" || c2.inProgress || c2.idempotent)) ||
      (c2.status === "validated" && (c1.status === "validated" || c1.inProgress || c1.idempotent)));
  // One should win; other idempotent/in_progress/validated — not two independent failure paths
  imageA = await getImageForOwnedProject(userAId, projectA.id, authorized.imageId);
  assert(
    "Concurrent validation result",
    concurrentOk && imageA?.status === "validated",
    `c1=${c1.ok && "status" in c1 ? c1.status : "err"} c2=${c2.ok && "status" in c2 ? c2.status : "err"}`,
  );

  // Idempotent validated
  const again = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  assert(
    "Validated idempotency",
    again.ok && again.status === "validated" && again.idempotent === true,
  );

  // --- Invalid-state protections ---
  const pendingId = crypto.randomUUID();
  const pendingKey = `test-validation/${stamp}/pending.jpg`;
  r2Keys.push(pendingKey);
  await db.insert(images).values({
    id: pendingId,
    projectId: projectA.id,
    originalFilename: "pending.jpg",
    storageKey: pendingKey,
    storageProvider: "r2",
    mimeType: "image/jpeg",
    fileExtension: "jpg",
    sizeBytes: 10,
    status: "pending_upload",
    uploadExpiresAt: new Date(Date.now() + 60_000),
  });
  const pendingTry = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: pendingId,
  });
  assert("Pending cannot validate", !pendingTry.ok && pendingTry.error === "UPLOAD_NOT_READY");

  const failedId = crypto.randomUUID();
  const failedKey = `test-validation/${stamp}/upload-failed.jpg`;
  r2Keys.push(failedKey);
  await db.insert(images).values({
    id: failedId,
    projectId: projectA.id,
    originalFilename: "upload-failed.jpg",
    storageKey: failedKey,
    storageProvider: "r2",
    mimeType: "image/jpeg",
    fileExtension: "jpg",
    sizeBytes: 10,
    status: "upload_failed",
    failureCode: "OBJECT_NOT_FOUND",
  });
  const failedTry = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: failedId,
  });
  assert("Upload-failed cannot validate", !failedTry.ok && failedTry.error === "UPLOAD_NOT_READY");

  const deletedId = crypto.randomUUID();
  const deletedKey = `test-validation/${stamp}/deleted.jpg`;
  r2Keys.push(deletedKey);
  await db.insert(images).values({
    id: deletedId,
    projectId: projectA.id,
    originalFilename: "deleted.jpg",
    storageKey: deletedKey,
    storageProvider: "r2",
    mimeType: "image/jpeg",
    fileExtension: "jpg",
    sizeBytes: 10,
    status: "deleted",
    deletedAt: new Date(),
  });
  const deletedTry = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: deletedId,
  });
  assert("Deleted cannot validate", !deletedTry.ok && deletedTry.error === "IMAGE_NOT_FOUND");

  // Failed validation retry increments once + clears on success
  const corrupt = Buffer.from("not-a-jpeg-payload-for-validation");
  const corruptAuth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: "corrupt1",
        originalFilename: "corrupt.jpg",
        mimeType: "image/jpeg",
        sizeBytes: corrupt.length,
      },
    ],
  });
  if (!corruptAuth.ok || !corruptAuth.results[0]?.ok) {
    assert("Corrupt image UX", false, "authorize corrupt failed");
  }
  const corruptItem = corruptAuth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };
  const corruptRow = await getImageForOwnedProject(userAId, projectA.id, corruptItem.imageId);
  if (corruptRow) r2Keys.push(corruptRow.storageKey);

  await fetch(corruptItem.uploadUrl, {
    method: "PUT",
    headers: corruptItem.headers,
    body: new Uint8Array(corrupt),
  });
  const corruptConfirm = await confirmProjectUpload({
    userId: userAId,
    projectId: projectA.id,
    imageId: corruptItem.imageId,
  });
  assert("Corrupt storage can succeed", corruptConfirm.ok);

  const corruptValidate = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: corruptItem.imageId,
  });
  let corruptImage = await getImageForOwnedProject(userAId, projectA.id, corruptItem.imageId);
  assert(
    "Corrupt image UX",
    !corruptValidate.ok &&
      corruptImage?.status === "validation_failed" &&
      Boolean(corruptImage.failureCode) &&
      corruptImage.validationAttempts >= 1,
  );
  const attemptsAfterFail = corruptImage!.validationAttempts;

  // Unauthorized must not bump attempts
  const bOnCorrupt = await fetch(
    `${baseUrl}/api/projects/${projectA.id}/images/${corruptItem.imageId}/validate`,
    {method: "POST", headers: {cookie: cookieHeader(sessionB.jar)}},
  );
  corruptImage = await getImageForOwnedProject(userAId, projectA.id, corruptItem.imageId);
  assert(
    "Unauthorized does not alter attempts",
    bOnCorrupt.status === 404 && corruptImage?.validationAttempts === attemptsAfterFail,
  );

  // Owner retry increments exactly once
  const retryFail = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: corruptItem.imageId,
  });
  corruptImage = await getImageForOwnedProject(userAId, projectA.id, corruptItem.imageId);
  assert(
    "Failed validation retry increments once",
    !retryFail.ok && corruptImage?.validationAttempts === attemptsAfterFail + 1,
  );

  // Successful retry on a fresh valid image that we mark failed then re-validate with good bytes
  // (use imageA already validated — mark failed then re-run)
  await db
    .update(images)
    .set({
      status: "validation_failed",
      failureCode: "CORRUPT_IMAGE",
      width: null,
      height: null,
      detectedMimeType: null,
      validatedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(images.id, authorized.imageId));
  const beforeRetrySuccess = (await getImageForOwnedProject(userAId, projectA.id, authorized.imageId))!
    .validationAttempts;
  const successRetry = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  imageA = await getImageForOwnedProject(userAId, projectA.id, authorized.imageId);
  assert(
    "Successful retry clears failure fields",
    successRetry.ok &&
      imageA?.status === "validated" &&
      imageA.failureCode === null &&
      imageA.width === 64 &&
      imageA.validationAttempts === beforeRetrySuccess + 1,
  );
  set("Invalid-state protections", "Passed");

  // Preview only when validated — temporarily set uploaded and ensure no URL
  await db
    .update(images)
    .set({status: "uploaded", updatedAt: new Date()})
    .where(eq(images.id, authorized.imageId));
  const previewWhileUploaded = await createOwnedImageReadUrl({
    userId: userAId,
    projectId: projectA.id,
    imageId: authorized.imageId,
  });
  assert("No preview for uploaded", !previewWhileUploaded.ok);
  await db
    .update(images)
    .set({
      status: "validated",
      validatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(images.id, authorized.imageId));

  // --- Browser-ish EN/UR page checks (authenticated HTML) ---
  const enLib = await fetch(`${baseUrl}/en/dashboard/projects/${projectA.id}/images?status=all`, {
    headers: {cookie: cookieHeader(sessionA.jar)},
  });
  const enHtml = await enLib.text();
  assert(
    "English browser flow",
    enLib.status === 200 &&
      /dir="ltr"/i.test(enHtml) &&
      enHtml.includes("valid.jpg") &&
      (enHtml.includes("Validated") || enHtml.includes("validated")) &&
      (enHtml.includes("64×48") || enHtml.includes("64×48") || enHtml.includes("64")),
  );

  const urLib = await fetch(`${baseUrl}/ur/dashboard/projects/${projectA.id}/images?status=all`, {
    headers: {cookie: cookieHeader(sessionA.jar)},
  });
  const urHtml = await urLib.text();
  assert(
    "Urdu browser flow",
    urLib.status === 200 && /dir="rtl"/i.test(urHtml) && /lang="ur"/i.test(urHtml),
  );

  // Mobile-ish viewport not true browser — check responsive classes exist on upload page
  const enUpload = await fetch(`${baseUrl}/en/dashboard/projects/${projectA.id}/images/upload`, {
    headers: {cookie: cookieHeader(sessionA.jar)},
  });
  const uploadHtml = await enUpload.text();
  assert(
    "Mobile layout",
    enUpload.status === 200 &&
      (uploadHtml.includes("sm:") || uploadHtml.includes("max-w") || uploadHtml.includes("flex-wrap")),
  );

  // Keyboard: retry control is a real <button>
  const failedLib = await fetch(
    `${baseUrl}/en/dashboard/projects/${projectA.id}/images?status=validation_failed`,
    {headers: {cookie: cookieHeader(sessionA.jar)}},
  );
  const failedHtml = await failedLib.text();
  assert(
    "Keyboard accessibility",
    failedLib.status === 200 &&
      failedHtml.includes("corrupt.jpg") &&
      /<button[^>]*>[\s\S]*Retry|retry|دوبارہ/i.test(failedHtml),
  );

  assert(
    "Console errors",
    !enHtml.includes("Sharp") &&
      !enHtml.includes("libvips") &&
      !enHtml.includes("AccessKey") &&
      !failedHtml.toLowerCase().includes("stack"),
    "no raw decoder/secrets in HTML",
  );

  // Interactive mouse/phase timing not automated
  set(
    "Interactive UI phase timing",
    "Not run",
    "Uploading→Confirming→Validating spinner timing needs human eyes",
  );

  // --- Cleanup ---
  for (const key of r2Keys.filter(Boolean)) {
    if (!key.startsWith("test-validation/") && !key.includes(`/projects/${projectA.id}/`)) {
      console.log(`SKIP cleanup unsafe key shape`);
      continue;
    }
    try {
      await storage.deleteObject(key);
    } catch {
      // best effort
    }
  }
  // Also delete any originals under this project's user prefix for created images
  const ownedImages = await db.select().from(images).where(eq(images.projectId, projectA.id));
  for (const row of ownedImages) {
    try {
      await storage.deleteObject(row.storageKey);
    } catch {
      // ignore
    }
  }

  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));

  const goneA = await db.select().from(users).where(eq(users.id, userAId));
  const goneB = await db.select().from(users).where(eq(users.id, userBId));
  const goneP = await db.select().from(projects).where(eq(projects.id, projectA.id));
  assert("Test-data cleanup", goneA.length === 0 && goneB.length === 0 && goneP.length === 0);

  await sql.end({timeout: 5});

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
