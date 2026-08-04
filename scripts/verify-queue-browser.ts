/**
 * Prompt 16 Playwright queue UI verification (create + poll; no browser execute).
 * Usage: npx tsx scripts/verify-queue-browser.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {spawn, type ChildProcess} from "node:child_process";
import {chromium} from "playwright";
import sharp from "sharp";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};
const failures: string[] = [];

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
  if (status === "Failed") failures.push(name);
}

function assert(name: string, ok: boolean, detail?: string) {
  set(name, ok ? "Passed" : "Failed", detail);
}

function require(name: string, ok: boolean, detail?: string) {
  assert(name, ok, detail);
  if (!ok) throw new Error(name);
}

async function loginViaCredentials(baseUrl: string, email: string, password: string) {
  const jar = new Map<string, string>();
  const save = (res: Response) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
  };
  const header = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {headers: {cookie: header()}});
  save(csrfRes);
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
    headers: {"content-type": "application/x-www-form-urlencoded", cookie: header()},
    body,
    redirect: "manual",
  });
  save(loginRes);
  return [...jar.entries()].map(([name, value]) => ({
    name,
    value,
    domain: "localhost",
    path: "/",
  }));
}

function hasSecretLeak(text: string) {
  return /users\/[^/\s]+\/projects\//i.test(text) || /X-Amz-Signature/i.test(text);
}

async function openDetailsByFilename(page: import("playwright").Page, filename: string) {
  const row = page.locator(`li:has-text("${filename}"), tr:has-text("${filename}")`).first();
  await row.waitFor({timeout: 20_000});
  await row.getByRole("button", {name: /Open details|تفصیل کھولیں/i}).first().click();
  await page.locator("dialog").filter({hasText: /Image details|امیج تفصیل/i}).waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

function startWorker(workerId: string): ChildProcess {
  return spawn("npx", ["tsx", "scripts/processing-worker.ts"], {
    cwd: process.cwd(),
    env: {...process.env, WORKER_ID: workerId},
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  require("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Queue browser", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {
    users,
    projects,
    images,
    imageReplacements,
    projectQuotaState,
    quotaReservations,
    processingJobs,
    imageDerivatives,
    workerHeartbeats,
  } = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {READY_STATUS} = await import("../src/server/images/ready-eligibility");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const stamp = Date.now();
  const workerId = `queue-ui-worker-${stamp}`;
  const worker = startWorker(workerId);
  const userId = crypto.randomUUID();
  const email = `queue-ui-${stamp}@example.com`;
  const password = `QueueUi-${stamp}-Safe!`;
  const filename = `queue-ui-${stamp}.jpg`;

  await new Promise((r) => setTimeout(r, 2000));

  await db.insert(users).values({
    id: userId,
    name: "Queue UI",
    email,
    passwordHash: await hashPassword(password),
  });
  const project = await createOwnedProject(userId, {
    name: `Queue UI ${stamp}`,
    websiteUrl: "https://queue-ui.example",
    description: "queue browser",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 80, height: 60, channels: 3, background: {r: 25, g: 85, b: 125}},
  })
    .jpeg({quality: 85})
    .toBuffer();

  const auth = await authorizeProjectUploads({
    userId,
    projectId: project.id,
    files: [
      {
        clientId: crypto.randomUUID(),
        originalFilename: filename,
        mimeType: "image/jpeg",
        sizeBytes: jpeg.length,
      },
    ],
  });
  require("Authorize", Boolean(auth.ok && auth.results[0]?.ok));
  const item = auth.results[0] as {
    ok: true;
    imageId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  };
  require(
    "R2 PUT",
    (
      await fetch(item.uploadUrl, {
        method: "PUT",
        headers: item.headers,
        body: new Uint8Array(jpeg),
      })
    ).ok,
  );
  require(
    "Confirm",
    (await confirmProjectUpload({userId, projectId: project.id, imageId: item.imageId})).ok,
  );
  const validated = await validateOwnedImage({
    userId,
    projectId: project.id,
    imageId: item.imageId,
  });
  require("Ready", validated.ok && validated.status === READY_STATUS);
  const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
  const sourceKey = row!.storageKey!;

  const cookies = await loginViaCredentials(baseUrl, email, password);
  const browser = await chromium.launch({headless: true});
  const consoleErrors: string[] = [];

  try {
    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      await page.context().addCookies(cookies);
      await page.goto(
        `${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`,
        {waitUntil: "load", timeout: 60_000},
      );
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /Image details/i});
      assert(
        "EN optimize visible",
        await dialog.getByRole("heading", {name: /Optimize image/i}).isVisible(),
      );
      await dialog.getByRole("button", {name: /Optimize image/i}).click();
      await dialog.getByRole("button", {name: /Create optimized copy/i}).click();
      await page.waitForTimeout(25_000);
      const after = await dialog.innerText();
      assert("EN queued/processed via worker", /Completed|Processing|Job created|Queued/i.test(after));
      assert("No secret leak", !hasSecretLeak(after));
      assert("Console clean", consoleErrors.length === 0, String(consoleErrors.slice(0, 2)));
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.context().addCookies(cookies);
      await page.goto(
        `${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`,
        {waitUntil: "load", timeout: 60_000},
      );
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /Image details/i});
      assert(
        "Mobile optimize visible",
        await dialog.getByRole("heading", {name: /Optimize image/i}).isVisible(),
      );
      await page.close();
    }

    const signedOut = await fetch(
      `${baseUrl}/api/projects/${project.id}/processing/jobs/${item.imageId}?action=execute`,
      {method: "POST"},
    );
    assert("Signed-out execute blocked", signedOut.status === 401);

    const cookiesHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const createRes = await fetch(`${baseUrl}/api/projects/${project.id}/processing/jobs`, {
      method: "POST",
      headers: {"content-type": "application/json", cookie: cookiesHeader},
      body: JSON.stringify({
        imageId: item.imageId,
        operation: "convert_format",
        targetFormat: "webp",
        idempotencyKey: `browser-exec-block-${stamp}`,
      }),
    });
    const createJson = (await createRes.json()) as {ok?: boolean; job?: {id: string}};
    if (createJson.ok && createJson.job) {
      const execRes = await fetch(
        `${baseUrl}/api/projects/${project.id}/processing/jobs/${createJson.job.id}?action=execute`,
        {method: "POST", headers: {cookie: cookiesHeader}},
      );
      const execJson = (await execRes.json()) as {ok?: boolean; error?: string};
      assert(
        "Authed execute blocked",
        execRes.status === 409 && execJson.error === "QUEUE_WORKER_REQUIRED",
      );
    } else {
      assert("Authed execute blocked", false, "create failed");
    }
  } finally {
    await browser.close();
    worker.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
    const jobs = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.projectId, project.id));
    for (const j of jobs) {
      if (j.outputStorageKey) {
        try {
          await storage.deleteObject(j.outputStorageKey);
        } catch {
          /* best effort */
        }
      }
    }
    try {
      await storage.deleteObject(sourceKey);
    } catch {
      /* best effort */
    }
    await db.delete(imageDerivatives).where(eq(imageDerivatives.projectId, project.id));
    await db.delete(processingJobs).where(eq(processingJobs.projectId, project.id));
    await db.delete(quotaReservations).where(eq(quotaReservations.projectId, project.id));
    await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, project.id));
    await db.delete(imageReplacements).where(eq(imageReplacements.projectId, project.id));
    await db.delete(images).where(eq(images.projectId, project.id));
    await db.delete(projects).where(eq(projects.id, project.id));
    await db.delete(users).where(inArray(users.id, [userId]));
    await db.delete(workerHeartbeats).where(eq(workerHeartbeats.workerId, workerId));
    await sql.end({timeout: 5});
  }

  set("Queue browser", failures.length === 0 ? "Passed" : "Failed");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
