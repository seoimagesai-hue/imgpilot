/**
 * npm run i18n:audit
 * Reports missing/stale/fallback/placeholder issues and writes reports/i18n/{locale}.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  CONTENT_DIR,
  LOCALES,
  MESSAGES_DIR,
  REPORTS_DIR,
  STATUS_DIR,
  WAVE,
  encodeSegment,
  exists,
  flattenJson,
  placeholdersMatch,
  readJson,
  writeJson,
  type LocaleStatusFile,
} from "./lib/paths";

type AuditIssue = {code: string; key?: string; detail?: string};

type LocaleReport = {
  locale: string;
  totals: {
    layer1Keys: number;
    layer1Missing: number;
    layer1EnglishFallback: number;
    toolsMissing: number;
    homepageMissing: number;
    seoMissing: number;
    placeholderFailures: number;
  };
  layers: LocaleStatusFile["layers"];
  indexablePages: string[];
  noindexPages: string[];
  issues: AuditIssue[];
  wave: string | null;
};

function waveOf(locale: string): string | null {
  for (const [w, list] of Object.entries(WAVE)) {
    if ((list as string[]).includes(locale)) return w;
  }
  return locale === "en" ? "source" : null;
}

function loadMergedLayer1Messages(locale: string): Record<string, unknown> {
  const enCore = readJson<Record<string, unknown>>(path.join(MESSAGES_DIR, "en.json"));
  const enGuest = readJson<Record<string, unknown>>(path.join(MESSAGES_DIR, "guest/en.json"));
  if (locale === "en") {
    return {
      chrome: enCore.chrome,
      common: enCore.common,
      navigation: enCore.navigation,
      language: enCore.language,
      errors: enCore.errors,
      guest: enGuest,
    };
  }
  const locCorePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const locGuestPath = path.join(MESSAGES_DIR, `guest/${locale}.json`);
  const locCore = exists(locCorePath) ? readJson<Record<string, unknown>>(locCorePath) : {};
  const locGuest = exists(locGuestPath) ? readJson<Record<string, unknown>>(locGuestPath) : {};
  // Audit against incomplete overlay without EN merge to detect English fallback in packs
  return {
    chrome: locCore.chrome || {},
    common: locCore.common || {},
    navigation: locCore.navigation || {},
    language: locCore.language || {},
    errors: locCore.errors || {},
    guest: locGuest,
  };
}

function isAllowedIdentical(enVal: string): boolean {
  const t = enVal.trim();
  if (
    /^(Img Pilot|JPG|JPEG|PNG|WebP|AVIF|EXIF|GPS|SEO|HTML|JSON|CSV|ZIP|CMS|Docs|Original|Zoom|Software|Blog|Online|Email|OK|URL|ID|API|FAQ|Menu|Docs|Format|Dimensions|Compression|Latitude|Longitude|Quality|Preview|Download|Upload|Cancel|Reset|Options|Actions|Status|Error|Warning|Info|Home|Privacy|Terms|Contact|About)$/i.test(
      t,
    )
  ) {
    return true;
  }
  // Placeholder / formula-only strings (e.g. "{seconds}s", "{before} → {after}")
  const stripped = t.replace(/\{[^}]+\}/g, "").replace(/[×→·\d\s:.\-_/\\%]/g, "");
  if (!/[A-Za-z]{4,}/.test(stripped)) return true;
  // Single-token cognates (Menu, Format, etc.) are often identical across languages
  if (!/\s/.test(t) && t.length <= 18) return true;
  return false;
}

function countMissing(
  enFlat: Record<string, string>,
  locFlat: Record<string, string>,
): {missing: string[]; englishFallback: string[]} {
  const missing: string[] = [];
  const englishFallback: string[] = [];
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (key.includes("nativeNames.")) continue;
    if (!(key in locFlat) || !String(locFlat[key] || "").trim()) {
      missing.push(key);
    } else if (locFlat[key] === enVal && /[A-Za-z]{4,}/.test(enVal) && !isAllowedIdentical(enVal)) {
      englishFallback.push(key);
    }
  }
  return {missing, englishFallback};
}

function catalogFlat(locale: string, name: string): Record<string, string> | null {
  const p = path.join(CONTENT_DIR, locale, `${name}.json`);
  if (!exists(p)) return null;
  return flattenJson(readJson(p));
}

function pageComplete(
  locale: string,
  requiredKeys: string[],
  flat: Record<string, string> | null,
  enFlat: Record<string, string>,
): boolean {
  if (!flat) return false;
  for (const key of requiredKeys) {
    const val = flat[key];
    if (!val || !val.trim()) return false;
    const enVal = enFlat[key] || "";
    if (val === enVal && /[A-Za-z]{8,}/.test(enVal) && !isAllowedIdentical(enVal)) return false;
  }
  return true;
}

async function main() {
  const enLayer1 = flattenJson(
    readJson(path.join(CONTENT_DIR, "en/layer1-ui.json")),
  );
  const enHome = catalogFlat("en", "homepage") || {};
  const enTools = catalogFlat("en", "tools") || {};
  const enSeo = catalogFlat("en", "seo-landings") || {};

  const summary: LocaleReport[] = [];
  fs.mkdirSync(REPORTS_DIR, {recursive: true});

  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const issues: AuditIssue[] = [];
    const locLayer1Raw = loadMergedLayer1Messages(locale);
    const locLayer1 = flattenJson(locLayer1Raw);
    const {missing: l1Missing, englishFallback: l1Fb} = countMissing(enLayer1, locLayer1);

    const locHome = catalogFlat(locale, "homepage");
    const locTools = catalogFlat(locale, "tools");
    const locSeo = catalogFlat(locale, "seo-landings");
    const homeMiss = locHome ? countMissing(enHome, locHome).missing : Object.keys(enHome);
    const toolsMiss = locTools ? countMissing(enTools, locTools).missing : Object.keys(enTools);
    const seoMiss = locSeo ? countMissing(enSeo, locSeo).missing : Object.keys(enSeo);

    let placeholderFailures = 0;
    const pairs: [Record<string, string>, Record<string, string> | null][] = [
      [enLayer1, locLayer1],
      [enHome, locHome],
      [enTools, locTools],
      [enSeo, locSeo],
    ];
    for (const [enF, locF] of pairs) {
      if (!locF) continue;
      for (const [key, enVal] of Object.entries(enF)) {
        const target = locF[key];
        if (target && !placeholdersMatch(enVal, target)) {
          placeholderFailures += 1;
          issues.push({code: "PLACEHOLDER_MISMATCH", key, detail: `${enVal} => ${target}`});
        }
      }
    }

    for (const key of l1Missing.slice(0, 50)) {
      issues.push({code: "LAYER1_MISSING", key});
    }
    for (const key of l1Fb.slice(0, 30)) {
      issues.push({code: "LAYER1_ENGLISH_FALLBACK", key});
    }

    const statusPath = path.join(STATUS_DIR, `${locale}.json`);
    const status: LocaleStatusFile = exists(statusPath)
      ? readJson(statusPath)
      : {
          locale,
          updatedAt: new Date().toISOString(),
          layers: {
            layer1_ui: "missing",
            layer2_tools: "missing",
            layer3_homepage: "missing",
            layer4_seo: "missing",
          },
          pages: {},
        };

    const layer1Ok = l1Missing.length === 0 && l1Fb.length < 20;
    status.layers.layer1_ui = layer1Ok
      ? status.layers.layer1_ui === "approved" || status.layers.layer1_ui === "reviewed"
        ? status.layers.layer1_ui
        : "machine_translated"
      : "missing";
    status.layers.layer3_homepage =
      homeMiss.length === 0
        ? status.layers.layer3_homepage === "approved"
          ? "approved"
          : "machine_translated"
        : "missing";
    status.layers.layer2_tools =
      toolsMiss.length === 0
        ? status.layers.layer2_tools === "approved"
          ? "approved"
          : "machine_translated"
        : "missing";
    status.layers.layer4_seo =
      seoMiss.length < Object.keys(enSeo).length * 0.15
        ? status.layers.layer4_seo === "approved"
          ? "approved"
          : "machine_translated"
        : "missing";
    status.updatedAt = new Date().toISOString();

    const indexablePages: string[] = [];
    const noindexPages: string[] = [];
    // tools.json is Record<path, copy> — paths are top-level keys before flatten
    const toolTopPaths = Object.keys(
      exists(path.join(CONTENT_DIR, "en/tools.json"))
        ? readJson<Record<string, unknown>>(path.join(CONTENT_DIR, "en/tools.json"))
        : {},
    );

    const canIndexUi = status.layers.layer1_ui !== "missing";
    if (
      canIndexUi &&
      status.layers.layer3_homepage !== "missing" &&
      pageComplete(locale, ["metaTitle", "metaDescription", "h1", "heroParagraph", "faqHeading"], locHome, enHome)
    ) {
      indexablePages.push("/");
      status.pages["/"] = status.layers.layer3_homepage;
    } else {
      noindexPages.push("/");
      status.pages["/"] = "missing";
    }

    for (const p of toolTopPaths) {
      const enc = encodeSegment(p);
      const req = [
        `${enc}.metaTitle`,
        `${enc}.metaDescription`,
        `${enc}.h1`,
        `${enc}.paragraph`,
        `${enc}.faqHeading`,
      ];
      if (canIndexUi && status.layers.layer2_tools !== "missing" && pageComplete(locale, req, locTools, enTools)) {
        indexablePages.push(p);
        status.pages[p] = status.layers.layer2_tools;
      } else {
        noindexPages.push(p);
        status.pages[p] = "missing";
      }
    }

    // SEO landing paths from registry
    const seoReg = exists(path.join(CONTENT_DIR, "en/seo-landings.json"))
      ? (readJson<{registry: Record<string, {slug: string}>}>(path.join(CONTENT_DIR, "en/seo-landings.json"))
          .registry || {})
      : {};
    for (const slug of Object.keys(seoReg)) {
      const route = `/${slug}`;
      const req = [
        `registry.${slug}.title`,
        `registry.${slug}.description`,
        `registry.${slug}.h1`,
        `registry.${slug}.intro`,
      ];
      if (canIndexUi && status.layers.layer4_seo !== "missing" && pageComplete(locale, req, locSeo, enSeo)) {
        indexablePages.push(route);
        status.pages[route] = status.layers.layer4_seo;
      } else {
        noindexPages.push(route);
        status.pages[route] = "missing";
      }
    }

    writeJson(statusPath, status);

    const report: LocaleReport = {
      locale,
      totals: {
        layer1Keys: Object.keys(enLayer1).length,
        layer1Missing: l1Missing.length,
        layer1EnglishFallback: l1Fb.length,
        toolsMissing: toolsMiss.length,
        homepageMissing: homeMiss.length,
        seoMissing: seoMiss.length,
        placeholderFailures,
      },
      layers: status.layers,
      indexablePages,
      noindexPages,
      issues: issues.slice(0, 200),
      wave: waveOf(locale),
    };
    writeJson(path.join(REPORTS_DIR, `${locale}.json`), report);
    summary.push(report);
  }

  writeJson(path.join(REPORTS_DIR, "_summary.json"), {
    generatedAt: new Date().toISOString(),
    locales: summary.map((s) => ({
      locale: s.locale,
      wave: s.wave,
      layers: s.layers,
      indexable: s.indexablePages.length,
      noindex: s.noindexPages.length,
      layer1Missing: s.totals.layer1Missing,
      homepageMissing: s.totals.homepageMissing,
      toolsMissing: s.totals.toolsMissing,
      placeholderFailures: s.totals.placeholderFailures,
    })),
  });

  const hardFail = summary.some(
    (s) => s.totals.placeholderFailures > 0 && WAVE["1"].includes(s.locale as never),
  );
  console.log(
    JSON.stringify(
      {
        ok: !hardFail,
        reports: REPORTS_DIR,
        localesAudited: summary.length,
        wave1IndexableAvg:
          WAVE["1"].reduce((n, loc) => {
            const r = summary.find((s) => s.locale === loc);
            return n + (r?.indexablePages.length || 0);
          }, 0) / WAVE["1"].length,
      },
      null,
      2,
    ),
  );
  if (hardFail) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
