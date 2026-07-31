/**
 * Prompt 10 interactive browser verification (Playwright).
 * EN desktop, UR RTL, mobile 375px, no billing CTA.
 *
 * Usage (production server must be running):
 *   npx tsx scripts/verify-quota-browser.ts http://localhost:3000
 */
import {eq, inArray} from "drizzle-orm";
import {chromium} from "playwright";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
}

function assert(name: string, ok: boolean, detail?: string) {
  set(name, ok ? "Passed" : "Failed", detail);
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

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, projectQuotaState, quotaReservations} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");

  const db = getDb();
  const sql = getPostgresClient();

  const userId = crypto.randomUUID();
  const email = `quota-ui-${stamp}@example.com`;
  const password = `QuotaUi-${stamp}-Safe!`;
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id: userId,
    name: "Quota UI User",
    email,
    passwordHash,
  });

  const project = await createOwnedProject(userId, {
    name: `Quota UI ${stamp}`,
    websiteUrl: "https://ui.example",
    description: "quota browser",
    metadataLanguage: "en",
  });

  const browser = await chromium.launch({headless: true});

  try {
    const cookies = await loginViaCredentials(baseUrl, email, password);

    // English desktop
    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);

      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert("EN library page loaded", !page.url().includes("/login"));

      const summary = page.locator("#project-quota-summary-heading");
      await summary.waitFor({state: "visible", timeout: 15_000});
      assert("EN library quota summary visible", await summary.isVisible());

      const bodyText = await page.locator("body").innerText();
      assert(
        "No billing CTA",
        !/upgrade plan|stripe|subscribe now|buy credits|pricing tier/i.test(bodyText),
      );

      const dir = await page.locator("html").getAttribute("dir");
      assert("EN LTR", dir === "ltr" || dir === null);

      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images/upload`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert(
        "EN upload quota summary visible",
        await page.locator("#project-quota-summary-heading").isVisible(),
      );
      assert(
        "EN upload remaining limits visible",
        await page.getByText(/Remaining for this project/).isVisible(),
      );
      await page.close();
    }

    // Urdu RTL
    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/ur/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      const dir = await page.locator("html").getAttribute("dir");
      assert("UR RTL", dir === "rtl");
      assert(
        "UR library quota summary visible",
        await page.locator("#project-quota-summary-heading").isVisible(),
      );
      await page.goto(`${baseUrl}/ur/dashboard/projects/${project.id}/images/upload`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert(
        "UR upload remaining limits visible",
        await page.getByText(/اس پروجیکٹ کے لیے باقی/).isVisible(),
      );
      await page.close();
    }

    // Mobile 375px
    {
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      const summary = page.locator("#project-quota-summary-heading");
      await summary.waitFor({state: "visible", timeout: 15_000});
      const box = await summary.boundingBox();
      assert("Mobile quota summary visible", Boolean(box));
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth > el.clientWidth + 2;
      });
      assert("Mobile no horizontal overflow", !overflow);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  await db.delete(quotaReservations).where(eq(quotaReservations.projectId, project.id));
  await db.delete(projectQuotaState).where(eq(projectQuotaState.projectId, project.id));
  await db.delete(projects).where(eq(projects.id, project.id));
  await db.delete(users).where(inArray(users.id, [userId]));

  await sql.end({timeout: 5});

  set("Quota browser flow", "Passed");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
