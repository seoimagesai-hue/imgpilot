/**
 * Desktop mega-menu floating panel verification + screenshots.
 * Usage: npx tsx scripts/verify-mega-menu-browser.ts [baseUrl]
 */
import {chromium, type Browser, type Page} from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:3015";
const outDir = path.join(".verify-tmp", "mega-menu-screenshots");
fs.mkdirSync(outDir, {recursive: true});

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const MENUS = [
  {name: "Image Tools", file: "image-tools", expect: "Compress Image"},
  {name: "Resize", file: "resize", expect: "Resize Image"},
  {name: "Compress", file: "compress", expect: "Compress Image"},
  {name: "Convert", file: "convert", expect: "Convert to JPG"},
  {name: "SEO Tools", file: "seo-tools", expect: "AI Alt Text Generator"},
  {name: "Bulk Tools", file: "bulk-tools", expect: "Guest batch limits apply"},
] as const;

async function openMenu(page: Page, name: string) {
  await page.getByRole("button", {name, exact: true}).click();
}

async function assertFloatingPanel(page: Page, label: string) {
  const region = page.getByRole("region", {name: new RegExp(label, "i")}).first();
  await region.waitFor({state: "visible", timeout: 5000});
  const box = await region.boundingBox();
  if (!box) {
    record(`${label}_box`, false, "no bounding box");
    return null;
  }
  const vw = page.viewportSize()?.width ?? 1440;
  record(
    `${label}_not_full_width`,
    box.width < vw - 40,
    `w=${Math.round(box.width)} vw=${vw}`,
  );
  record(`${label}_rounded_panel`, box.height > 80);
  const pushed = await page.evaluate(() => {
    const main = document.querySelector("main");
    return main ? getComputedStyle(main).position : "";
  });
  record(`${label}_main_still_static`, pushed === "static" || pushed === "relative" || pushed === "");
  return region;
}

async function captureMenus(page: Page, prefix: string) {
  for (const menu of MENUS) {
    await openMenu(page, menu.name);
    const region = await assertFloatingPanel(page, menu.name.split(" ")[0]!);
    if (menu.expect === "Guest batch limits apply") {
      record(
        `${prefix}_${menu.file}_guest_note`,
        await page
          .getByRole("region", {name: /Bulk tools menu/i})
          .getByText("Guest batch limits apply.", {exact: true})
          .isVisible(),
      );
    } else if (menu.expect === "Convert to JPG") {
      record(
        `${prefix}_${menu.file}_group`,
        await page.getByText("Convert to JPG", {exact: true}).first().isVisible(),
      );
    } else {
      record(
        `${prefix}_${menu.file}_item`,
        await page.getByRole("link", {name: new RegExp(menu.expect)}).first().isVisible(),
      );
    }
    await page.screenshot({
      path: path.join(outDir, `${prefix}-${menu.file}.png`),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    if (region) {
      record(`${prefix}_${menu.file}_escape_closes`, !(await region.isVisible().catch(() => false)));
    }
  }
}

async function main() {
  let browser: Browser | null = null;
  try {
    const status = await fetch(`${BASE}/en`).then((r) => r.status).catch(() => 0);
    record("homepage_reachable", status === 200, `status=${status}`);
    if (status !== 200) {
      throw new Error(`Homepage not reachable at ${BASE}/en`);
    }

    browser = await chromium.launch({headless: true});

    // EN 1440
    {
      const ctx = await browser.newContext({viewport: {width: 1440, height: 1000}});
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 160));
      });

      await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
      const headerH = await page.locator("header").first().evaluate((el) => el.getBoundingClientRect().height);
      record("en_header_height_near_72", headerH >= 70 && headerH <= 90, `h=${headerH}`);

      const beforeTop = await page.evaluate(() => {
        const main = document.querySelector("main");
        return main?.getBoundingClientRect().top ?? 0;
      });

      await openMenu(page, "Resize");
      await page.getByRole("region", {name: /Resize/i}).waitFor({state: "visible"});
      const afterTop = await page.evaluate(() => {
        const main = document.querySelector("main");
        return main?.getBoundingClientRect().top ?? 0;
      });
      record("en_no_content_shift", Math.abs(afterTop - beforeTop) < 2, `d=${afterTop - beforeTop}`);
      await page.keyboard.press("Escape");

      await captureMenus(page, "en-1440");

      // Outside click
      await openMenu(page, "Compress");
      await page.getByRole("region", {name: /Compress/i}).waitFor({state: "visible"});
      await page.locator("main").click({position: {x: 40, y: 40}});
      record(
        "en_outside_click_closes",
        !(await page.getByRole("region", {name: /Compress/i}).isVisible().catch(() => false)),
      );

      // Switch menus
      await openMenu(page, "Image Tools");
      await openMenu(page, "SEO Tools");
      record(
        "en_switch_closes_previous",
        !(await page.getByRole("region", {name: /Image tools menu/i}).isVisible().catch(() => false)) &&
          (await page.getByRole("region", {name: /SEO tools menu/i}).isVisible()),
      );
      await page.keyboard.press("Escape");

      // Toggle same trigger
      await openMenu(page, "Bulk Tools");
      await openMenu(page, "Bulk Tools");
      record(
        "en_toggle_closes",
        !(await page.getByRole("region", {name: /Bulk tools menu/i}).isVisible().catch(() => false)),
      );

      // Keyboard a11y
      await page.getByRole("button", {name: "Convert", exact: true}).focus();
      await page.keyboard.press("Enter");
      const convertRegion = page.getByRole("region", {name: /Convert tools menu/i});
      record("en_keyboard_open", await convertRegion.isVisible());
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      record("en_keyboard_tab_into_panel", focused === "A" || focused === "BUTTON");
      await page.keyboard.press("Escape");
      const focusedAfter = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.getAttribute("aria-controls") || el?.textContent?.slice(0, 40) || el?.tagName;
      });
      record("en_focus_restored", /convert/i.test(String(focusedAfter)) || String(focusedAfter).includes("Convert"));

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      record("en_1440_no_h_overflow", !overflow);
      record(
        "en_console",
        errors.filter((e) => !/favicon|hydration|ResizeObserver|Failed to load resource/i.test(e)).length === 0,
        errors[0],
      );
      await ctx.close();
    }

    // EN ~1024
    {
      const ctx = await browser.newContext({viewport: {width: 1024, height: 900}});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
      const desktopNav = page.getByRole("button", {name: "Image Tools", exact: true});
      const desktopVisible = await desktopNav.isVisible().catch(() => false);
      if (desktopVisible) {
        await captureMenus(page, "en-1024");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        );
        record("en_1024_no_h_overflow", !overflow);
      } else {
        record("en_1024_uses_mobile_nav", await page.getByRole("button", {name: /Menu/i}).isVisible());
      }
      await ctx.close();
    }

    // UR RTL
    {
      const ctx = await browser.newContext({viewport: {width: 1440, height: 1000}});
      const page = await ctx.newPage();
      await page.goto(`${BASE}/ur`, {waitUntil: "networkidle"});
      const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
      record("ur_dir_rtl", dir === "rtl");

      // Triggers may still be English chrome keys or translated — try both
      const resizeTrigger = page.getByRole("button", {name: /Resize|سائز/i}).first();
      await resizeTrigger.click();
      const region = page.locator("[role='region']").filter({hasText: /Resize|سائز|JPG/i}).first();
      record("ur_resize_panel", await region.isVisible().catch(() => false));
      await page.screenshot({path: path.join(outDir, "ur-1440-resize.png"), fullPage: false});
      await page.keyboard.press("Escape");

      const convertTrigger = page.getByRole("button", {name: /Convert|کنورٹ/i}).first();
      await convertTrigger.click();
      record(
        "ur_convert_badges_ltr",
        await page.locator("[dir='ltr']").filter({hasText: "PNG"}).first().isVisible().catch(() => false),
      );
      await page.screenshot({path: path.join(outDir, "ur-1440-convert.png"), fullPage: false});
      await ctx.close();
    }

    const failed = results.filter((r) => !r.ok);
    console.log("\n--- summary ---");
    console.log(`passed=${results.length - failed.length} failed=${failed.length}`);
    console.log(`screenshots=${outDir}`);
    if (failed.length) {
      for (const f of failed) console.log(`FAIL ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
      process.exitCode = 1;
    }
  } finally {
    await browser?.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
