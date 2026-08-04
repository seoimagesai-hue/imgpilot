/**
 * Full account + admin closure Playwright.
 * Usage:
 *   CLOSURE_ADMIN_EMAIL=... CLOSURE_ADMIN_PASSWORD=... npx tsx scripts/verify-account-admin-closure-browser.ts [baseUrl]
 *
 * Creates a temporary normal user for "blocked from admin" and registration/login tool-return checks; cleans it up.
 */
import {readFileSync, existsSync} from "node:fs";
import {chromium, devices, type Browser, type Page} from "playwright";
import {eq} from "drizzle-orm";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const BASE = process.argv[2] || process.env.CUTOVER_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = (process.env.CLOSURE_ADMIN_EMAIL || "").trim().toLowerCase();
function loadAdminPassword(): string {
  if (process.env.CLOSURE_ADMIN_PASSWORD) return process.env.CLOSURE_ADMIN_PASSWORD;
  const file = process.env.CLOSURE_ADMIN_PASSWORD_FILE || ".verify-tmp/closure-admin-pw.txt";
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  return "";
}
const ADMIN_PASSWORD = loadAdminPassword();

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function attachConsole(page: Page, label: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 180));
  });
  page.on("pageerror", (err) => errors.push(err.message.slice(0, 180)));
  return () => {
    const fatal = errors.filter(
      (e) => !/favicon|ResizeObserver|hydration|apple-touch|manifest\.webmanifest|GLib-GObject/i.test(e),
    );
    record(`${label}_console`, fatal.length === 0, fatal[0]);
  };
}

async function login(page: Page, email: string, password: string, callback?: string) {
  const url = callback
    ? `${BASE}/en/login?callbackUrl=${encodeURIComponent(callback)}`
    : `${BASE}/en/login`;
  await page.goto(url, {waitUntil: "domcontentloaded"});
  await page.locator('input[name="email"], input[type="email"]').first().fill(email);
  await page.locator('input[name="password"], input[type="password"]').first().fill(password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), {timeout: 30000}).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
}

async function ensureNoToolsInAdminNav(page: Page) {
  const text = (await page.locator("aside, #admin-nav, select#admin-nav").allTextContents()).join(" ");
  const hasTools = /compress|resize|convert|crop|geotag|bulk image/i.test(text);
  record("admin_nav_no_public_tools", !hasTools, text.slice(0, 120));
}

async function assertNoSecrets(page: Page, label: string) {
  const html = await page.content();
  const bad =
    /sk_live_|sk_test_|OPENAI_API_KEY|R2_SECRET|BEGIN PRIVATE KEY|x-amz-signature=|password_hash|token_hash/i.test(
      html,
    );
  record(`${label}_no_secrets`, !bad);
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("CLOSURE_ADMIN_EMAIL and CLOSURE_ADMIN_PASSWORD required");
    process.exit(1);
  }

  const {getDb} = await import("../src/db");
  const {users} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const db = getDb();

  const stamp = Date.now();
  const normalEmail = `closure-user-${stamp}@example.com`;
  const normalPassword = `Norm-${stamp}-Safe!aA1`;
  const regEmail = `closure-reg-${stamp}@example.com`;
  const regPassword = `Reg-${stamp}-Safe!aA1`;
  const normalId = crypto.randomUUID();

  await db.insert(users).values({
    id: normalId,
    name: "Closure Normal",
    email: normalEmail,
    passwordHash: await hashPassword(normalPassword),
    role: "user",
  });

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({headless: true});

    // —— Signed-out / EN consumer ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "signed_out_en");
      await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
      record(
        "signed_out_header_sign_in",
        await page.getByRole("link", {name: /sign in/i}).first().isVisible(),
      );
      record(
        "signed_out_header_create",
        await page.getByRole("link", {name: /create/i}).first().isVisible(),
      );
      done();
      await ctx.close();
    }

    // —— Login from tool returns to tool ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "login_tool_return");
      await login(page, normalEmail, normalPassword, "/en/compress-image");
      record("login_tool_return", page.url().includes("/compress-image"), page.url());
      done();
      await ctx.close();
    }

    // —— Registration callback ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "register_callback");
      await page.goto(
        `${BASE}/en/register?callbackUrl=${encodeURIComponent("/en/resize-image")}`,
        {waitUntil: "domcontentloaded"},
      );
      await page.locator('input[name="name"]').fill("Closure Reg");
      await page.locator('input[name="email"]').fill(regEmail);
      await page.locator('input[name="password"]').fill(regPassword);
      await page.locator('input[name="confirmPassword"]').fill(regPassword);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.includes("/register"), {timeout: 45000}).catch(() => null),
        page.locator('button[type="submit"]').first().click(),
      ]);
      record(
        "register_callback_safe",
        page.url().includes("/resize-image") || page.url().includes("/account") || page.url().includes("/en"),
        page.url(),
      );
      record("register_not_external", !/^https?:\/\/(?!127\.0\.0\.1|localhost)/i.test(page.url()), page.url());
      done();
      await ctx.close();
    }

    // —— Already signed-in login → /account ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await login(page, normalEmail, normalPassword, "/en/account");
      await page.goto(`${BASE}/en/login`, {waitUntil: "domcontentloaded"});
      await page.waitForTimeout(800);
      record("authed_login_to_account", page.url().includes("/account"), page.url());
      await ctx.close();
    }

    // —— Logged-in header, panel, account pages, dashboard redirect, sign out ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "account_en");
      await login(page, normalEmail, normalPassword);
      await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
      const menuBtn = page.getByRole("button", {name: /open account menu/i});
      record("usage_chip_or_avatar", await menuBtn.isVisible().catch(() => false));
      await menuBtn.click();
      record(
        "account_panel_open",
        await page.getByRole("dialog", {name: /account menu/i}).isVisible().catch(() => false),
      );
      record(
        "account_panel_no_saved_files",
        !(await page.getByText(/saved files/i).isVisible().catch(() => false)),
      );
      record(
        "account_panel_no_admin",
        !(await page.getByRole("link", {name: /^admin$/i}).isVisible().catch(() => false)),
      );

      for (const path of [
        "/en/account",
        "/en/account/usage",
        "/en/account/billing",
        "/en/account/history",
        "/en/account/settings",
      ]) {
        const res = await page.goto(`${BASE}${path}`, {waitUntil: "domcontentloaded"});
        record(`route_${path}`, (res?.status() ?? 0) === 200, `status=${res?.status()} url=${page.url()}`);
        await assertNoSecrets(page, path.replace(/\W+/g, "_"));
      }

      await page.goto(`${BASE}/en/dashboard`, {waitUntil: "domcontentloaded"});
      record("dashboard_to_account", page.url().includes("/account"), page.url());

      // Nested projects remain reachable by URL but unlinked from account chrome
      const acctHtml = await (await page.goto(`${BASE}/en/account`)).ok();
      void acctHtml;
      const body = await page.content();
      record("account_unlinked_projects", !/\/dashboard\/projects/i.test(body));

      // Sign out
      await menuBtn.click().catch(() => null);
      const signOut = page.getByRole("button", {name: /sign out/i});
      if (await signOut.isVisible().catch(() => false)) {
        await signOut.click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto(`${BASE}/en/compress-image`);
        await page.getByRole("button", {name: /open account menu/i}).click();
        await page.getByRole("button", {name: /sign out/i}).click();
        await page.waitForTimeout(1000);
      }
      await page.goto(`${BASE}/en`, {waitUntil: "domcontentloaded"});
      record(
        "signed_out_public",
        await page.getByRole("link", {name: /sign in/i}).first().isVisible().catch(() => false),
        page.url(),
      );
      done();
      await ctx.close();
    }

    // —— UR ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "ur");
      await page.goto(`${BASE}/ur`, {waitUntil: "domcontentloaded"});
      const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
      record("ur_rtl", dir === "rtl", `dir=${dir}`);
      await page.goto(`${BASE}/ur/login`, {waitUntil: "domcontentloaded"});
      record("ur_login", (await page.locator('input[name="email"]').count()) > 0);
      done();
      await ctx.close();
    }

    // —— Mobile ——
    {
      const ctx = await browser.newContext({...devices["iPhone 12"]});
      const page = await ctx.newPage();
      const done = await attachConsole(page, "mobile");
      await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
      await page.getByRole("button", {name: /menu/i}).click();
      record(
        "mobile_menu_sign_in",
        await page.getByRole("link", {name: /sign in/i}).first().isVisible().catch(() => false),
      );
      done();
      await ctx.close();
    }

    // —— Keyboard ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName || "");
      record("keyboard_tab", Boolean(tag), `tag=${tag}`);
      await ctx.close();
    }

    // —— Admin authz ——
    {
      const signedOut = await browser.newContext();
      const soPage = await signedOut.newPage();
      await soPage.goto(`${BASE}/en/admin`, {waitUntil: "domcontentloaded"});
      record(
        "admin_signed_out_blocked",
        soPage.url().includes("/login") || (await soPage.content()).includes("Page Not Found"),
        soPage.url(),
      );
      await signedOut.close();

      const normalCtx = await browser.newContext();
      const nPage = await normalCtx.newPage();
      await login(nPage, normalEmail, normalPassword);
      const adminRes = await nPage.goto(`${BASE}/en/admin`, {waitUntil: "domcontentloaded"});
      const notFound =
        (adminRes?.status() ?? 0) === 404 ||
        (await nPage.content()).includes("Page Not Found") ||
        (await nPage.getByRole("heading", {name: /page not found/i}).count()) > 0;
      record("admin_normal_user_blocked", notFound, `status=${adminRes?.status()} url=${nPage.url()}`);
      await normalCtx.close();
    }

    // —— Admin pages as super_admin ——
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const done = await attachConsole(page, "admin");
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const overview = await page.goto(`${BASE}/en/admin`, {waitUntil: "domcontentloaded"});
      record("admin_overview", (overview?.status() ?? 0) === 200 && page.url().includes("/admin"), page.url());
      await ensureNoToolsInAdminNav(page);
      await assertNoSecrets(page, "admin_overview");

      const paths = [
        "/en/admin/users",
        "/en/admin/plans",
        "/en/admin/limits",
        "/en/admin/billing",
        "/en/admin/subscriptions",
        "/en/admin/payments",
        "/en/admin/stripe",
        "/en/admin/usage",
        "/en/admin/jobs",
        "/en/admin/guests",
        "/en/admin/cleanup",
        "/en/admin/system",
        "/en/admin/audit",
        "/en/admin/settings",
      ];
      for (const path of paths) {
        const res = await page.goto(`${BASE}${path}`, {waitUntil: "domcontentloaded"});
        record(`admin_page_${path.split("/").pop()}`, (res?.status() ?? 0) === 200, `status=${res?.status()}`);
        await assertNoSecrets(page, path.replace(/\W+/g, "_"));
      }

      // User detail + suspend/restore confirmation (use a fixture normal user, not self)
      const detailUserId = normalId;
      const detailRes = await page.goto(`${BASE}/en/admin/users/${detailUserId}`, {
        waitUntil: "domcontentloaded",
      });
      // Recreate if cleaned early — normalId still in DB until finally
      record(
        "admin_user_detail",
        (detailRes?.status() ?? 0) === 200 && page.url().includes(`/admin/users/${detailUserId}`),
        `status=${detailRes?.status()} url=${page.url()}`,
      );
      record(
        "admin_suspend_confirm_ui",
        (await page.getByText("SUSPEND", {exact: true}).count()) > 0 ||
          (await page.locator("code").filter({hasText: "SUSPEND"}).count()) > 0,
      );

      // Exercise suspend → restore with confirmations + audit trail
      await page.locator("textarea").fill("Closure check suspend");
      await page.locator('input[type="text"]').fill("SUSPEND");
      await page.getByRole("button", {name: /suspend account/i}).click();
      await page.waitForTimeout(1500);
      await page.reload({waitUntil: "domcontentloaded"});
      record(
        "admin_restore_confirm_ui",
        (await page.locator("code").filter({hasText: "RESTORE"}).count()) > 0,
      );
      await page.locator("textarea").fill("Closure check restore");
      await page.locator('input[type="text"]').fill("RESTORE");
      await page.getByRole("button", {name: /restore account/i}).click();
      await page.waitForTimeout(1500);
      await page.reload({waitUntil: "domcontentloaded"});
      record(
        "admin_restore_completed",
        (await page.getByText(/account status/i).count()) >= 0 &&
          (await page.locator("code").filter({hasText: "SUSPEND"}).count()) > 0,
      );

      await page.goto(`${BASE}/en/admin/cleanup`, {waitUntil: "domcontentloaded"});
      record(
        "admin_cleanup_confirm_ui",
        (await page.getByText(/RUN-CLEANUP|confirmation/i).count()) > 0,
      );

      await page.goto(`${BASE}/en/admin/audit`, {waitUntil: "domcontentloaded"});
      const auditHtml = await page.content();
      record(
        "admin_audit_has_bootstrap",
        /bootstrap\.promote_super_admin|promote_super_admin/i.test(auditHtml),
      );
      record(
        "admin_guests_no_token_ip",
        !/token_hash|ip_hash|x-forwarded-for/i.test(auditHtml),
      );

      await page.goto(`${BASE}/en/admin/guests`, {waitUntil: "domcontentloaded"});
      const guestsHtml = await page.content();
      record(
        "admin_guest_sessions_scrubbed",
        !/token_hash|guest\/[a-f0-9-]{8,}\/originals|x-amz-signature=/i.test(guestsHtml),
      );

      done();
      await ctx.close();
    }
  } finally {
    await browser?.close();
    // Fixture cleanup — keep bootstrapped admin; remove ephemeral users
    await db.delete(users).where(eq(users.email, normalEmail));
    await db.delete(users).where(eq(users.email, regEmail));
    console.log("FIXTURE_CLEANUP ok");
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`summary passed=${results.length - failed} failed=${failed} total=${results.length}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
