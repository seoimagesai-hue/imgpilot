/**
 * Pricing page redesign screenshots + smoke checks.
 * Usage: npx tsx scripts/verify-pricing-browser.ts [baseUrl]
 */
import {chromium, type Browser} from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:3000";
const outDir = path.join(".verify-tmp", "pricing-screenshots");
fs.mkdirSync(outDir, {recursive: true});

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  let browser: Browser | null = null;
  try {
    const status = await fetch(`${BASE}/en/pricing`).then((r) => r.status).catch(() => 0);
    record("pricing_reachable", status === 200, `status=${status}`);
    if (status !== 200) throw new Error("pricing unreachable");

    browser = await chromium.launch({headless: true});

    {
      const ctx = await browser.newContext({viewport: {width: 1440, height: 1100}});
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 180)));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 180));
      });
      await page.goto(`${BASE}/en/pricing`, {waitUntil: "networkidle"});
      record(
        "en_h1",
        await page.getByRole("heading", {name: /Choose the right plan for your workflow/i}).isVisible(),
      );
      record("en_toggle", await page.getByRole("button", {name: /Yearly/i}).isVisible());
      await page.getByRole("button", {name: /Yearly/i}).click();
      record("en_save_badge", await page.getByText("Save 20%").first().isVisible());
      record("en_guest_cta", await page.getByRole("link", {name: /Start using tools/i}).isVisible());
      record(
        "en_free_cta",
        await page.getByLabel("Plans").getByRole("link", {name: /Create free account/i}).isVisible(),
      );
      record(
        "en_pro_cta",
        (await page.getByRole("button", {name: /Coming Soon|Upgrade to Pro/i}).count()) >= 1,
      );
      record("en_compare", await page.getByRole("heading", {name: /Compare features/i}).isVisible());
      record("en_security", await page.getByRole("heading", {name: /private, temporary/i}).isVisible());
      record("en_faq", await page.getByRole("heading", {name: /Frequently asked questions/i}).isVisible());
      await page.screenshot({path: path.join(outDir, "desktop-en-top.png"), fullPage: false});
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.screenshot({path: path.join(outDir, "desktop-en-mid.png"), fullPage: false});
      await page.screenshot({path: path.join(outDir, "desktop-en-full.png"), fullPage: true});
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      record("en_desktop_no_overflow", !overflow);
      record(
        "en_console",
        errors.filter((e) => !/favicon|hydration|ResizeObserver|Failed to load resource/i.test(e)).length === 0,
        errors[0],
      );
      await ctx.close();
    }

    {
      const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en/pricing`, {waitUntil: "networkidle"});
      record(
        "mobile_h1",
        await page.getByRole("heading", {name: /Choose the right plan for your workflow/i}).isVisible(),
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      record("mobile_no_overflow", !overflow);
      await page.screenshot({path: path.join(outDir, "mobile-en-top.png"), fullPage: false});
      await page.screenshot({path: path.join(outDir, "mobile-en-full.png"), fullPage: true});
      await ctx.close();
    }

    const failed = results.filter((r) => !r.ok);
    console.log("\n--- summary ---");
    console.log(`passed=${results.length - failed.length} failed=${failed.length}`);
    console.log(`screenshots=${outDir}`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
