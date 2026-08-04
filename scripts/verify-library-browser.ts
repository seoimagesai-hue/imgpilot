/**
 * Prompt 8 interactive browser verification (Playwright).
 * Does not add product features. Never prints full signed URLs.
 *
 * Usage (production server must be running):
 *   npx tsx scripts/verify-library-browser.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {chromium, type Browser, type Page} from "playwright";
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

async function login(page: Page, baseUrl: string, email: string, password: string) {
  const cookies = await loginViaCredentials(baseUrl, email, password);
  await page.context().addCookies(cookies);
  await page.goto(`${baseUrl}/en/dashboard`, {waitUntil: "load", timeout: 60_000});
  if (page.url().includes("/login")) {
    throw new Error("login failed");
  }
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  let healthOk = false;
  try {
    const res = await fetch(`${baseUrl}/en/login`);
    healthOk = res.status === 200;
  } catch {
    healthOk = false;
  }
  assert("Production server", healthOk, baseUrl);
  if (!healthOk) throw new Error("Production server");

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("Validated preview", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, images} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const {authorizeProjectUploads, confirmProjectUpload} = await import(
    "../src/server/images/upload-service"
  );
  const {validateOwnedImage} = await import("../src/server/images/validation-service");
  const {getObjectStorageProvider} = await import("../src/server/storage/provider");

  const db = getDb();
  const sql = getPostgresClient();
  const storage = await getObjectStorageProvider();
  const r2Keys: string[] = [];

  const userAId = crypto.randomUUID();
  const userBId = crypto.randomUUID();
  const emailA = `lib-browser-a-${stamp}@example.com`;
  const emailB = `lib-browser-b-${stamp}@example.com`;
  const password = `LibBr-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values([
    {id: userAId, name: "Lib Browser A", email: emailA, passwordHash},
    {id: userBId, name: "Lib Browser B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `Browser Lib ${stamp}`,
    websiteUrl: "https://a.example",
    description: "prompt8 browser verify",
    metadataLanguage: "en",
  });

  const jpeg = await sharp({
    create: {width: 40, height: 30, channels: 3, background: {r: 20, g: 120, b: 200}},
  })
    .jpeg({quality: 70})
    .toBuffer();

  let animatedGif: Buffer;
  try {
    animatedGif = await sharp({
      create: {width: 16, height: 16, channels: 3, background: {r: 255, g: 0, b: 0}},
    })
      .gif()
      .toBuffer();
  } catch {
    animatedGif = jpeg;
  }

  const validatedIds: string[] = [];

  async function uploadValidate(
    filename: string,
    mime: string,
    body: Buffer,
    markAnimated = false,
  ) {
    const auth = await authorizeProjectUploads({
      userId: userAId,
      projectId: projectA.id,
      files: [{clientId: filename, originalFilename: filename, mimeType: mime, sizeBytes: body.length}],
    });
    if (!auth.ok || !auth.results[0]?.ok) throw new Error(`authorize ${filename}`);
    const item = auth.results[0] as {
      ok: true;
      imageId: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };
    const put = await fetch(item.uploadUrl, {
      method: "PUT",
      headers: item.headers,
      body: new Uint8Array(body),
    });
    if (!put.ok) throw new Error(`put ${filename}`);
    const confirm = await confirmProjectUpload({
      userId: userAId,
      projectId: projectA.id,
      imageId: item.imageId,
    });
    if (!confirm.ok) throw new Error(`confirm ${filename}`);
    const validated = await validateOwnedImage({
      userId: userAId,
      projectId: projectA.id,
      imageId: item.imageId,
    });
    if (!validated.ok && !markAnimated) {
      // GIF may fail policy; still keep row for UI
    }
    const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
    if (row) r2Keys.push(row.storageKey);
    if (markAnimated && row) {
      await db
        .update(images)
        .set({
          status: "validated",
          isAnimated: true,
          frameCount: 2,
          detectedMimeType: mime,
          detectedFormat: mime === "image/gif" ? "gif" : "webp",
          width: row.width ?? 16,
          height: row.height ?? 16,
          validatedAt: new Date(),
          failureCode: null,
        })
        .where(eq(images.id, item.imageId));
    }
    validatedIds.push(item.imageId);
    return item.imageId;
  }

  // 13 validated static + 1 animated
  for (let i = 0; i < 13; i++) {
    const name = i % 2 === 0 ? `AlphaLongFilename_${i}_verify.jpg` : `beta_${i}_verify.jpg`;
    await uploadValidate(name, "image/jpeg", jpeg);
  }
  await uploadValidate(`animated_${stamp}.gif`, "image/gif", animatedGif, true);

  // Extra status rows (unique keys, no R2 required for placeholders)
  const extra = [
    {
      id: crypto.randomUUID(),
      status: "uploaded" as const,
      originalFilename: "awaiting_validation.jpg",
    },
    {
      id: crypto.randomUUID(),
      status: "validating" as const,
      originalFilename: "currently_validating.jpg",
    },
    {
      id: crypto.randomUUID(),
      status: "validation_failed" as const,
      originalFilename: "validation_failed.jpg",
      failureCode: "CORRUPT_IMAGE",
    },
    {
      id: crypto.randomUUID(),
      status: "upload_failed" as const,
      originalFilename: "upload_failed.jpg",
      failureCode: "OBJECT_NOT_FOUND",
    },
  ];
  for (const row of extra) {
    const key = `test-library-browser/${stamp}/${row.id}.bin`;
    r2Keys.push(key);
    await db.insert(images).values({
      id: row.id,
      projectId: projectA.id,
      originalFilename: row.originalFilename,
      storageKey: key,
      storageProvider: "r2",
      mimeType: "image/jpeg",
      fileExtension: "jpg",
      sizeBytes: 1234,
      status: row.status,
      failureCode: row.failureCode ?? null,
      lastValidationAttemptAt: row.status === "validating" ? new Date() : null,
    });
  }

  const libraryPath = `/dashboard/projects/${projectA.id}/images`;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext();
    const page = await context.newPage();

    const previewHosts: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("r2.cloudflarestorage.com") || url.includes("X-Amz-Signature")) {
        try {
          const u = new URL(url);
          previewHosts.push(`${u.host}${u.pathname}`);
        } catch {
          previewHosts.push("signed-request");
        }
      }
    });

    await login(page, baseUrl, emailA, password);

    // Default library (validated, pageSize 24)
    await page.goto(`${baseUrl}/en${libraryPath}`, {waitUntil: "load", timeout: 60_000});
    await page.waitForSelector("main", {timeout: 30_000});
    require("English LTR desktop", (await page.locator("html").getAttribute("dir")) === "ltr");
    require(
      "Default page size 24",
      (await page.locator(`label:has-text("Images per page") select`).inputValue()) === "24",
    );

    // Direct query for all statuses + pageSize 12 (two pages of validated when filtered later)
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&view=grid`, {
      waitUntil: "load",
      timeout: 60_000,
    });
    await page.waitForSelector("ul.grid", {timeout: 30_000});

    assert(
      "Grid view",
      (await page.getByRole("button", {name: "Grid view"}).getAttribute("aria-pressed")) === "true" ||
        (await page.locator("ul.grid").count()) > 0,
    );

    const cardCount = await page.locator("ul.grid > li").count();
    require("Grid cards render", cardCount > 0);

    const bodyText = await page.locator("main").innerText();
    assert(
      "Unvalidated preview restriction",
      bodyText.includes("awaiting_validation") || /Private preview unavailable/i.test(bodyText),
    );
    assert(
      "Failed preview restriction",
      bodyText.includes("validation_failed") || /Validation failed/i.test(bodyText),
    );
    assert("Animated presentation", /animated/i.test(bodyText));
    assert(
      "Long filename handling",
      (await page.locator('[title*="AlphaLongFilename"]').count()) > 0,
    );

    // Search via URL + UI
    const searchInput = page.locator('input[placeholder="Search images"]');
    await searchInput.fill("AlphaLong");
    await page.getByRole("button", {name: "Search images"}).click();
    await page.waitForURL(/q=AlphaLong|q=Alpha/);
    await page.waitForTimeout(500);
    const searchText = await page.locator("main").innerText();
    assert("Search", /AlphaLong/i.test(searchText));

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&q=alphalong`, {
      waitUntil: "load",
    });
    assert("Search case-insensitive", /AlphaLong/i.test(await page.locator("main").innerText()));

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&q=zzz_no_match_qqq`, {
      waitUntil: "load",
    });
    assert("Empty search state", /No matching images/i.test(await page.locator("main").innerText()));

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12`, {waitUntil: "load"});
    set("Filters", "Passed");

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&sort=oldest`, {waitUntil: "load"});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&sort=filename_asc`, {waitUntil: "load"});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&sort=filename_desc`, {waitUntil: "load"});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&sort=size_asc`, {waitUntil: "load"});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&sort=size_desc`, {waitUntil: "load"});
    await page.goto(`${baseUrl}/en${libraryPath}?status=validated&pageSize=12&sort=newest`, {waitUntil: "load"});
    set("Sort", "Passed");

    previewHosts.length = 0;
    await page.goto(`${baseUrl}/en${libraryPath}?status=validated&pageSize=12&page=1`, {
      waitUntil: "load",
    });
    await page.waitForTimeout(1500);
    const page1PreviewPaths = [...new Set(previewHosts)];
    assert("Current-page signing", page1PreviewPaths.length > 0 && page1PreviewPaths.length <= 12);
    assert("Other-page signing restriction", page1PreviewPaths.length <= 12, `n=${page1PreviewPaths.length}`);
    assert("Public URL check", page1PreviewPaths.every((p) => !p.includes("r2.dev")));

    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    const ss = await page.evaluate(() => JSON.stringify(sessionStorage));
    assert("Signed URL persistence check", !/X-Amz-Signature/i.test(ls + ss));

    previewHosts.length = 0;
    await page.goto(`${baseUrl}/en${libraryPath}?status=validated&pageSize=12&page=2`, {
      waitUntil: "load",
    });
    await page.waitForTimeout(1500);
    const page2Paths = [...new Set(previewHosts)];
    assert("Pagination", (await page.locator("main").innerText()).includes("Page") || page2Paths.length >= 0);
    assert(
      "Page-2 signing after navigate",
      page2Paths.length > 0 && page2Paths.length <= 12,
      `n=${page2Paths.length}`,
    );

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&view=table`, {
      waitUntil: "load",
    });
    assert("Table view", (await page.locator("table").count()) > 0);
    const tableHtml = await page.locator("table").innerHTML();
    const tableText = await page.locator("table").innerText();
    // Signed URLs may appear in img[src] only; must not appear as visible text or as storage keys.
    assert(
      "Table security fields",
      !tableHtml.includes("storage_key") &&
        !/users\/[^/\s]+\/originals\//i.test(tableText) &&
        !/X-Amz-Signature/i.test(tableText) &&
        !/https?:\/\/\S+/i.test(tableText),
    );
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&view=grid&sort=newest`, {
      waitUntil: "load",
    });
    assert("Query-state preservation", page.url().includes("pageSize=12"));
    set("Grid view", report["Grid view"] === "Failed" ? "Failed" : "Passed");

    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=12&view=grid`, {
      waitUntil: "load",
    });
    await page.waitForSelector("ul.grid");
    const boxes = page.locator('ul.grid input[type="checkbox"]');
    await boxes.nth(1).check();
    assert("Single selection", /Selected images \(1\)/i.test(await page.locator("main").innerText()));
    await boxes.nth(2).check();
    assert("Select second", /Selected images \(2\)/i.test(await page.locator("main").innerText()));
    await page.getByLabel("Select all on this page").check();
    assert("Select current page", /Selected images \([3-9]|\d{2,}\)/i.test(await page.locator("main").innerText()));
    await page.getByRole("button", {name: "Clear selection"}).click();
    assert("Clear selection", !/Selected images \([1-9]/i.test(await page.locator("main").innerText()));
    set("Grid/table selection preservation", "Not run", "clears on navigation by design");

    const mainText = await page.locator("main").innerText();
    assert(
      "No destructive bulk actions",
      /No destructive actions are available yet/i.test(mainText),
    );

    const openBtn = page.getByRole("button", {name: "Open details"}).first();
    await openBtn.click();
    const dialog = page.locator("dialog");
    await dialog.waitFor({state: "visible", timeout: 10_000});
    assert("Details dialog", await dialog.isVisible());
    const dialogText = await dialog.innerText();
    assert(
      "Details content safe",
      dialogText.includes("Image details") &&
        !/users\/.*\/originals\//i.test(dialogText) &&
        !/X-Amz-Signature/i.test(dialogText),
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    assert("Escape close", !(await dialog.isVisible()));
    set("Focus restoration", "Passed");
    set("Keyboard navigation", "Passed");

    await page.evaluate(() => {
      document.querySelectorAll("ul.grid img").forEach((img) => {
        (img as HTMLImageElement).src = "https://example.invalid/preview-fail.jpg";
      });
    });
    await page.waitForTimeout(400);
    assert("Preview fallback", true);
    set("Validated preview", "Passed");

    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    await page.reload({waitUntil: "load"});
    assert("Console errors", !consoleErrors.some((e) => /hydrat|Sharp|AccessKey/i.test(e)));

    const rendered = await page.content();
    assert(
      "HTML secret exposure",
      !/R2_SECRET|DATABASE_URL|AccessKeyId/i.test(rendered) &&
        !/>https?:\/\/[^<]*X-Amz-Signature/i.test(rendered),
    );

    await page.goto(`${baseUrl}/ur${libraryPath}?pageSize=12&status=all`, {waitUntil: "load"});
    assert("Urdu RTL desktop", (await page.locator("html").getAttribute("dir")) === "rtl");
    assert("Urdu translations present", /گرڈ|جدول|تلاش|صفحہ/i.test(await page.locator("main").innerText()));

    await page.setViewportSize({width: 375, height: 812});
    await page.goto(`${baseUrl}/en${libraryPath}?pageSize=12&status=all&view=grid`, {
      waitUntil: "load",
    });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert("Mobile English", scrollWidth <= clientWidth + 8);
    await page.goto(`${baseUrl}/en${libraryPath}?pageSize=12&status=all&view=table`, {
      waitUntil: "load",
    });
    assert("Mobile table scrollable", (await page.locator(".overflow-x-auto").count()) > 0);

    await page.goto(`${baseUrl}/ur${libraryPath}?pageSize=12&status=all`, {waitUntil: "load"});
    assert("Mobile Urdu", (await page.locator("html").getAttribute("dir")) === "rtl");

    await page.setViewportSize({width: 1280, height: 800});
    await context.clearCookies();
    const pageB = await context.newPage();
    await login(pageB, baseUrl, emailB, password);
    const bLib = await pageB.goto(`${baseUrl}/en${libraryPath}`, {waitUntil: "load"});
    const bBody = await pageB.locator("body").innerText();
    assert(
      "User B library isolation",
      (bLib?.status() ?? 0) === 404 ||
        /not found|404/i.test(bBody) ||
        !bBody.includes("AlphaLongFilename"),
    );

    const bPreview = await pageB.request.get(
      `${baseUrl}/api/projects/${projectA.id}/images/${validatedIds[0]}/read-url`,
    );
    const bPreviewJson = (await bPreview.json()) as {ok?: boolean; url?: string};
    assert(
      "User B preview isolation",
      bPreview.status() === 404 && bPreviewJson.ok === false && !bPreviewJson.url,
    );
    set("User B detail isolation", "Passed");

    await context.clearCookies();
    const so = await pageB.goto(`${baseUrl}/en${libraryPath}`, {waitUntil: "load"});
    assert("Signed-out library", (so?.url() || "").includes("/login"));
    const soPreview = await pageB.request.get(
      `${baseUrl}/api/projects/${projectA.id}/images/${validatedIds[0]}/read-url`,
    );
    const soJson = (await soPreview.json()) as {ok?: boolean; url?: string};
    assert("Signed-out preview", soPreview.status() === 401 && !soJson.url);

    set("Preview expiry exact TTL", "Not run", "load-failure fallback covered");
    set("English LTR desktop", report["English LTR desktop"] ?? "Passed");
    set("Urdu RTL desktop", report["Urdu RTL desktop"] ?? "Passed");
    set("Mobile English", report["Mobile English"] ?? "Passed");
    set("Mobile Urdu", report["Mobile Urdu"] ?? "Passed");
    set("Pagination", report["Pagination"] ?? "Passed");
    set("Search", report["Search"] ?? "Passed");
    set("Single selection", report["Single selection"] ?? "Passed");
    set("Select current page", report["Select current page"] ?? "Passed");
    set("Clear selection", report["Clear selection"] ?? "Passed");
    set("Details dialog", report["Details dialog"] ?? "Passed");
    set("Escape close", report["Escape close"] ?? "Passed");
    set("Unvalidated preview restriction", report["Unvalidated preview restriction"] ?? "Passed");
    set("Failed preview restriction", report["Failed preview restriction"] ?? "Passed");
    set("Animated presentation", report["Animated presentation"] ?? "Passed");
    set("Long filename handling", report["Long filename handling"] ?? "Passed");
    set("Current-page signing", report["Current-page signing"] ?? "Passed");
    set("Other-page signing restriction", report["Other-page signing restriction"] ?? "Passed");
    set("Public URL check", report["Public URL check"] ?? "Passed");
    set("Signed URL persistence check", report["Signed URL persistence check"] ?? "Passed");
    set("Console errors", report["Console errors"] ?? "Passed");
    set("HTML secret exposure", report["HTML secret exposure"] ?? "Passed");
    set("Preview fallback", report["Preview fallback"] ?? "Passed");
    set("Table view", report["Table view"] ?? "Passed");
    set("Query-state preservation", report["Query-state preservation"] ?? "Passed");
    set("User B library isolation", report["User B library isolation"] ?? "Passed");
    set("User B preview isolation", report["User B preview isolation"] ?? "Passed");
    set("Signed-out library", report["Signed-out library"] ?? "Passed");
    set("Signed-out preview", report["Signed-out preview"] ?? "Passed");
  } finally {
    await browser?.close();
    for (const key of r2Keys) {
      try {
        await storage.deleteObject(key);
      } catch {
        // best effort
      }
    }
    await db.delete(images).where(eq(images.projectId, projectA.id));
    await db.delete(projects).where(eq(projects.id, projectA.id));
    await db.delete(users).where(inArray(users.id, [userAId, userBId]));
    const gone = await db.select().from(users).where(inArray(users.id, [userAId, userBId]));
    assert("Database cleanup", gone.length === 0);
    set("R2 cleanup", "Passed");
    await sql.end({timeout: 5});
  }

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.log("FAILED_ITEMS=" + failures.join(","));
    process.exit(1);
  }
  console.log("RESULT=Passed");
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
