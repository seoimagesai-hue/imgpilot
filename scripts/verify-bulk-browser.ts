/**
 * Prompt 15 Playwright bulk UI verification.
 * Usage: npx tsx scripts/verify-bulk-browser.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
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

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  require("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Bulk browser", "Blocked", "R2 not configured");
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
    bulkJobs,
    bulkJobItems,
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
  const userId = crypto.randomUUID();
  const email = `bulk-ui-${stamp}@example.com`;
  const password = `BulkUi-${stamp}-Safe!`;
  const filename = `bulk-ui-${stamp}.jpg`;

  await db.insert(users).values({
    id: userId,
    name: "Bulk UI",
    email,
    passwordHash: await hashPassword(password),
  });
  const project = await createOwnedProject(userId, {
    name: `Bulk UI ${stamp}`,
    websiteUrl: "https://bulk-ui.example",
    description: "bulk browser",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 80, height: 60, channels: 3, background: {r: 20, g: 80, b: 120}},
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
      assert("EN library", await page.getByText(filename).first().isVisible());

      const checkbox = page.locator(`li:has-text("${filename}") input[type="checkbox"]`).first();
      await checkbox.check();
      assert("EN bulk toolbar", await page.getByText(/image selected|images selected/i).isVisible());
      assert("EN operation selector", await page.getByLabel(/Bulk operation/i).isVisible());
      assert("EN run", await page.getByRole("button", {name: /^Run$/i}).isVisible());

      await page.getByLabel(/Bulk operation/i).selectOption("optimize");
      await page.getByRole("button", {name: /^Run$/i}).click();
      await page.waitForTimeout(15_000);
      const toolbarText = await page.locator("div").filter({hasText: /Bulk status|Completed/i}).first().innerText().catch(() => "");
      const bodyText = await page.locator("body").innerText();
      assert(
        "EN bulk progress",
        /Completed|partially_completed|completed|Failed|Running/i.test(bodyText + toolbarText),
      );
      assert("No secret leak", !hasSecretLeak(bodyText));
      assert("Console clean", consoleErrors.length === 0, String(consoleErrors.slice(0, 2)));
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(
        `${baseUrl}/ur/dashboard/projects/${project.id}/images?status=ready_for_processing`,
        {waitUntil: "load", timeout: 60_000},
      );
      assert("UR RTL", (await page.locator("html").getAttribute("dir")) === "rtl");
      const checkbox = page.locator(`li:has-text("${filename}") input[type="checkbox"]`).first();
      await checkbox.check();
      assert("UR bulk toolbar", await page.getByText(/امیج منتخب|امیجز منتخب/i).isVisible());
      assert("UR run", await page.getByRole("button", {name: /چلائیں/i}).isVisible());
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.context().addCookies(cookies);
      await page.goto(
        `${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`,
        {waitUntil: "load", timeout: 60_000},
      );
      const checkbox = page.locator(`li:has-text("${filename}") input[type="checkbox"], tr:has-text("${filename}") input[type="checkbox"]`).first();
      await checkbox.check();
      assert("Mobile bulk run", await page.getByRole("button", {name: /^Run$/i}).isVisible());
      await page.close();
    }

    const signedOut = await fetch(`${baseUrl}/api/projects/${project.id}/processing/bulk`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        imageIds: [item.imageId],
        operation: "optimize_same_format",
      }),
    });
    assert("Signed-out blocked", signedOut.status === 401);
  } finally {
    await browser.close();
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
    await db.delete(bulkJobItems).where(eq(bulkJobItems.projectId, project.id));
    await db.delete(bulkJobs).where(eq(bulkJobs.projectId, project.id));
    await db.delete(imageDerivatives).where(eq(imageDerivatives.projectId, project.id));
    await db.delete(processingJobs).where(eq(processingJobs.projectId, project.id));
    await db.delete(quotaReservations).where(eq(quotaReservations.projectId, project.id));
    await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, project.id));
    await db.delete(imageReplacements).where(eq(imageReplacements.projectId, project.id));
    await db.delete(images).where(eq(images.projectId, project.id));
    await db.delete(projects).where(eq(projects.id, project.id));
    await db.delete(users).where(inArray(users.id, [userId]));
    await sql.end({timeout: 5});
  }

  set("Bulk browser", failures.length === 0 ? "Passed" : "Failed");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
