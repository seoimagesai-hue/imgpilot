/**
 * npm run i18n:extract
 * Builds English source-of-truth content catalogs from live TS/JSON masters.
 */
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {
  CONTENT_DIR,
  LOCALES,
  MESSAGES_DIR,
  REPO_ROOT,
  STATUS_DIR,
  flattenJson,
  readJson,
  writeJson,
  type LocaleStatusFile,
} from "./lib/paths";

function importTs(relFromRepo: string) {
  const abs = path.join(REPO_ROOT, relFromRepo);
  return import(pathToFileURL(abs).href);
}

async function main() {
  // Layer 1 inventory (messages already live under src/messages)
  const guestEn = readJson<Record<string, unknown>>(path.join(MESSAGES_DIR, "guest/en.json"));
  const coreEn = readJson<Record<string, unknown>>(path.join(MESSAGES_DIR, "en.json"));
  const layer1 = {
    chrome: coreEn.chrome,
    common: {
      brand: (coreEn.common as Record<string, unknown>)?.brand,
      comingSoon: (coreEn.common as Record<string, unknown>)?.comingSoon,
      openMenu: (coreEn.common as Record<string, unknown>)?.openMenu,
      closeMenu: (coreEn.common as Record<string, unknown>)?.closeMenu,
      mainNavigation: (coreEn.common as Record<string, unknown>)?.mainNavigation,
    },
    navigation: coreEn.navigation,
    language: coreEn.language,
    errors: coreEn.errors,
    guest: guestEn,
  };
  writeJson(path.join(CONTENT_DIR, "en/layer1-ui.json"), layer1);

  // Homepage — evaluate TS module via dynamic import of compiled getter data by reading source JSON dump helper
  const homepageMod = await importTs("src/lib/marketing/homepage-content.ts");
  const homepageEn = homepageMod.getHomepageCopy("en");
  writeJson(path.join(CONTENT_DIR, "en/homepage.json"), homepageEn);
  const homepageUr = homepageMod.getHomepageCopy("ur");
  writeJson(path.join(CONTENT_DIR, "ur/homepage.json"), homepageUr);

  // Tools — English map from tool-landing-copy
  const toolsMod = await importTs("src/lib/marketing/tool-landing-copy.ts");
  writeJson(path.join(CONTENT_DIR, "en/tools.json"), toolsMod.TOOL_LANDING_COPY);

  // SEO landings — registry short fields + seo-tool-landing shells
  const registryMod = await importTs("src/lib/marketing/tool-landing-registry.ts");
  const seoShellMod = await importTs("src/lib/marketing/seo-tool-landing-copy.ts");
  const registryEntries = (
    registryMod as {listIndexableToolLandings: () => {slug: string}[]}
  ).listIndexableToolLandings();
  const seoCatalog: Record<string, unknown> = {
    registry: Object.fromEntries(registryEntries.map((e) => [e.slug, e])),
    shells: (seoShellMod as {SEO_TOOL_LANDING_COPY: Record<string, unknown>})
      .SEO_TOOL_LANDING_COPY,
  };
  writeJson(path.join(CONTENT_DIR, "en/seo-landings.json"), seoCatalog);

  // Ensure locale dirs + default status files
  for (const locale of LOCALES) {
    fs.mkdirSync(path.join(CONTENT_DIR, locale), {recursive: true});
    const statusPath = path.join(STATUS_DIR, `${locale}.json`);
    if (!fs.existsSync(statusPath)) {
      const status: LocaleStatusFile = {
        locale,
        updatedAt: new Date().toISOString(),
        layers: {
          layer1_ui: locale === "en" || locale === "ur" ? "approved" : "missing",
          layer2_tools: locale === "en" ? "approved" : "missing",
          layer3_homepage: locale === "en" || locale === "ur" ? "approved" : "missing",
          layer4_seo: locale === "en" ? "approved" : "missing",
        },
        pages: {},
      };
      writeJson(statusPath, status);
    }
  }

  const layer1Count = Object.keys(flattenJson(layer1)).length;
  const homeCount = Object.keys(flattenJson(homepageEn)).length;
  const toolsCount = Object.keys(flattenJson(toolsMod.TOOL_LANDING_COPY)).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        extracted: {
          layer1_ui: layer1Count,
          homepage: homeCount,
          tools: toolsCount,
          seo_registry_keys: Object.keys(seoCatalog.registry as object).length,
        },
        contentDir: CONTENT_DIR,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
