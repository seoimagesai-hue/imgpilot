/**
 * npm run i18n:populate-curated
 *
 * Bootstrap machine translations for all non-English locales using the
 * configured provider (or public GTX when I18N_ALLOW_PUBLIC_MT=1).
 * Writes status machine_translated — never marks content approved/reviewed.
 */
import {spawnSync} from "node:child_process";
import path from "node:path";
import {LOCALES, REPO_ROOT, WAVE} from "./lib/paths";

function run(args: string[]) {
  const env = {
    ...process.env,
    I18N_ALLOW_PUBLIC_MT: process.env.I18N_ALLOW_PUBLIC_MT || "1",
  };
  console.log(`\n>> npx tsx scripts/i18n/translate.ts ${args.join(" ")}`);
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "scripts/i18n/translate.ts", ...args],
    {cwd: REPO_ROOT, env, stdio: "inherit", shell: true},
  );
  if (result.status !== 0) {
    throw new Error(`translate failed for ${args.join(" ")}`);
  }
}

function main() {
  const onlyWave = process.argv.find((a) => a.startsWith("--wave="))?.split("=")[1];
  const onlyLocale = process.argv.find((a) => a.startsWith("--locale="))?.split("=")[1];

  let locales = LOCALES.filter((l) => l !== "en");
  if (onlyLocale) {
    locales = locales.filter((l) => l === onlyLocale);
  } else if (onlyWave && WAVE[onlyWave as "1" | "2" | "3" | "4"]) {
    locales = WAVE[onlyWave as "1" | "2" | "3" | "4"];
  }

  console.log(
    JSON.stringify(
      {
        action: "populate-curated",
        providerHint: "public GTX unless OPENAI/DEEPL/GOOGLE key set",
        locales,
      },
      null,
      2,
    ),
  );

  // Extract English catalogs first
  const extract = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "scripts/i18n/extract.ts"],
    {cwd: REPO_ROOT, env: process.env, stdio: "inherit", shell: true},
  );
  if (extract.status !== 0) throw new Error("extract failed");

  for (const locale of locales) {
    try {
      run(["--locale", locale]);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      console.error(`Continuing after failure for locale=${locale}`);
    }
  }

  const audit = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", path.join("scripts/i18n/audit.ts")],
    {cwd: REPO_ROOT, env: process.env, stdio: "inherit", shell: true},
  );
  if (audit.status !== 0) {
    console.warn("audit finished with warnings/errors — see reports/i18n");
  }

  console.log(JSON.stringify({ok: true, populated: locales}, null, 2));
}

main();
