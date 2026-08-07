/**
 * Assert Image Tools menu includes Edit & create tools.
 * Usage: npx tsx scripts/verify-image-tools-menu.ts [baseUrl]
 */
import {chromium} from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:3015";
const outDir = path.join(".verify-tmp", "mega-menu-screenshots");
fs.mkdirSync(outDir, {recursive: true});

async function main() {
  const browser = await chromium.launch({headless: true});
  let failed = 0;

  {
    const page = await (await browser.newContext({viewport: {width: 1440, height: 1000}})).newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
    const btn = page.getByRole("button", {name: "Image Tools", exact: true});
    console.log("image_tools_button", await btn.isVisible());
    await btn.click();
    await page.getByRole("region", {name: /Image tools menu/i}).waitFor({state: "visible", timeout: 8000});
    for (const t of [
      "Edit & create",
      "Rotate Image",
      "Watermark Image",
      "Blur Region",
      "Meme Generator",
      "Compress Image",
    ]) {
      const vis = await page.getByText(t, {exact: true}).first().isVisible().catch(() => false);
      console.log(`${vis ? "PASS" : "FAIL"} desktop_${t}`);
      if (!vis) failed += 1;
    }
    await page.screenshot({path: path.join(outDir, "image-tools-edit-create.png"), fullPage: false});
    await page.context().close();
  }

  {
    const page = await (await browser.newContext({viewport: {width: 390, height: 844}})).newPage();
    await page.goto(`${BASE}/en`, {waitUntil: "networkidle"});
    await page.getByRole("button", {name: /Menu/i}).click();
    await page.locator("summary", {hasText: "Image Tools"}).click();
    for (const t of ["Rotate Image", "Watermark Image", "Blur Region", "Meme Generator"]) {
      const vis = await page.getByRole("link", {name: t, exact: true}).first().isVisible().catch(() => false);
      console.log(`${vis ? "PASS" : "FAIL"} mobile_${t}`);
      if (!vis) failed += 1;
    }
    await page.screenshot({path: path.join(outDir, "mobile-image-tools.png"), fullPage: false});
    await page.context().close();
  }

  await browser.close();
  console.log(failed ? `FAILED=${failed}` : "ALL_PASS");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
