/**
 * Consumer launch Playwright smoke — EN/UR, desktop + mobile, keyboard basics.
 * Usage: npx tsx scripts/verify-consumer-launch-browser.ts [baseUrl]
 */
import {chromium, devices, type Browser, type Page} from "playwright";

const BASE = process.argv[2] || process.env.CUTOVER_BASE_URL || "http://127.0.0.1:3000";

type Result = {name: string; ok: boolean; detail?: string};
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({name, ok, detail});
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function noFatalConsole(page: Page, label: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => errors.push(err.message.slice(0, 200)));
  page.on("response", (res) => {
    if (res.status() === 403) {
      errors.push(`HTTP_403 ${res.url().slice(0, 160)}`);
    }
  });
  return () => {
    const fatal = errors.filter(
      (e) =>
        !/favicon|ResizeObserver|hydration|apple-touch|manifest\.webmanifest/i.test(e),
    );
    record(`${label}_console`, fatal.length === 0, fatal[0]);
  };
}

async function checkRoutes(page: Page, locale: "en" | "ur", suffix: string) {
  const paths = [
    "",
    "/compress-image",
    "/resize-image",
    "/crop-image",
    "/convert-image",
    "/geotag-image",
    "/image-metadata",
    "/ai-alt-text",
    "/image-metadata-editor",
    "/bulk-image-tools",
    "/pricing",
    "/login",
  ];
  for (const p of paths) {
    const res = await page.goto(`${BASE}/${locale}${p}`, {waitUntil: "domcontentloaded"});
    const status = res?.status() ?? 0;
    record(`${suffix}_route_${locale}${p || "/"}`, status === 200, `status=${status}`);
    const html = await page.content();
    record(
      `${suffix}_no_secrets_${locale}${p || "/home"}`,
      !/sk_live_|sk_test_|OPENAI_API_KEY|R2_SECRET|x-amz-signature=/i.test(html),
    );
  }
  const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
  if (locale === "ur") {
    record(`${suffix}_ur_rtl`, dir === "rtl", `dir=${dir}`);
  }
}

async function keyboardSmoke(page: Page) {
  await page.goto(`${BASE}/en/compress-image`, {waitUntil: "domcontentloaded"});
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.tagName || "");
  record("keyboard_tab_focus", Boolean(active), `tag=${active}`);
}

async function run() {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({headless: true});
    const desktop = await browser.newContext();
    const page = await desktop.newPage();
    const finishConsole = await noFatalConsole(page, "desktop_en");
    await checkRoutes(page, "en", "desktop");
    await checkRoutes(page, "ur", "desktop");
    await keyboardSmoke(page);
    finishConsole();
    await desktop.close();

    const mobile = await browser.newContext({...devices["iPhone 12"]});
    const mpage = await mobile.newPage();
    const finishMobile = await noFatalConsole(mpage, "mobile_en");
    await checkRoutes(mpage, "en", "mobile");
    await checkRoutes(mpage, "ur", "mobile");
    finishMobile();
    await mobile.close();
  } finally {
    await browser?.close();
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`summary passed=${results.length - failed} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

void run();
