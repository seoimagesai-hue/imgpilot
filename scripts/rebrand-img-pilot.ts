/**
 * One-shot brand rename helpers for user-facing strings.
 * Prefer running only when migrating brand copy — not part of CI.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  ".next",
  ".next-p3-verify",
  ".next-i18n-verify",
  ".next-pre-v2-cutover",
  ".verify-tmp",
  "coverage",
  "dist",
  "out",
]);
const SKIP_FILE = new Set(["package-lock.json", "package.json"]);
const EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".html",
  ".css",
  ".txt",
  ".example",
]);

let filesTouched = 0;
let replacements = 0;

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith(".next")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      walk(full);
      continue;
    }
    if (SKIP_FILE.has(entry.name)) continue;
    if (entry.name === "translation-memory.json") continue;
    const ext = path.extname(entry.name);
    if (!EXT.has(ext) && !entry.name.endsWith(".example")) continue;
    let text: string;
    try {
      text = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (!text.includes("SEO Images") && !text.includes("SEO IMAGES") && !text.includes("SeoImages-Webhooks")) {
      continue;
    }
    const next = text
      .split("SEO Images")
      .join("Img Pilot")
      .split("SEO IMAGES")
      .join("IMG PILOT")
      .split("SeoImages-Webhooks")
      .join("ImgPilot-Webhooks");
    if (next === text) continue;
    const count =
      (text.match(/SEO Images/g) || []).length +
      (text.match(/SEO IMAGES/g) || []).length +
      (text.match(/SeoImages-Webhooks/g) || []).length;
    fs.writeFileSync(full, next, "utf8");
    filesTouched += 1;
    replacements += count;
    console.log(`${count}\t${path.relative(ROOT, full)}`);
  }
}

walk(ROOT);
console.log(JSON.stringify({ok: true, filesTouched, replacements}, null, 2));
