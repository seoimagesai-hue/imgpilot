/**
 * Prompt 11 live Ready verification:
 * validate → ready; User B blocked; signed-out blocked; cleanup.
 *
 * Usage:
 *   npx tsx scripts/verify-ready-live.ts [baseUrl]
 */
import {eq, inArray} from "drizzle-orm";
import sharp from "sharp";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
}

function assert(name: string, ok: boolean, detail?: string): asserts ok {
  set(name, ok ? "Passed" : "Failed", detail);
  if (!ok) throw new Error(name);
}

type CookieJar = Map<string, string>;

function saveCookies(jar: CookieJar, res: Response) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
}

function cookieHeader(jar: CookieJar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function login(baseUrl: string, email: string, password: string) {
  const jar: CookieJar = new Map();
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {headers: {cookie: cookieHeader(jar)}});
  saveCookies(jar, csrfRes);
  const csrf = (await csrfRes.json()) as {csrfToken?: string};
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken!,
    email,
    password,
    redirect: "false",
    json: "true",
    callbackUrl: `${baseUrl}/en/dashboard`,
  });
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded", cookie: cookieHeader(jar)},
    body,
    redirect: "manual",
  });
  saveCookies(jar, loginRes);
  return {jar, hasSession: [...jar.keys()].some((k) => /session-token/i.test(k))};
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Ready live flow", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  let serverOk = false;
  try {
    serverOk = (await fetch(`${baseUrl}/en/login`)).status === 200;
  } catch {
    serverOk = false;
  }
  if (serverOk) assert("Production server", true, baseUrl);
  else set("Production server", "Not run");

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images, imageReplacements, projectQuotaState, quotaReservations} =
    await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {getOwnedProjectReadySummary} = await import("../src/server/images/ready-service");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `ready-a-${stamp}@example.com`;
  const emailB = `ready-b-${stamp}@example.com`;
  const password = `Ready-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values([
    {id: userAId, name: "Ready A", email: emailA, passwordHash},
    {id: userBId, name: "Ready B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Ready ${stamp}`,
    websiteUrl: "https://ready.example",
    description: "ready live",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 40, height: 40, channels: 3, background: {r: 20, g: 90, b: 140}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const auth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: "ready.jpg",
        mimeType: "image/jpeg",
        sizeBytes: jpeg.length,
      },
    ],
  });
  assert("Authorize", Boolean(auth.ok && auth.results[0]?.ok));
  if (!auth.ok || !auth.results[0]?.ok) throw new Error("authorize");

  const item = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };

  const put = await fetch(item.uploadUrl, {
    method: "PUT",
    headers: item.headers,
    body: new Uint8Array(jpeg),
  });
  assert("R2 PUT", put.ok, `status=${put.status}`);

  const confirm = await confirmProjectUpload({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
  });
  assert("Confirm", confirm.ok);

  const validated = await validateOwnedImage({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
  });
  assert(
    "Validate promotes Ready",
    validated.ok && validated.status === READY_STATUS,
    validated.ok ? `status=${validated.status}` : "failed",
  );

  const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
  assert("DB status ready_for_processing", row?.status === READY_STATUS);

  const summary = await getOwnedProjectReadySummary(userAId, projectA.id);
  assert("Ready summary count", Boolean(summary && summary.readyImageCount === 1));

  const bSummary = await getOwnedProjectReadySummary(userBId, projectA.id);
  assert("User B summary blocked", bSummary === null);

  if (serverOk) {
    const sessionA = await login(baseUrl, emailA, password);
    assert("User A session", sessionA.hasSession);
    const aRes = await fetch(`${baseUrl}/api/projects/${projectA.id}/ready`, {
      headers: {cookie: cookieHeader(sessionA.jar)},
    });
    const aJson = (await aRes.json()) as {ok?: boolean; summary?: {readyImageCount?: number}};
    assert(
      "User A HTTP ready GET",
      aRes.status === 200 && aJson.ok === true && aJson.summary?.readyImageCount === 1,
    );

    const sessionB = await login(baseUrl, emailB, password);
    const bRes = await fetch(`${baseUrl}/api/projects/${projectA.id}/ready`, {
      headers: {cookie: cookieHeader(sessionB.jar)},
    });
    assert("User B HTTP ready GET blocked", bRes.status === 404);

    const so = await fetch(`${baseUrl}/api/projects/${projectA.id}/ready`);
    assert("Signed-out HTTP ready GET", so.status === 401);
  }

  set("Ready live flow", "Passed");

  try {
    if (row?.storageKey?.includes(`/projects/${projectA.id}/`)) {
      await storage.deleteObject(row.storageKey);
    }
  } catch {
    /* best effort */
  }

  await db.delete(quotaReservations).where(eq(quotaReservations.projectId, projectA.id));
  await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, projectA.id));
  await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
  await db.delete(images).where(eq(images.projectId, projectA.id));
  await db.delete(projects).where(eq(projects.id, projectA.id));
  await db.delete(users).where(inArray(users.id, [userAId, userBId]));
  assert("Cleanup", true);

  await sql.end({timeout: 5});
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
