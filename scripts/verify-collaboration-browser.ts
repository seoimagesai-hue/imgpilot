/**
 * Prompt 32 collaboration browser smoke.
 * Usage: npx tsx scripts/verify-collaboration-browser.ts http://localhost:3000
 */
import {eq, like} from "drizzle-orm";
import {chromium} from "playwright";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

const PREFIX = "p32-browser-";
type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  const password = "VerifyCollabBrowser32!";

  try {
    const health = await fetch(`${baseUrl}/en/login`);
    set("Production server", health.ok ? "Passed" : "Failed", String(health.status));
    if (!health.ok) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
  } catch {
    set("Production server", "Not run", "unreachable");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const {getDb} = await import("../src/db/index");
  const {users, projects, commentThreads, comments} = await import("../src/db/schema");
  const {hashPassword} = await import("../src/server/auth/password");
  const {createOwnedProject} = await import("../src/server/projects/queries");
  const db = getDb();
  const passwordHash = await hashPassword(password);

  const leftover = await db.select({id: users.id}).from(users).where(like(users.email, `${PREFIX}%`));
  for (const u of leftover) {
    await db.delete(comments).where(eq(comments.authorUserId, u.id));
    await db.delete(commentThreads).where(eq(commentThreads.createdByUserId, u.id));
    await db.delete(projects).where(eq(projects.userId, u.id));
    await db.delete(users).where(eq(users.id, u.id));
  }

  const userId = crypto.randomUUID();
  const email = `${PREFIX}owner@example.com`;
  await db.insert(users).values({id: userId, name: "P32 Browser", email, passwordHash});
  const project = await createOwnedProject(userId, {
    name: "P32 Browser Collab",
    websiteUrl: "https://example.com",
    description: "browser verify",
    metadataLanguage: "en",
  });

  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/en/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, {timeout: 15000});
    set("Login", "Passed");

    await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}/activity`);
    await page.waitForSelector("h1", {timeout: 10000});
    const title = await page.textContent("h1");
    set("Activity page", title?.includes("activity") || title?.includes("Activity") ? "Passed" : "Failed", title ?? "");

    await page.goto(`${baseUrl}/en/dashboard/projects/${project.id}`);
    const activityLink = page.locator(`a[href*="/activity"]`);
    set("Project activity link", (await activityLink.count()) > 0 ? "Passed" : "Failed");
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
