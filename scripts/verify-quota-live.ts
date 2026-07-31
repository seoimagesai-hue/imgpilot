/**
 * Prompt 10 live quota verification:
 * - User A/B + project seed
 * - getOwnedProjectQuotaUsage initial state
 * - authorize + PUT + confirm one image; verify usage increases
 * - User B cannot get usage / reserve
 * - Signed-out 401 when baseUrl reachable
 * - Cleanup of only this run's test data
 *
 * Never prints secrets, storage keys, or signed URL query strings.
 *
 * Usage:
 *   npx tsx scripts/verify-quota-live.ts [baseUrl]
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

async function readJsonSafe(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
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

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Quota live flow", "Blocked", "R2 not configured");
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
  else set("Production server", "Not run", "server unreachable — HTTP checks skipped");

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images, imageReplacements, projectQuotaState, quotaReservations} =
    await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {getOwnedProjectQuotaUsage, reserveNewUploads} = await import(
    "../src/server/images/quota-service"
  );
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `quota-a-${stamp}@example.com`;
  const emailB = `quota-b-${stamp}@example.com`;
  const password = `Quota-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);
  const trackedKeys: string[] = [];

  await db.insert(users).values([
    {id: userAId, name: "Quota User A", email: emailA, passwordHash},
    {id: userBId, name: "Quota User B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Quota ${stamp}`,
    websiteUrl: "https://a.example",
    description: "quota live",
    metadataLanguage: "en",
  });

  const initialUsage = await getOwnedProjectQuotaUsage(userAId, projectA.id);
  assert(
    "Initial quota usage",
    Boolean(initialUsage) &&
      initialUsage!.activeImageCount === 0 &&
      initialUsage!.effectiveUsageBytes === 0,
  );

  const jpeg = await sharp({
    create: {width: 32, height: 32, channels: 3, background: {r: 90, g: 120, b: 60}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const auth = await authorizeProjectUploads({
    userId: userAId,
    projectId: projectA.id,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: "quota-test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: jpeg.length,
      },
    ],
  });
  assert("Authorize upload", auth.ok && auth.results[0]?.ok);
  if (!auth.ok || !auth.results[0]?.ok) throw new Error("authorize failed");

  const item = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };

  const putRes = await fetch(item.uploadUrl, {
    method: "PUT",
    headers: item.headers,
    body: new Uint8Array(jpeg),
  });
  assert("R2 PUT", putRes.ok, `status=${putRes.status}`);

  const confirm = await confirmProjectUpload({
    userId: userAId,
    projectId: projectA.id,
    imageId: item.imageId,
  });
  assert("Confirm upload", confirm.ok);

  const afterUsage = await getOwnedProjectQuotaUsage(userAId, projectA.id);
  assert(
    "Usage increased after confirm",
    Boolean(afterUsage) &&
      afterUsage!.activeImageCount === 1 &&
      afterUsage!.activeOriginalBytes >= jpeg.length,
    afterUsage ? `bytes=${afterUsage.activeOriginalBytes}` : undefined,
  );

  const bUsage = await getOwnedProjectQuotaUsage(userBId, projectA.id);
  assert("User B quota usage blocked", bUsage === null);

  const expiresAt = new Date(Date.now() + 300_000);
  const bReserve = await reserveNewUploads(userBId, projectA.id, [
    {
      clientId: crypto.randomUUID(),
      imageId: crypto.randomUUID(),
      declaredBytes: jpeg.length,
      expiresAt,
    },
  ]);
  assert(
    "User B reserve blocked",
    !bReserve.ok && bReserve.error === "PROJECT_NOT_FOUND",
  );

  // Concurrent last-slot race (force counters near limit without creating 10k images)
  const {setQuotaStateReconciled} = await import("../src/server/images/quota-queries");
  const {MAX_IMAGES_PER_PROJECT} = await import("../src/server/images/quota-policy");
  await setQuotaStateReconciled(projectA.id, {
    activeImageCount: MAX_IMAGES_PER_PROJECT - 1,
    reservedImageSlots: 0,
    activeOriginalBytes: afterUsage!.activeOriginalBytes,
    reservedUploadBytes: 0,
    replacementCandidateBytes: 0,
    cleanupPendingBytes: 0,
    inconsistencyFlag: false,
  });

  const expiresRace = new Date(Date.now() + 300_000);
  const raceA = {
    clientId: crypto.randomUUID(),
    imageId: crypto.randomUUID(),
    declaredBytes: 100,
    expiresAt: expiresRace,
  };
  const raceB = {
    clientId: crypto.randomUUID(),
    imageId: crypto.randomUUID(),
    declaredBytes: 100,
    expiresAt: expiresRace,
  };
  const [r1, r2] = await Promise.all([
    reserveNewUploads(userAId, projectA.id, [raceA]),
    reserveNewUploads(userAId, projectA.id, [raceB]),
  ]);
  const successes = [r1, r2].filter((r) => r.ok).length;
  const slotErrors = [r1, r2].filter(
    (r) => !r.ok && r.error === "PROJECT_IMAGE_LIMIT_REACHED",
  ).length;
  assert(
    "Concurrent last-slot race",
    successes === 1 && slotErrors === 1,
    `successes=${successes} slotErrors=${slotErrors}`,
  );

  // Restore sane counters for leftover cleanup accounting
  await setQuotaStateReconciled(projectA.id, {
    activeImageCount: 1,
    reservedImageSlots: successes,
    activeOriginalBytes: afterUsage!.activeOriginalBytes,
    reservedUploadBytes: successes * 100,
    replacementCandidateBytes: 0,
    cleanupPendingBytes: 0,
    inconsistencyFlag: false,
  });

  if (serverOk) {
    const sessionA = await login(baseUrl, emailA, password);
    assert("User A session", sessionA.hasSession);

    const aQuotaHttp = await fetch(`${baseUrl}/api/projects/${projectA.id}/quota`, {
      headers: {cookie: cookieHeader(sessionA.jar)},
    });
    const aQuotaJson = await readJsonSafe(aQuotaHttp);
    assert(
      "User A HTTP quota GET",
      aQuotaHttp.status === 200 &&
        aQuotaJson?.ok === true &&
        typeof aQuotaJson.usage === "object",
    );

    const sessionB = await login(baseUrl, emailB, password);
    const bQuotaHttp = await fetch(`${baseUrl}/api/projects/${projectA.id}/quota`, {
      headers: {cookie: cookieHeader(sessionB.jar)},
    });
    const bQuotaJson = await readJsonSafe(bQuotaHttp);
    assert(
      "User B HTTP quota GET blocked",
      bQuotaHttp.status === 404 && bQuotaJson?.ok === false,
    );

    const soQuota = await fetch(`${baseUrl}/api/projects/${projectA.id}/quota`);
    const soQuotaJson = await readJsonSafe(soQuota);
    assert(
      "Signed-out HTTP quota GET",
      soQuota.status === 401 && soQuotaJson?.ok === false,
    );
  } else {
    set("User A HTTP quota GET", "Not run");
    set("User B HTTP quota GET blocked", "Not run");
    set("Signed-out HTTP quota GET", "Not run");
  }

  set("Quota live flow", "Passed");

  // --- Cleanup ---
  const projectImages = await db.select().from(images).where(eq(images.projectId, projectA.id));
  for (const row of projectImages) {
    if (row.storageKey?.includes(`/projects/${projectA.id}/`)) {
      trackedKeys.push(row.storageKey);
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

  await db.delete(quotaReservations).where(eq(quotaReservations.projectId, projectA.id));
  await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, projectA.id));
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
