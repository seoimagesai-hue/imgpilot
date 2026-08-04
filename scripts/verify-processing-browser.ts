/**
 * Prompt 12 Playwright processing UI verification.
 * Usage: npx tsx scripts/verify-processing-browser.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {chromium, type Page} from "playwright";
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
  return (
    /users\/[^/\s]+\/projects\//i.test(text) ||
    /X-Amz-Signature/i.test(text) ||
    /R2_SECRET|ACCESS_KEY|AKIA/i.test(text) ||
    /SharpError|@aws-sdk|postgres/i.test(text)
  );
}

async function openDetailsByFilename(page: Page, filename: string) {
  const row = page.locator(`li:has-text("${filename}"), tr:has-text("${filename}")`).first();
  await row.waitFor({timeout: 20_000});
  await row.getByRole("button", {name: /Open details|تفصیل کھولیں/i}).first().click();
  await page.locator("dialog").filter({hasText: /Image details|امیج تفصیل/i}).waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  require("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Processing browser", "Blocked", "R2 not configured");
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
  const email = `proc-ui-${stamp}@example.com`;
  const password = `ProcUi-${stamp}-Safe!`;
  const filename = `proc-ui-${stamp}.jpg`;

  await db.insert(users).values({
    id: userId,
    name: "Proc UI",
    email,
    passwordHash: await hashPassword(password),
  });
  const project = await createOwnedProject(userId, {
    name: `Proc UI ${stamp}`,
    websiteUrl: "https://proc-ui.example",
    description: "processing browser",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 80, height: 60, channels: 3, background: {r: 90, g: 40, b: 20}},
  })
    .jpeg({quality: 92})
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
  require("Authorize upload", Boolean(auth.ok && auth.results[0]?.ok));
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
    "Confirm upload",
    (await confirmProjectUpload({userId, projectId: project.id, imageId: item.imageId})).ok,
  );
  const validated = await validateOwnedImage({
    userId,
    projectId: project.id,
    imageId: item.imageId,
  });
  require("Ready image", validated.ok && validated.status === READY_STATUS);

  const [imageRow] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
  const sourceKey = imageRow!.storageKey!;
  let outputKey: string | null = null;

  const browser = await chromium.launch({headless: true});
  const cookies = await loginViaCredentials(baseUrl, email, password);

  try {
    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /Image details/i});
      assert("EN Optimize action", await dialog.getByRole("button", {name: /Optimize image/i}).isVisible());
      assert(
        "EN original unchanged copy",
        /original private file remains unchanged/i.test(await dialog.innerText()),
      );
      assert("EN same format", /Same format/i.test(await dialog.innerText()));
      assert("EN same dimensions", /Same dimensions/i.test(await dialog.innerText()));
      assert("No Process All", !(await page.getByRole("button", {name: /process all|queue/i}).count()));
      assert("No ZIP/CSV", !/zip|csv export/i.test(await dialog.innerText()));

      await dialog.getByRole("button", {name: /Optimize image/i}).click();
      assert("EN confirm dialog", await dialog.getByRole("dialog").isVisible());
      await dialog.getByRole("button", {name: /Create optimized copy/i}).click();
      await page.waitForTimeout(8_000);
      const after = await dialog.innerText();
      assert("EN completed or processing", /Completed|Processing|Uploading|Verifying/i.test(after));
      assert("EN original size label", /Original size/i.test(after));
      assert("No secret leak EN", !hasSecretLeak(after));
      assert("No fake % progress", !/\d{1,3}% complete/i.test(after));
      assert("Browser console clean EN", consoleErrors.length === 0, String(consoleErrors.slice(0, 2)));
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/ur/dashboard/projects/${project.id}/images?status=ready_for_processing`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert("UR RTL", (await page.locator("html").getAttribute("dir")) === "rtl");
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /امیج تفصیل/i});
      assert(
        "UR Optimize action",
        await dialog.getByRole("button", {name: /امیج optimize کریں/i}).isVisible(),
      );
      assert("UR original unchanged", /اصل نجی فائل تبدیل نہیں ہوتی/i.test(await dialog.innerText()));
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /Image details/i});
      assert(
        "Mobile Optimize reachable",
        await dialog.getByRole("button", {name: /Optimize image|Preview optimized|Retry/i}).first().isVisible(),
      );
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images?status=ready_for_processing`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await openDetailsByFilename(page, filename);
      const dialog = page.locator("dialog").filter({hasText: /Image details/i});
      const optimize = dialog.getByRole("button", {name: /Optimize image/i});
      if (await optimize.isVisible().catch(() => false)) {
        await optimize.focus();
        assert("Keyboard focus Optimize", await optimize.evaluate((el) => el === document.activeElement));
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);
        await page.keyboard.press("Escape");
        assert("Keyboard Escape closes confirm", !(await dialog.getByRole("dialog").isVisible().catch(() => false)));
      } else {
        set("Keyboard focus Optimize", "Not run", "already processed");
      }
      await page.close();
    }

    const signedOut = await fetch(`${baseUrl}/api/projects/${project.id}/processing/jobs`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({imageId: item.imageId}),
    });
    assert("Signed-out blocked", signedOut.status === 401);

    const [jobRow] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.imageId, item.imageId))
      .limit(1);
    if (jobRow?.outputStorageKey) outputKey = jobRow.outputStorageKey;
    assert("Job row exists after UI", Boolean(jobRow));
    if (jobRow?.status === "completed") {
      assert("Source key immutable vs output", jobRow.outputStorageKey !== sourceKey);
    }
  } finally {
    await browser.close();
    try {
      if (outputKey) await storage.deleteObject(outputKey);
    } catch {
      /* best effort */
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
    await sql.end({timeout: 5});
  }

  set("Processing browser", failures.length === 0 ? "Passed" : "Failed");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
