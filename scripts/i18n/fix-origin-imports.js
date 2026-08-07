/**
 * Restore getPublicAppOrigin imports where still referenced after absoluteUrl patch.
 * Run: node scripts/i18n/fix-origin-imports.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../../src/components/marketing");
let n = 0;
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith("-landing-view.tsx"))) {
  const file = path.join(dir, name);
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("getPublicAppOrigin(")) continue;
  if (s.includes("getPublicAppOrigin") && /import \{[^}]*getPublicAppOrigin[^}]*\} from "@\/server\/marketing\/seo"/.test(s)) {
    continue;
  }
  if (s.includes('from "@/server/marketing/seo"')) {
    s = s.replace(
      /import \{([^}]+)\} from "@\/server\/marketing\/seo";/,
      (m, inner) => {
        const parts = inner
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (!parts.includes("getPublicAppOrigin")) parts.push("getPublicAppOrigin");
        return `import {${parts.join(", ")}} from "@/server/marketing/seo";`;
      },
    );
  } else {
    s = `import {getPublicAppOrigin} from "@/server/marketing/seo";\n` + s;
  }
  fs.writeFileSync(file, s);
  n += 1;
  console.log("fixed", name);
}
console.log("done", n);
