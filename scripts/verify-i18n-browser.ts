/**
 * Multilingual browser smoke — language switcher + key locale routes.
 * Usage: npx tsx scripts/verify-i18n-browser.ts [baseUrl]
 */
import {chromium, devices, type Page} from "playwright";

const BASE = process.argv[2] || process.env.CUTOVER_BASE_URL || "http://127.0.0.1:3000";

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({headless: true});
  try {
    const desktop = await browser.newPage({viewport: {width: 1280, height: 800}});
    await smokeDesktop(desktop);
    await desktop.close();

    const mobile = await browser.newPage({...devices["iPhone 13"]});
    await smokeMobile(mobile);
    await mobile.close();
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

async function smokeDesktop(page: Page) {
  for (const path of ["/", "/compress-image", "/es/", "/es/compress-image", "/ar/compress-image", "/ur/compress-image"]) {
    const res = await page.goto(`${BASE}${path}`, {waitUntil: "domcontentloaded"});
    record(`route_${path}`, (res?.status() ?? 0) === 200, `status=${res?.status()}`);
  }

  const enLegacy = await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
  const finalUrl = page.url();
  record(
    "en_prefix_301",
    !finalUrl.includes("/en/") && finalUrl.includes("/compress-image"),
    finalUrl,
  );
  record("en_prefix_status", (enLegacy?.status() ?? 0) === 200 || (enLegacy?.request().redirectedFrom() != null));

  await page.goto(`${BASE}/compress-image`, {waitUntil: "domcontentloaded"});
  const htmlLang = await page.locator("html").getAttribute("lang");
  const htmlDir = await page.locator("html").getAttribute("dir");
  record("en_lang", htmlLang === "en", `lang=${htmlLang}`);
  record("en_dir", htmlDir === "ltr", `dir=${htmlDir}`);

  await page.goto(`${BASE}/ar/compress-image`, {waitUntil: "domcontentloaded"});
  record("ar_dir", (await page.locator("html").getAttribute("dir")) === "rtl");
  await page.goto(`${BASE}/ur/compress-image`, {waitUntil: "domcontentloaded"});
  record("ur_dir", (await page.locator("html").getAttribute("dir")) === "rtl");

  await page.goto(`${BASE}/`, {waitUntil: "domcontentloaded"});
  const switcher = page.locator('select[aria-label]').first();
  const optionCount = await switcher.locator("option").count();
  record("switcher_option_count", optionCount >= 25, `count=${optionCount}`);
  await switcher.selectOption("es");
  await page.waitForURL(/\/es(\/|$)/, {timeout: 15000});
  record("switcher_to_es", page.url().includes("/es"));

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  record("es_canonical_self", Boolean(canonical && canonical.includes("/es")), canonical ?? undefined);

  const hreflangs = await page.locator('link[rel="alternate"][hreflang]').count();
  record("hreflang_present", hreflangs >= 25, `count=${hreflangs}`);
}

async function smokeMobile(page: Page) {
  await page.goto(`${BASE}/`, {waitUntil: "domcontentloaded"});
  const menuBtn = page.getByRole("button", {name: /menu|navigation|open/i}).first();
  if (await menuBtn.count()) {
    await menuBtn.click();
    const panel = page.locator("header").locator('select[aria-label]').last();
    record("mobile_switcher_visible", await panel.isVisible(), "language switcher in mobile menu");
  } else {
    record("mobile_menu_button", false, "menu button not found");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
