import {chromium} from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:3016";

async function main() {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}\n${e.stack ?? ""}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`CON: ${m.text()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && (r.url().includes("_next") || r.url().includes(".js"))) {
      errors.push(`HTTP ${r.status()} ${r.url()}`);
    }
  });

  for (const path of ["/en", "/ur", "/en/compress-image"]) {
    errors.length = 0;
    console.log("\n===", path, "===");
    try {
      const res = await page.goto(`${BASE}${path}`, {waitUntil: "domcontentloaded", timeout: 60000});
      console.log("status", res?.status());
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log("goto failed", e instanceof Error ? e.message : e);
    }
    const body = await page.locator("body").innerText().catch(() => "");
    console.log("body", body.slice(0, 500));
    console.log("error_count", errors.length);
    for (const e of errors.slice(0, 20)) console.log(e.slice(0, 500));
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
