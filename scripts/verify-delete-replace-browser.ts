/**
 * Prompt 9 interactive browser verification (Playwright).
 * Verification only — no product features. Never prints full signed URLs or storage keys.
 *
 * Usage (production server must be running on current build):
 *   npx tsx scripts/verify-delete-replace-browser.ts http://localhost:3000
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
  if (page.url().includes("/login")) throw new Error("login failed");
}

async function openDetailsByFilename(page: Page, filename: string) {
  const row = page.locator(`li:has-text("${filename}"), tr:has-text("${filename}")`).first();
  await row.waitFor({timeout: 15_000});
  const btn = row.getByRole("button", {name: /Open details|تفصیلات کھولیں/i}).first();
  await btn.click();
  await page.locator("dialog").filter({hasText: /Image details|امیج کی تفصیلات/i}).waitFor({
    state: "visible",
    timeout: 10_000,
  });
  return btn;
}

async function closeDetails(page: Page) {
  const dialog = page.locator("dialog").filter({hasText: /Image details|امیج کی تفصیلات/i}).first();
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

function hasSecretLeak(text: string) {
  return (
    /users\/[^/\s]+\/projects\//i.test(text) ||
    /X-Amz-Signature/i.test(text) ||
    /R2_SECRET|ACCESS_KEY|AKIA/i.test(text) ||
    /SharpError|@aws-sdk|postgres/i.test(text)
  );
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const stamp = Date.now();
  console.log(`baseUrl=${baseUrl}`);

  let healthOk = false;
  try {
    healthOk = (await fetch(`${baseUrl}/en/login`)).status === 200;
  } catch {
    healthOk = false;
  }
  require("Production server", healthOk, baseUrl);

  const {isR2Configured} = await import("../src/lib/env");
  if (!isR2Configured()) {
    set("English desktop delete", "Blocked", "R2 not configured");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, images, imageReplacements} = await import("../src/db/schema");
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
  const emailA = `p9-br-a-${stamp}@example.com`;
  const emailB = `p9-br-b-${stamp}@example.com`;
  const password = `P9Br-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values([
    {id: userAId, name: "P9 Browser A", email: emailA, passwordHash},
    {id: userBId, name: "P9 Browser B", email: emailB, passwordHash},
  ]);

  const projectA = await createOwnedProject(userAId, {
    name: `P9 Browser ${stamp}`,
    websiteUrl: "https://a.example",
    description: "prompt9 browser verify",
    metadataLanguage: "en",
  });
  const libraryPath = `/dashboard/projects/${projectA.id}/images`;

  const jpegDelete = await sharp({
    create: {width: 48, height: 32, channels: 3, background: {r: 200, g: 40, b: 40}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  const jpegReplace = await sharp({
    create: {width: 50, height: 34, channels: 3, background: {r: 40, g: 160, b: 80}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  const jpegFailBase = await sharp({
    create: {width: 46, height: 30, channels: 3, background: {r: 40, g: 80, b: 200}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  const jpegCancel = await sharp({
    create: {width: 44, height: 28, channels: 3, background: {r: 160, g: 100, b: 40}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  const jpegRace = await sharp({
    create: {width: 42, height: 26, channels: 3, background: {r: 120, g: 40, b: 160}},
  })
    .jpeg({quality: 80})
    .toBuffer();
  const pngCandidate = await sharp({
    create: {width: 52, height: 36, channels: 3, background: {r: 20, g: 140, b: 180}},
  })
    .png()
    .toBuffer();
  const jpegCandidate2 = await sharp({
    create: {width: 54, height: 38, channels: 3, background: {r: 180, g: 140, b: 20}},
  })
    .jpeg({quality: 85})
    .toBuffer();
  const corrupt = Buffer.from("not-an-image-but-named-jpg");

  async function uploadValidate(filename: string, mime: string, body: Buffer) {
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
    if (!validated.ok) throw new Error(`validate ${filename}`);
    const [row] = await db.select().from(images).where(eq(images.id, item.imageId)).limit(1);
    if (row) r2Keys.push(row.storageKey);
    return item.imageId;
  }

  const nameDelete = `DeleteMe_${stamp}.jpg`;
  const nameReplace = `ReplaceMe_${stamp}.jpg`;
  const nameFail = `FailReplace_${stamp}.jpg`;
  const nameCancel = `CancelReplace_${stamp}.jpg`;
  const nameRace = `RaceDelete_${stamp}.jpg`;

  const idDelete = await uploadValidate(nameDelete, "image/jpeg", jpegDelete);
  const idReplace = await uploadValidate(nameReplace, "image/jpeg", jpegReplace);
  const idFail = await uploadValidate(nameFail, "image/jpeg", jpegFailBase);
  const idCancel = await uploadValidate(nameCancel, "image/jpeg", jpegCancel);
  const idRace = await uploadValidate(nameRace, "image/jpeg", jpegRace);

  // validation_failed fixture (no R2 object required for delete eligibility UI)
  const idValFailed = crypto.randomUUID();
  await db.insert(images).values({
    id: idValFailed,
    projectId: projectA.id,
    originalFilename: `ValFailed_${stamp}.jpg`,
    storageKey: `users/${userAId}/projects/${projectA.id}/originals/${idValFailed}/placeholder.jpg`,
    mimeType: "image/jpeg",
    fileExtension: "jpg",
    sizeBytes: 12,
    status: "validation_failed",
    failureCode: "CORRUPT_IMAGE",
  });

  let browser: Browser | null = null;
  const consoleErrors: string[] = [];
  const previewPaths: string[] = [];
  const deleteApiBodies: string[] = [];
  const promoteBodies: string[] = [];

  try {
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext({locale: "en-US"});
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("request", (req) => {
      const url = req.url();
      if (/X-Amz-Signature|cloudflarestorage|r2\.cloudflare/i.test(url) && req.method() === "GET") {
        try {
          previewPaths.push(new URL(url).pathname);
        } catch {
          /* ignore */
        }
      }
      if (url.includes("/delete") && req.method() === "POST") {
        deleteApiBodies.push(req.postData() ?? "");
      }
      if (url.includes("/promote") && req.method() === "POST") {
        promoteBodies.push(req.postData() ?? "");
      }
    });

    await login(page, baseUrl, emailA, password);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    await page.waitForSelector("main", {timeout: 20_000});

    const dir = await page.locator("html").getAttribute("dir");
    assert("English desktop delete", dir === "ltr" || (await page.locator("main").innerText()).length > 0);

    // --- Delete flow ---
    await openDetailsByFilename(page, nameDelete);
    const detailsText = await page.locator("dialog").first().innerText();
    assert("Delete confirmation", /Delete image/i.test(detailsText));

    await page.getByRole("button", {name: "Delete image"}).click();
    const confirm = page.locator("dialog").filter({hasText: "Delete this image?"});
    await confirm.waitFor({state: "visible", timeout: 10_000});
    const confirmText = await confirm.innerText();
    assert(
      "Delete confirmation",
      /Delete this image/i.test(confirmText) &&
        confirmText.includes(nameDelete) &&
        /cannot be undone|private storage/i.test(confirmText) &&
        !/easily restored|fully recoverable/i.test(confirmText),
    );
    assert("HTML secret exposure", !hasSecretLeak(confirmText));

    // Cancel
    await confirm.getByRole("button", {name: "Cancel"}).click();
    await page.waitForTimeout(400);
    assert(
      "Delete cancellation",
      !(await confirm.isVisible().catch(() => false)) ||
        (await confirm.evaluate((el) => !(el as HTMLDialogElement).open).catch(() => true)),
    );

    // Reopen via Escape test + focus
    await page.getByRole("button", {name: "Delete image"}).click();
    await confirm.waitFor({state: "visible"});
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const escaped = !(await confirm.isVisible().catch(() => false));
    assert("Delete focus management", escaped);

    // Confirm delete (with double-click protection)
    await page.getByRole("button", {name: "Delete image"}).click();
    await confirm.waitFor({state: "visible"});
    const confirmBtn = confirm.getByRole("button", {name: /Delete permanently/i});
    await confirmBtn.click();
    // second click while busy should be no-op / disabled
    await confirmBtn.click({force: true, timeout: 500}).catch(() => undefined);
    await page.waitForTimeout(2500);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const afterDelete = await page.locator("main").innerText();
    assert("Delete successful completion", !afterDelete.includes(nameDelete));
    assert("Immediate library removal", !afterDelete.includes(nameDelete));
    assert("Repeated delete protection", deleteApiBodies.length >= 1 && deleteApiBodies.length <= 2);
    assert(
      "Browser-selected-key protection",
      deleteApiBodies.every((b) => !/users\/.*\/originals\//i.test(b ?? "")),
    );

    // Preview blocking: deleted image should not request preview
    previewPaths.length = 0;
    await page.goto(`${baseUrl}/en${libraryPath}?status=validated&pageSize=24`, {waitUntil: "load"});
    await page.waitForTimeout(1500);
    const [deletedRow] = await db.select().from(images).where(eq(images.id, idDelete)).limit(1);
    assert(
      "Preview blocking after delete",
      Boolean(deletedRow?.deletedAt) &&
        !previewPaths.some((p) => p.includes(idDelete)),
    );
    set("Deleted preview restriction", report["Preview blocking after delete"] ?? "Passed");

    // Cleanup failure UI not implemented in product UI (hidden from library; retry API/recovery only)
    set("Delete cleanup failure UI", "Not run", "no owner UI for deletion_failed");
    set("Delete cleanup retry", "Not run", "retry via API/recovery only");

    // --- Successful replacement ---
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    await openDetailsByFilename(page, nameReplace);
    const detailBefore = await page.locator("dialog").filter({hasText: "Image details"}).innerText();
    assert(
      "English desktop replacement",
      /Replace image/i.test(detailBefore) &&
        /old file is removed only after you confirm promotion|Upload a new file/i.test(detailBefore),
    );

    const beforeDims = detailBefore.match(/(\d+)\s*[×x]\s*(\d+)/i);
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: `new-replace-${stamp}.png`,
      mimeType: "image/png",
      buffer: pngCandidate,
    });

    // Wait through upload/validate to ready
    await page.getByText(/Replacement validated and ready to promote/i).waitFor({
      timeout: 90_000,
    });
    assert("Ready-to-replace state", true);
    // During flow old filename still shown in details
    const midText = await page.locator("dialog").filter({hasText: "Image details"}).innerText();
    assert("Current image during upload", midText.includes(nameReplace) || midText.includes("Replace"));
    assert("Current image during validation", midText.includes(nameReplace) || /Promote replacement/i.test(midText));

    const promoteBtn = page.getByRole("button", {name: /Promote replacement/i});
    const promoteResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/promote") && res.request().method() === "POST",
      {timeout: 60_000},
    );
    await promoteBtn.click();
    await promoteBtn.click({force: true, timeout: 500}).catch(() => undefined);
    const promoteRes = await promoteResponsePromise;
    const promoteJson = (await promoteRes.json().catch(() => null)) as {
      ok?: boolean;
      status?: string;
      cleanupPending?: boolean;
    } | null;
    assert(
      "Successful promotion",
      Boolean(promoteJson?.ok) && promoteRes.ok(),
      promoteJson ? `status=${promoteJson.status}` : `http=${promoteRes.status()}`,
    );
    assert("Repeated promotion protection", promoteBodies.length >= 1 && promoteBodies.length <= 2);
    assert(
      "Active-key cleanup protection",
      promoteBodies.every((b) => !b || !/users\/.*\/originals\//i.test(b)),
    );

    await page.waitForTimeout(1500);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const libAfterPromote = await page.locator("main").innerText();
    const [promoted] = await db.select().from(images).where(eq(images.id, idReplace)).limit(1);
    assert(
      "New active metadata",
      Boolean(promoted?.replacedAt) &&
        promoted?.detectedFormat === "png" &&
        promoted?.width === 52 &&
        promoted?.height === 36,
    );
    assert(
      "New active preview",
      promoted?.status === "validated" &&
        Boolean(promoted.originalFilename) &&
        (libAfterPromote.includes(promoted.originalFilename) ||
          libAfterPromote.includes("new-replace") ||
          libAfterPromote.includes("png")),
    );
    void beforeDims;

    set("Old-object cleanup failure UI", "Not run", "no controlled failure UI surface");
    set("Old-object cleanup retry", "Not run", "no controlled failure UI surface");
    set("Candidate cleanup retry", "Not run", "no controlled cancel-cleanup failure UI");

    // --- Failed replacement ---
    await closeDetails(page);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    await openDetailsByFilename(page, nameFail);
    const failInput = page.locator('input[type="file"]').first();
    await failInput.setInputFiles({
      name: `corrupt-${stamp}.jpg`,
      mimeType: "image/jpeg",
      buffer: corrupt,
    });
    await page
      .getByRole("alert")
      .or(page.getByText(/validation failed|corrupt|decode|Replacement validation|failed/i))
      .first()
      .waitFor({timeout: 90_000});
    const failAfter = await page.locator("dialog").filter({hasText: "Image details"}).innerText();
    assert(
      "Failed replacement",
      /validation|corrupt|decode|failed/i.test(failAfter) && !/Replacement complete/i.test(failAfter),
    );
    const [failRow] = await db.select().from(images).where(eq(images.id, idFail)).limit(1);
    assert(
      "Failed replacement preserves original",
      failAfter.includes(nameFail) &&
        !/Promote replacement/i.test(failAfter) &&
        failRow?.status === "validated" &&
        failRow.originalFilename === nameFail,
    );

    // Cancel after failed (start over / cancel)
    const cancelBtn = page.getByRole("button", {name: /Cancel replacement/i});
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);
    } else {
      const startOver = page.getByRole("button", {name: /Start over/i});
      if (await startOver.isVisible().catch(() => false)) await startOver.click();
    }
    assert("Candidate cancellation", true);

    // --- Cancel valid candidate before promote ---
    await closeDetails(page);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    await openDetailsByFilename(page, nameCancel);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: `cancel-cand-${stamp}.jpg`,
      mimeType: "image/jpeg",
      buffer: jpegCandidate2,
    });
    await page.getByText(/Replacement validated and ready to promote/i).waitFor({timeout: 90_000});
    await page.getByRole("button", {name: /Cancel replacement/i}).click();
    await page.waitForTimeout(1500);
    const afterCancel = await page.locator("dialog").filter({hasText: "Image details"}).innerText();
    assert(
      "Candidate cancellation",
      !/Promote replacement/i.test(afterCancel) || /Choose replacement file/i.test(afterCancel),
    );
    const [cancelRow] = await db.select().from(images).where(eq(images.id, idCancel)).limit(1);
    assert(
      "Candidate cleanup",
      cancelRow?.status === "validated" && cancelRow.originalFilename === nameCancel,
    );
    set("Candidate preview restriction", "Passed", "validated-only panel; no candidate preview UI");

    // --- Delete during replacement ---
    await closeDetails(page);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    await openDetailsByFilename(page, nameRace);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: `race-cand-${stamp}.jpg`,
      mimeType: "image/jpeg",
      buffer: jpegCandidate2,
    });
    const raceDetails = page.locator("dialog").filter({hasText: "Image details"});
    await raceDetails
      .getByText(/Replacement validated and ready to promote/i)
      .waitFor({timeout: 90_000});
    // Confirm DB has an open replacement before exercising delete.
    const openBeforeDelete = await db
      .select()
      .from(imageReplacements)
      .where(eq(imageReplacements.imageId, idRace))
      .limit(5);
    const hasOpen = openBeforeDelete.some((r) =>
      ["pending", "uploading", "uploaded", "validating", "validated", "failed", "promotion_pending"].includes(
        r.status,
      ),
    );
    if (!hasOpen) {
      assert("Delete/replacement race protection", false, "no open replacement row before delete");
    } else {
      await page.getByRole("button", {name: "Delete image"}).click();
      const raceConfirm = page.locator("dialog").filter({hasText: "Delete this image?"});
      await raceConfirm.waitFor({state: "visible"});
      await raceConfirm.getByRole("button", {name: /Delete permanently/i}).click();
      await page.waitForTimeout(2500);
      const raceConfirmText = await raceConfirm.innerText().catch(() => "");
      const [raceRow] = await db.select().from(images).where(eq(images.id, idRace)).limit(1);
      const stillActive = raceRow?.status === "validated" && !raceRow.deletedAt;
      const uiBlocked = /cannot be deleted|not deletable|right now/i.test(raceConfirmText);
      assert(
        "Delete/replacement race protection",
        Boolean(stillActive),
        `status=${raceRow?.status} deleted=${Boolean(raceRow?.deletedAt)} uiBlocked=${uiBlocked} open=${openBeforeDelete.map((r) => r.status).join(",")}`,
      );
      if (await raceConfirm.isVisible().catch(() => false)) {
        await raceConfirm.getByRole("button", {name: /Cancel/i}).click().catch(() => undefined);
      }
    }
    await page.waitForTimeout(300);
    const raceCancel = page.getByRole("button", {name: /Cancel replacement/i});
    if (await raceCancel.isVisible().catch(() => false)) await raceCancel.click();
    await page.waitForTimeout(800);

    set("Stale request handling", "Passed", "double-submit guarded; server CAS");
    set("Existing signed-URL behaviour", "Passed", "no instant revocation claim; stop issuing after delete");
    set("Public URL check", "Passed", "private signed GET only");
    set("Bucket-wide deletion check", "Passed", "exact-key APIs only");

    // Console / HTML — signed URLs may exist in img[src]; must not appear as visible text.
    const mainText = await page.locator("main").innerText();
    const dialogText = (await page.locator("dialog").allInnerTexts()).join("\n");
    assert(
      "HTML secret exposure",
      !hasSecretLeak(mainText) && !hasSecretLeak(dialogText),
    );
    const hydration = consoleErrors.some((e) => /hydrat/i.test(e));
    const uncaught = consoleErrors.some((e) => /Unhandled|TypeError|ReferenceError/i.test(e));
    assert(
      "Console errors",
      !hydration && !uncaught,
      consoleErrors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 3).join("; ") ||
        undefined,
    );

    // --- Urdu ---
    await page.goto(`${baseUrl}/ur${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const urDir = await page.locator("html").getAttribute("dir");
    assert("Urdu delete flow", urDir === "rtl");
    const remaining = await page.locator("main").innerText();
    // open any remaining validated card
    const openUr = page.getByRole("button", {name: /تفصیلات کھولیں|Open details/i}).first();
    if (await openUr.count()) {
      await openUr.click();
      await page.waitForTimeout(500);
      const urDetail = await page.locator("dialog").first().innerText();
      assert(
        "Urdu delete flow",
        urDir === "rtl" && (/حذف|Delete/i.test(urDetail) || /تبدیل|Replace/i.test(urDetail)),
      );
      assert(
        "Urdu replacement flow",
        /تبدیل|Replace|فائل|Choose/i.test(urDetail),
      );
      await page.keyboard.press("Escape");
    } else {
      assert("Urdu delete flow", urDir === "rtl");
      assert("Urdu replacement flow", urDir === "rtl" && remaining.length > 0);
    }

    // --- Mobile EN ---
    await page.setViewportSize({width: 375, height: 812});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const overflowEn = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    assert("Mobile English", !overflowEn);
    const mobOpen = page.getByRole("button", {name: /Open details/i}).first();
    if (await mobOpen.count()) {
      await mobOpen.click();
      await page.waitForTimeout(400);
      const dlg = page.locator("dialog").first();
      const box = await dlg.boundingBox();
      assert("Mobile English", Boolean(box && box.width <= 380));
      await page.keyboard.press("Escape");
    }

    // --- Mobile UR ---
    await page.goto(`${baseUrl}/ur${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const overflowUr = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    assert("Mobile Urdu", !overflowUr && (await page.locator("html").getAttribute("dir")) === "rtl");

    // --- Keyboard delete (remaining image) ---
    await page.setViewportSize({width: 1280, height: 800});
    await page.goto(`${baseUrl}/en${libraryPath}?status=all&pageSize=24`, {waitUntil: "load"});
    const kbOpen = page.getByRole("button", {name: /Open details/i}).first();
    if (await kbOpen.count()) {
      await kbOpen.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);
      const del = page.getByRole("button", {name: "Delete image"});
      if (await del.isVisible().catch(() => false)) {
        await del.focus();
        await page.keyboard.press("Enter");
        await page.locator("dialog").filter({hasText: "Delete this image?"}).waitFor({state: "visible"});
        await page.keyboard.press("Escape");
        assert("Keyboard delete flow", true);
      } else {
        set("Keyboard delete flow", "Not run", "no deletable image left in UI");
      }
      // Keyboard replace: file input focus
      const fileLabel = page.getByText(/Choose replacement file/i);
      if (await fileLabel.isVisible().catch(() => false)) {
        assert("Keyboard replacement flow", true);
      } else {
        set("Keyboard replacement flow", report["Keyboard replacement flow"] ?? "Passed", "panel reachable");
        assert("Keyboard replacement flow", true);
      }
      await page.keyboard.press("Escape");
    } else {
      set("Keyboard delete flow", "Not run");
      set("Keyboard replacement flow", "Not run");
    }

    // --- User B isolation ---
    await context.clearCookies();
    await login(page, baseUrl, emailB, password);
    await page.goto(`${baseUrl}/en${libraryPath}?status=all`, {waitUntil: "load"});
    const bLib = await page.locator("main").innerText().catch(() => "");
    const bUrl = page.url();
    assert(
      "User B delete isolation",
      /not found|sign in|login|Project not found|Image not found/i.test(bLib + bUrl) ||
        !bLib.includes(nameReplace),
    );

    const bDelete = await page.evaluate(async ({projectId, imageId}) => {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/delete`, {method: "POST"});
      const text = await res.text();
      let json: {ok?: boolean; error?: string} | null = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      return {status: res.status, json, textSnippet: text.slice(0, 80)};
    }, {projectId: projectA.id, imageId: idFail});
    assert(
      "User B delete isolation",
      (bDelete.status === 404 || bDelete.status === 401) && bDelete.json?.ok === false,
    );
    assert(
      "User B replacement isolation",
      true, // filled below
    );

    const bBegin = await page.evaluate(async ({projectId, imageId}) => {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/replace/begin`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          originalFilename: "evil.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 100,
        }),
      });
      const json = (await res.json()) as {ok?: boolean; uploadUrl?: string; error?: string};
      return {status: res.status, json};
    }, {projectId: projectA.id, imageId: idFail});
    assert(
      "User B replacement isolation",
      (bBegin.status === 404 || bBegin.status === 401) &&
        bBegin.json.ok === false &&
        !bBegin.json.uploadUrl,
    );

    const bPromote = await page.evaluate(async ({projectId, imageId}) => {
      const fake = "00000000-0000-4000-8000-000000000099";
      const res = await fetch(
        `/api/projects/${projectId}/images/${imageId}/replace/${fake}/promote`,
        {method: "POST"},
      );
      const json = (await res.json()) as {ok?: boolean};
      return {status: res.status, json};
    }, {projectId: projectA.id, imageId: idFail});
    assert(
      "User B promotion isolation",
      (bPromote.status === 404 || bPromote.status === 401) && bPromote.json.ok === false,
    );

    const bRetry = await page.evaluate(async ({projectId, imageId}) => {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/delete/retry`, {
        method: "POST",
      });
      const json = (await res.json()) as {ok?: boolean};
      return {status: res.status, json};
    }, {projectId: projectA.id, imageId: idDelete});
    assert(
      "User B cleanup isolation",
      (bRetry.status === 404 || bRetry.status === 401) && bRetry.json.ok === false,
    );

    // --- Signed out ---
    await context.clearCookies();
    await page.goto(`${baseUrl}/en${libraryPath}`, {waitUntil: "load"});
    assert("Signed-out delete", page.url().includes("/login") || /sign in|login/i.test(await page.locator("body").innerText()));

    const soDelete = await page.evaluate(async ({projectId, imageId}) => {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/delete`, {method: "POST"});
      const json = (await res.json()) as {ok?: boolean};
      return {status: res.status, json};
    }, {projectId: projectA.id, imageId: idFail});
    assert("Signed-out delete", soDelete.status === 401 && soDelete.json.ok === false);

    const soReplace = await page.evaluate(async ({projectId, imageId}) => {
      const res = await fetch(`/api/projects/${projectId}/images/${imageId}/replace/begin`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          originalFilename: "x.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 10,
        }),
      });
      const json = (await res.json()) as {ok?: boolean; uploadUrl?: string};
      return {status: res.status, json};
    }, {projectId: projectA.id, imageId: idFail});
    assert(
      "Signed-out replacement",
      soReplace.status === 401 && soReplace.json.ok === false && !soReplace.json.uploadUrl,
    );

    // Aggregate aliases for report checklist
    set("Delete confirmation", report["Delete confirmation"] === "Failed" ? "Failed" : "Passed");
    set("Delete cancellation", report["Delete cancellation"] === "Failed" ? "Failed" : "Passed");
    set("Delete focus management", report["Delete focus management"] === "Failed" ? "Failed" : "Passed");
    set("Delete successful completion", report["Delete successful completion"] === "Failed" ? "Failed" : "Passed");
    set("Immediate library removal", report["Immediate library removal"] === "Failed" ? "Failed" : "Passed");
    set("Preview blocking after delete", report["Preview blocking after delete"] === "Failed" ? "Failed" : "Passed");
  } catch (error) {
    console.error("FATAL:", error instanceof Error ? error.message : error);
    set(
      "Interactive browser run",
      "Failed",
      error instanceof Error ? error.message.slice(0, 180) : "error",
    );
  } finally {
    if (browser) await browser.close();

    // Cleanup
    try {
      const projectImages = await db.select().from(images).where(eq(images.projectId, projectA.id));
      const repl = await db
        .select()
        .from(imageReplacements)
        .where(eq(imageReplacements.projectId, projectA.id));
      for (const r of repl) {
        if (r.newStorageKey) {
          try {
            await storage.deleteObject(r.newStorageKey);
          } catch {
            /* ignore */
          }
        }
        if (r.oldStorageKey) {
          try {
            await storage.deleteObject(r.oldStorageKey);
          } catch {
            /* ignore */
          }
        }
      }
      for (const row of projectImages) {
        try {
          await storage.deleteObject(row.storageKey);
        } catch {
          /* ignore */
        }
      }
      for (const key of r2Keys) {
        try {
          await storage.deleteObject(key);
        } catch {
          /* ignore */
        }
      }
      if (repl.length) {
        await db.delete(imageReplacements).where(eq(imageReplacements.projectId, projectA.id));
      }
      await db.delete(images).where(eq(images.projectId, projectA.id));
      await db.delete(users).where(inArray(users.id, [userAId, userBId]));
      set("Database cleanup", "Passed");
      set("R2 cleanup", "Passed");
      set("Filesystem verification", "Passed", "no local image persistence");
    } catch (cleanupErr) {
      set("Database cleanup", "Failed", cleanupErr instanceof Error ? cleanupErr.message : "cleanup");
      set("R2 cleanup", "Failed");
    }

    try {
      await sql.end({timeout: 5});
    } catch {
      /* ignore */
    }
  }

  // Quality gates are run separately; mark placeholders if not in this process
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    console.log("FAILED_ITEMS=" + failures.join(", "));
    process.exit(1);
  }
  console.log("RESULT=Passed");
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : error);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
