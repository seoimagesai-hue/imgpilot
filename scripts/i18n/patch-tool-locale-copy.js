const fs = require("fs");
const path = require("path");

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (/\.tsx?$/.test(e.name)) a.push(p);
  }
  return a;
}

const files = [...walk("src/app"), ...walk("src/components/marketing")];
let n = 0;
for (const f of files) {
  if (f.includes("tool-landing-copy.ts")) continue;
  let s = fs.readFileSync(f, "utf8");
  if (!s.includes("getToolLandingCopy")) continue;
  const o = s;
  s = s.replace(
    /import \{getToolLandingCopy\} from "@\/lib\/marketing\/tool-landing-copy";/g,
    'import {getToolLandingCopyForLocale} from "@/lib/marketing/tool-landing-copy";',
  );
  s = s.replace(/getToolLandingCopy\((PATH)\)/g, "getToolLandingCopyForLocale($1, locale)");
  s = s.replace(/getToolLandingCopy\((path)\)/g, "getToolLandingCopyForLocale($1, locale)");
  if (s !== o) {
    fs.writeFileSync(f, s);
    n += 1;
    console.log(f);
  }
}
console.log("updated", n);
