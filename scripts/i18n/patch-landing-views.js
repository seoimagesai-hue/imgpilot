/**
 * Patch landing views: prefix-aware absoluteUrl + isRtlLocale.
 * Run: node scripts/i18n/patch-landing-views.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../../src/components/marketing");
const files = fs.readdirSync(dir).filter((f) => f.endsWith("-landing-view.tsx"));

let count = 0;
for (const name of files) {
  const file = path.join(dir, name);
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  if (s.includes("${origin}/${locale}")) {
    if (!s.includes('absoluteUrl')) {
      if (s.includes('getPublicAppOrigin')) {
        s = s.replace(
          /import \{([^}]*)getPublicAppOrigin([^}]*)\} from "@\/server\/marketing\/seo";/,
          (m, a, b) => {
            const parts = `${a}absoluteUrl${b}`
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            const uniq = [...new Set(parts.filter((p) => p !== "getPublicAppOrigin"))];
            // keep getPublicAppOrigin if still used elsewhere
            return `import {${uniq.join(", ")}} from "@/server/marketing/seo";`;
          },
        );
        if (!s.includes("absoluteUrl")) {
          s = `import {absoluteUrl} from "@/server/marketing/seo";\n` + s;
        }
      } else if (!s.includes("@/server/marketing/seo")) {
        s = `import {absoluteUrl} from "@/server/marketing/seo";\n` + s;
      } else {
        s = s.replace(
          /from "@\/server\/marketing\/seo";/,
          (m) => m, // noop, add separate
        );
        if (!s.includes("absoluteUrl")) {
          s = `import {absoluteUrl} from "@/server/marketing/seo";\n` + s;
        }
      }
    }

    s = s.replace(
      /const origin = getPublicAppOrigin\(\);\s*\n\s*const pageUrl = `\$\{origin\}\/\$\{locale\}(\$\{path\}|\$\{[^}]+\})`;/g,
      "const pageUrl = absoluteUrl(locale, path);",
    );
    s = s.replace(
      /const pageUrl = `\$\{origin\}\/\$\{locale\}(\$\{path\}|\$\{copy\.path\}|\$\{[^}]+\})`;/g,
      (match) => {
        if (match.includes("copy.path")) return "const pageUrl = absoluteUrl(locale, copy.path);";
        if (match.includes("${path}")) return "const pageUrl = absoluteUrl(locale, path);";
        return match;
      },
    );
    s = s.replace(
      /item: `\$\{origin\}\/\$\{locale\}\$\{crumb\.path === "\/" \? "" : crumb\.path\}`/g,
      'item: absoluteUrl(locale, crumb.path)',
    );
    s = s.replace(
      /item: `\$\{origin\}\/\$\{locale\}\$\{crumb\.path\}`/g,
      "item: absoluteUrl(locale, crumb.path)",
    );
  }

  if (s.includes('locale === "ur"')) {
    if (!s.includes("isRtlLocale")) {
      s = `import {isRtlLocale} from "@/i18n/routing";\n` + s;
    }
    s = s.replace(/locale === "ur"/g, "isRtlLocale(locale)");
  }

  // Drop unused getPublicAppOrigin import if no longer referenced
  if (s.includes("getPublicAppOrigin") && !/getPublicAppOrigin\s*\(/.test(s)) {
    s = s.replace(/,?\s*getPublicAppOrigin/g, "");
    s = s.replace(/getPublicAppOrigin,?\s*/g, "");
    s = s.replace(/import \{\s*\} from "@\/server\/marketing\/seo";\n/, "");
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    count += 1;
    console.log("patched", name);
  }
}
console.log("done", count);
