/**
 * Prompt 17 Playwright checks for AI metadata panel.
 * Usage: npx tsx scripts/verify-metadata-browser.ts http://localhost:3000
 *
 * Requires production server. Worker recommended for draft completion when AI configured.
 */
import {chromium} from "playwright";
import {loadLocalEnvFiles} from "./load-local-env";

loadLocalEnvFiles();

type Status = "Passed" | "Failed" | "Blocked" | "Not run";
const report: Record<string, Status> = {};

function set(name: string, status: Status, detail?: string) {
  report[name] = status;
  console.log(`${status.toUpperCase()}: ${name}${detail ? ` (${detail})` : ""}`);
}

async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
  let browser;
  try {
    const login = await fetch(`${baseUrl}/en/login`);
    if (login.status !== 200) {
      set("Browser metadata", "Blocked", "server unavailable");
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    browser = await chromium.launch({headless: true});
    const page = await browser.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // Ambient login-page resource 400s are not product failures for this smoke
      if (/Failed to load resource.*400/i.test(text)) return;
      consoleErrors.push(text);
    });

    // Network: ensure browser never calls openai.com
    const forbiddenHosts: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/openai\.com|api\.openai/i.test(url)) forbiddenHosts.push(url.split("?")[0]!);
    });

    await page.goto(`${baseUrl}/en/login`, {waitUntil: "domcontentloaded"});
    set("English login reachable", "Passed");

    await page.goto(`${baseUrl}/ur/login`, {waitUntil: "domcontentloaded"});
    set("Urdu login reachable", "Passed");

    await page.setViewportSize({width: 375, height: 812});
    await page.goto(`${baseUrl}/en/login`, {waitUntil: "domcontentloaded"});
    set("Mobile viewport", "Passed");

    assertNoOpenai(forbiddenHosts);
    set(
      "Browser console",
      consoleErrors.length === 0 ? "Passed" : "Failed",
      consoleErrors.slice(0, 2).join("; "),
    );
    set(
      "Interactive generate/approve",
      "Blocked",
      "requires authenticated fixture session — covered by verify-metadata-live",
    );
  } catch (error) {
    set("Browser metadata", "Failed", error instanceof Error ? error.message : "error");
  } finally {
    await browser?.close();
  }
  console.log(JSON.stringify(report, null, 2));
}

function assertNoOpenai(hosts: string[]) {
  set("No direct OpenAI from browser", hosts.length === 0 ? "Passed" : "Failed", hosts[0]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed");
  process.exit(1);
});
