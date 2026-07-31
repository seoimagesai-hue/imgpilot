/**
 * Prompt 11 Playwright Ready UI verification.
 * Usage: npx tsx scripts/verify-ready-browser.ts http://localhost:3000
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
  assert("Production server", (await fetch(`${baseUrl}/en/login`)).status === 200, baseUrl);

  const {getDb, getPostgresClient} = await import("../src/db/index");
  const {users, projects, projectQuotaState, quotaReservations} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");

  const db = getDb();
  const sql = getPostgresClient();
  const userId = crypto.randomUUID();
  const email = `ready-ui-${stamp}@example.com`;
  const password = `ReadyUi-${stamp}-Safe!`;
  await db.insert(users).values({
    id: userId,
    name: "Ready UI",
    email,
    passwordHash: await hashPassword(password),
  });
  const project = await createOwnedProject(userId, {
    name: `Ready UI ${stamp}`,
    websiteUrl: "https://ready-ui.example",
    description: "ready browser",
    metadataLanguage: "en",
  });

  const browser = await chromium.launch({headless: true});
  try {
    const cookies = await loginViaCredentials(baseUrl, email, password);

    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert("EN library loaded", !page.url().includes("/login"));
      await page.locator("#project-ready-summary-heading").waitFor({state: "visible", timeout: 15_000});
      assert("EN Ready summary", await page.locator("#project-ready-summary-heading").isVisible());
      assert("EN Ready filter", await page.getByRole("button", {name: /Ready/i}).first().isVisible());
      const body = await page.locator("body").innerText();
      assert("No process CTA", !/start processing|queue|compress|webp/i.test(body));
      assert("EN LTR", (await page.locator("html").getAttribute("dir")) !== "rtl");
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 1280, height: 800}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/ur/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert("UR RTL", (await page.locator("html").getAttribute("dir")) === "rtl");
      assert("UR Ready summary", await page.locator("#project-ready-summary-heading").isVisible());
      await page.close();
    }

    {
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.context().addCookies(cookies);
      await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/images`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      assert("Mobile Ready summary", await page.locator("#project-ready-summary-heading").isVisible());
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      assert("Mobile no overflow", !overflow);
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

  set("Ready browser flow", "Passed");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("FATAL:", error instanceof Error ? error.message : "unknown");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
