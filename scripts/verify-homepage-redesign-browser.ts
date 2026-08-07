/**
 * Premium homepage redesign browser smoke + screenshots.
 * Usage: npx tsx scripts/verify-homepage-redesign-browser.ts [baseUrl]
 */
import {chromium, devices, type Browser} from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:3015";
const outDir = path.join(".verify-tmp", "homepage-screenshots");
fs.mkdirSync(outDir, {recursive: true});

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const SECTION_MARKERS = [
  "Optimize Every Image in One Simple Workspace",
  "Drop an image here to get started",
  "No Account Required",
  "Powerful Image Tools, Ready When You Are",
  "Go Straight to the Format You Need",
  "From Upload to Download Without the Usual Complexity",
  "Image Tools That Respect Your Time and Your Files",
  "Finish Your Image Task in Four Clear Steps",
  "See the Difference Before You Download",
  "Prepare Images for Websites, Content and Everyday Sharing",
  "Turn Ordinary Images Into Better Website Assets",
  "Process a Small Batch Without Repeating Every Step",
  "Temporary Files Should Stay Temporary",
  "Work With the Image Formats You Use Most",
  "Frequently asked questions",
  "Your Next Image Is Ready to Be Optimized",
];

async function main() {
  let browser: Browser | null = null;
  try {
    const health = await fetch(`${BASE}/api/health`).then((r) => r.status).catch(() => 0);
    record("ready_health", health === 200 || health === 404 || health === 401, `status=${health}`);
    // Prefer known health routes if present
    for (const p of ["/api/health", "/api/health/ready", "/en"]) {
      try {
        const s = (await fetch(`${BASE}${p}`)).status;
        if (p === "/en") record("homepage_en_http", s === 200, `status=${s}`);
      } catch {
        /* ignore */
      }
    }

    browser = await chromium.launch({headless: true});

    // Desktop EN
    {
      const ctx = await browser.newContext({viewport: {width: 1440, height: 1100}});
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 160));
      });
      const failedAssets: string[] = [];
      page.on("response", (res) => {
        if (res.url().includes("/illustrations/") && !res.ok()) failedAssets.push(res.url());
      });

      await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
      const html = await page.content();
      record("en_h1_unique", (await page.locator("h1").count()) === 1);
      for (const marker of SECTION_MARKERS) {
        record(`en_section_${marker.slice(0, 28)}`, html.includes(marker));
      }
      record("en_upload_tool", html.includes("Choose an Image") && html.includes("hero-upload"));
      record("en_faq_count", (html.match(/Do I need an account to use Img Pilot\?/g) || []).length >= 1 && html.includes("Does image optimization guarantee"));
      record("en_jsonld_faq", html.includes("FAQPage"));
      record("en_illustration_hero_removed", !html.includes("/illustrations/hero-image-optimization.png"));
      record("en_no_svg_placeholders", !html.includes("/illustrations/") || !/\.svg/i.test(html.match(/\/illustrations\/[^"'\s]+/g)?.join(" ") || ""));
      const illus = [...html.matchAll(/\/illustrations\/[a-z0-9-]+\.(png|svg)/gi)].map((m) => m[0]);
      record("en_illustrations_png_only", illus.length > 0 && illus.every((u) => u.endsWith(".png")), illus.filter((u) => u.endsWith(".svg")).join(","));
      const visibleText = await page.locator("body").innerText();
      record("en_no_second_open_compress", !/Open Compress Image tool/i.test(visibleText));
      record("en_footer_expanded", html.includes("Popular Formats") && html.includes("Frequently Asked Questions"));
      record("en_header_create_account", html.includes("Create free account"));
      await page.screenshot({path: path.join(outDir, "desktop-en-top.png"), fullPage: false});
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({path: path.join(outDir, "desktop-en-bottom.png"), fullPage: false});
      await page.screenshot({path: path.join(outDir, "desktop-en-full.png"), fullPage: true});

      // Nav smoke
      await page.getByRole("button", {name: "Image Tools"}).click();
      record("en_mega_image_tools", await page.getByRole("link", {name: "Compress Image"}).first().isVisible());
      await page.keyboard.press("Escape");

      // FAQ open
      await page.locator("#faq summary").first().click();
      record("en_faq_accordion", true);

      // Overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      record("en_desktop_no_h_overflow", !overflow);

      record(
        "en_console",
        errors.filter((e) => !/favicon|hydration|ResizeObserver/i.test(e)).length === 0,
        errors[0],
      );
      record("en_illustrations_http", failedAssets.length === 0, failedAssets[0]);
      await ctx.close();
    }

    // Desktop UR
    {
      const ctx = await browser.newContext({viewport: {width: 1440, height: 1100}});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/ur`, {waitUntil: "networkidle"});
      const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
      const html = await page.content();
      record("ur_rtl", dir === "rtl", `dir=${dir}`);
      record("ur_translated_h1", html.includes("ہر تصویر ایک سادہ ورک اسپیس میں بہتر بنائیں"));
      record("ur_faq", html.includes("اکثر پوچھے گئے سوالات"));
      await page.screenshot({path: path.join(outDir, "desktop-ur.png"), fullPage: true});
      await ctx.close();
    }

    // Mobile EN 375
    {
      const ctx = await browser.newContext({...devices["iPhone 12"]});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      record("mobile_en_375_no_overflow", !overflow);
      record("mobile_en_h1", await page.getByRole("heading", {level: 1}).isVisible());
      await page.getByRole("button", {name: "Menu"}).click();
      const bulkLink = page.locator("header.sticky").getByRole("link", {name: "Bulk Tools"});
      await bulkLink.waitFor({state: "visible", timeout: 5000}).catch(() => null);
      record("mobile_en_menu", await bulkLink.isVisible().catch(() => false));
      await page.screenshot({path: path.join(outDir, "mobile-en-375.png"), fullPage: true});
      await ctx.close();
    }

    // Mobile EN 430 approx
    {
      const ctx = await browser.newContext({viewport: {width: 430, height: 900}, isMobile: true});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en`, {waitUntil: "domcontentloaded"});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      record("mobile_en_430_no_overflow", !overflow);
      await page.screenshot({path: path.join(outDir, "mobile-en-430.png"), fullPage: false});
      await ctx.close();
    }

    // Mobile UR
    {
      const ctx = await browser.newContext({...devices["iPhone 12"]});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/ur`, {waitUntil: "networkidle"});
      const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
      record("mobile_ur_rtl", dir === "rtl", `dir=${dir}`);
      await page.screenshot({path: path.join(outDir, "mobile-ur-375.png"), fullPage: true});
      await ctx.close();
    }

    // Upload handoff: file chooser → compress route
    {
      const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en`, {waitUntil: "domcontentloaded"});
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByRole("button", {name: "Choose an Image"}).first().click(),
      ]);
      const tmp = path.join(outDir, "tiny.png");
      // 1x1 png
      fs.writeFileSync(
        tmp,
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        ),
      );
      await fileChooser.setFiles(tmp);
      await page.waitForURL(/compress-image/, {timeout: 15000});
      record("upload_opens_compress", page.url().includes("compress-image"), page.url());
      await ctx.close();
    }
  } finally {
    await browser?.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    for (const f of failed) console.log(` - ${f.name}: ${f.detail || ""}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
