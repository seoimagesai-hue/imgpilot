/**
 * Account + admin redesign Playwright smoke.
 * Usage: npx tsx scripts/verify-account-admin-browser.ts [baseUrl]
 */
import {chromium, type Browser} from "playwright";

const BASE = process.argv[2] || process.env.CUTOVER_BASE_URL || "http://127.0.0.1:3000";

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({headless: true});
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Guest header shows auth CTAs
    await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
    const signIn = page.getByRole("link", {name: /sign in/i}).first();
    record("guest_sign_in_visible", await signIn.isVisible().catch(() => false));

    // Login form exposes callback to tool
    const loginRes = await page.goto(
      `${BASE}/en/login?callbackUrl=${encodeURIComponent("/en/compress-image")}`,
      {waitUntil: "domcontentloaded"},
    );
    record("login_reachable", (loginRes?.status() ?? 0) === 200);

    // Account routes require auth → login
    const acct = await page.goto(`${BASE}/en/account`, {
      waitUntil: "domcontentloaded",
    });
    const acctUrl = page.url();
    record(
      "account_requires_auth",
      acctUrl.includes("/login") || (acct?.status() ?? 0) === 307,
      acctUrl,
    );

    // Dashboard index redirects toward account (via layout auth or page redirect)
    await page.goto(`${BASE}/en/dashboard`, {waitUntil: "domcontentloaded"});
    record(
      "dashboard_index_not_workspace",
      !page.url().includes("/dashboard/projects") &&
        (page.url().includes("/account") || page.url().includes("/login")),
      page.url(),
    );

    // Normal user / no session: admin must not leak (404 or login)
    const adminRes = await page.goto(`${BASE}/en/admin`, {waitUntil: "domcontentloaded"});
    const adminStatus = adminRes?.status() ?? 0;
    const adminUrl = page.url();
    record(
      "admin_gated",
      adminStatus === 404 || adminUrl.includes("/login") || adminStatus === 307,
      `status=${adminStatus} url=${adminUrl}`,
    );

    // UR login smoke
    const urLogin = await page.goto(`${BASE}/ur/login`, {waitUntil: "domcontentloaded"});
    record("ur_login", (urLogin?.status() ?? 0) === 200);
    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    record("ur_rtl", dir === "rtl", `dir=${dir}`);

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`summary passed=${results.length - failed} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
