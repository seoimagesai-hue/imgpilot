/**
 * One-shot patcher: marketing content getters → localizedCopy + EN fallback helper.
 * Run: node scripts/i18n/patch-localized-copy.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../../src");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const IMPORT = 'import {localizedCopy} from "@/lib/marketing/localized-copy";\n';
const PATTERN = /return locale === "ur" \? ur : en;/g;
const REPLACEMENT = "return localizedCopy(locale, {en, ur});";

let updated = 0;
for (const file of walk(root)) {
  let source = fs.readFileSync(file, "utf8");
  if (!PATTERN.test(source)) continue;
  PATTERN.lastIndex = 0;
  source = source.replace(PATTERN, REPLACEMENT);
  if (!source.includes("@/lib/marketing/localized-copy")) {
    source = IMPORT + source;
  }
  fs.writeFileSync(file, source);
  updated += 1;
  console.log("patched", path.relative(process.cwd(), file));
}
console.log("done", updated);
