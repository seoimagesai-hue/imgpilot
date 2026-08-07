/**
 * npm run i18n:translate -- --locale=es
 * npm run i18n:translate -- --all
 * npm run i18n:translate -- --locale=fr --dry-run
 * npm run i18n:translate -- --locale=es --force  (overwrite reviewed)
 */
import path from "node:path";
import {resolveProvider} from "./lib/providers";
import {
  CONTENT_DIR,
  GLOSSARY_PATH,
  LOCALES,
  MEMORY_PATH,
  MESSAGES_DIR,
  STATUS_DIR,
  deepMerge,
  exists,
  flattenJson,
  placeholdersMatch,
  readJson,
  sha1,
  unflattenJson,
  writeJson,
  type LocaleCode,
  type LocaleStatusFile,
} from "./lib/paths";

type MemoryEntry = {
  locale: string;
  sourceHash: string;
  source: string;
  target: string;
  status: "machine_translated" | "reviewed" | "approved";
  updatedAt: string;
};

type MemoryFile = {version: number; entries: MemoryEntry[]};

function parseArgs(argv: string[]) {
  const out = {
    locale: "" as string,
    all: false,
    dryRun: false,
    force: false,
    layer: "all" as "all" | "layer1" | "homepage" | "tools" | "seo",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--all") out.all = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("--locale=")) out.locale = a.slice("--locale=".length);
    else if (a === "--locale") out.locale = argv[++i] || "";
    else if (a.startsWith("--layer=")) out.layer = a.slice("--layer=".length) as typeof out.layer;
  }
  return out;
}

function applyGlossary(text: string, locale: string): string {
  const glossary = readJson<{
    preferred: Record<string, Record<string, string>>;
  }>(GLOSSARY_PATH);
  let out = text;
  for (const [term, byLocale] of Object.entries(glossary.preferred || {})) {
    const preferred = byLocale[locale];
    if (preferred) {
      out = out.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), preferred);
    }
  }
  return out;
}

function loadMemory(): MemoryFile {
  if (!exists(MEMORY_PATH)) return {version: 1, entries: []};
  return readJson(MEMORY_PATH);
}

function saveMemory(mem: MemoryFile) {
  writeJson(MEMORY_PATH, mem);
}

function memoryLookup(mem: MemoryFile, locale: string, source: string): string | null {
  const hash = sha1(source);
  const hit = mem.entries.find((e) => e.locale === locale && e.sourceHash === hash);
  return hit?.target || null;
}

function memoryPut(
  mem: MemoryFile,
  locale: string,
  source: string,
  target: string,
  status: MemoryEntry["status"],
) {
  const hash = sha1(source);
  const idx = mem.entries.findIndex((e) => e.locale === locale && e.sourceHash === hash);
  const entry: MemoryEntry = {
    locale,
    sourceHash: hash,
    source,
    target,
    status,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) mem.entries[idx] = entry;
  else mem.entries.push(entry);
}

/** Skip re-translating stable native language names and brand tokens. */
function shouldCopySource(key: string, source: string): boolean {
  if (key.includes("nativeNames.")) return true;
  if (
    /^(Img Pilot|JPG|JPEG|PNG|WebP|AVIF|EXIF|GPS|SEO|HTML|JSON|CSV|ZIP|CMS|Docs|R2)$/i.test(
      source.trim(),
    )
  ) {
    return true;
  }
  return false;
}

async function translateFlat(
  locale: string,
  enFlat: Record<string, string>,
  existingFlat: Record<string, string>,
  opts: {dryRun: boolean; force: boolean},
): Promise<Record<string, string>> {
  const provider = resolveProvider();
  const mem = loadMemory();
  const result = {...existingFlat};
  const toTranslate: {key: string; source: string}[] = [];

  for (const [key, source] of Object.entries(enFlat)) {
    const current = existingFlat[key];
    if (shouldCopySource(key, source)) {
      result[key] = current && current.trim() && !opts.force ? current : source;
      continue;
    }
    const memHit = memoryLookup(mem, locale, source);
    if (memHit && (!current || current === source || opts.force)) {
      result[key] = memHit;
      continue;
    }
    if (current && current.trim() && current !== source && !opts.force) {
      continue;
    }
    toTranslate.push({key, source});
  }

  if (toTranslate.length === 0) return result;

  const uniqueSources = [...new Set(toTranslate.map((u) => u.source))];
  const sourceToTarget = new Map<string, string>();

  if (!provider.configured || opts.dryRun) {
    console.log(
      JSON.stringify({
        status: provider.configured ? "dry-run" : "Blocked",
        locale,
        wouldTranslate: toTranslate.length,
        uniqueSources: uniqueSources.length,
        provider: provider.id,
      }),
    );
    if (!provider.configured && !opts.dryRun) {
      throw new Error(`Blocked: translation provider not configured (${provider.id})`);
    }
    return result;
  }

  const batchSize = provider.id === "gtx-public" ? 24 : 40;
  for (let i = 0; i < uniqueSources.length; i += batchSize) {
    const slice = uniqueSources.slice(i, i + batchSize);
    const translated = await provider.translateBatch({
      locale,
      units: slice.map((source) => ({key: sha1(source), source})),
    });
    for (const unit of translated.units) {
      if (!placeholdersMatch(unit.source, unit.target)) {
        console.warn(`placeholder mismatch skipped: ${unit.source.slice(0, 60)}`);
        continue;
      }
      const target = applyGlossary(unit.target, locale);
      sourceToTarget.set(unit.source, target);
      memoryPut(mem, locale, unit.source, target, "machine_translated");
    }
    console.log(
      JSON.stringify({
        locale,
        progress: `${Math.min(i + batchSize, uniqueSources.length)}/${uniqueSources.length}`,
        provider: provider.id,
      }),
    );
  }

  for (const {key, source} of toTranslate) {
    const target = sourceToTarget.get(source);
    if (target) result[key] = target;
  }

  if (!opts.dryRun) saveMemory(mem);
  return result;
}

async function translateLocale(locale: LocaleCode, opts: ReturnType<typeof parseArgs>) {
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

  if (opts.layer === "all" || opts.layer === "layer1") {
    const en = flattenJson(readJson(path.join(CONTENT_DIR, "en/layer1-ui.json")));
    const guestPath = path.join(MESSAGES_DIR, `guest/${locale}.json`);
    const corePath = path.join(MESSAGES_DIR, `${locale}.json`);

    const enGuest: Record<string, string> = {};
    const enCore: Record<string, string> = {};
    for (const [k, v] of Object.entries(en)) {
      if (k.startsWith("guest.")) enGuest[k.slice("guest.".length)] = v;
      else enCore[k] = v;
    }

    const existingGuest = exists(guestPath) ? flattenJson(readJson(guestPath)) : {};
    const existingCoreRaw = exists(corePath) ? readJson<Record<string, unknown>>(corePath) : {};
    const existingCore = flattenJson({
      chrome: (existingCoreRaw as {chrome?: unknown}).chrome || {},
      common: (existingCoreRaw as {common?: unknown}).common || {},
      navigation: (existingCoreRaw as {navigation?: unknown}).navigation || {},
      language: (existingCoreRaw as {language?: unknown}).language || {},
      errors: (existingCoreRaw as {errors?: unknown}).errors || {},
    });

    const translatedGuest = await translateFlat(locale, enGuest, existingGuest, opts);
    const translatedCore = await translateFlat(locale, enCore, existingCore, opts);
    if (!opts.dryRun) {
      writeJson(guestPath, unflattenJson(translatedGuest));
      const coreTree = unflattenJson(translatedCore);
      const mergedCore = deepMerge(existingCoreRaw, coreTree);
      writeJson(corePath, mergedCore);
      writeJson(path.join(CONTENT_DIR, locale, "layer1-ui.json"), {
        ...coreTree,
        guest: unflattenJson(translatedGuest),
      });
    }
    status.layers.layer1_ui = "machine_translated";
  }

  if (opts.layer === "all" || opts.layer === "homepage") {
    const en = flattenJson(readJson(path.join(CONTENT_DIR, "en/homepage.json")));
    const outPath = path.join(CONTENT_DIR, locale, "homepage.json");
    const existing = exists(outPath) ? flattenJson(readJson(outPath)) : {};
    const translated = await translateFlat(locale, en, existing, opts);
    if (!opts.dryRun) {
      writeJson(outPath, unflattenJson(translated));
      status.layers.layer3_homepage = "machine_translated";
    }
  }

  if (opts.layer === "all" || opts.layer === "tools") {
    const en = flattenJson(readJson(path.join(CONTENT_DIR, "en/tools.json")));
    const outPath = path.join(CONTENT_DIR, locale, "tools.json");
    const existing = exists(outPath) ? flattenJson(readJson(outPath)) : {};
    const translated = await translateFlat(locale, en, existing, opts);
    if (!opts.dryRun) {
      writeJson(outPath, unflattenJson(translated));
      status.layers.layer2_tools = "machine_translated";
    }
  }

  if (opts.layer === "all" || opts.layer === "seo") {
    const en = flattenJson(readJson(path.join(CONTENT_DIR, "en/seo-landings.json")));
    const outPath = path.join(CONTENT_DIR, locale, "seo-landings.json");
    const existing = exists(outPath) ? flattenJson(readJson(outPath)) : {};
    const translated = await translateFlat(locale, en, existing, opts);
    if (!opts.dryRun) {
      writeJson(outPath, unflattenJson(translated));
      status.layers.layer4_seo = "machine_translated";
    }
  }

  if (!opts.dryRun) {
    status.updatedAt = new Date().toISOString();
    writeJson(statusPath, status);
  }
  console.log(JSON.stringify({ok: true, locale, dryRun: opts.dryRun}, null, 2));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const targets = opts.all
    ? LOCALES.filter((l) => l !== "en")
    : opts.locale
      ? [opts.locale as LocaleCode]
      : [];
  if (targets.length === 0) {
    console.error("Usage: npm run i18n:translate -- --locale=es | --all [--dry-run] [--force]");
    process.exit(1);
  }
  for (const locale of targets) {
    if (!LOCALES.includes(locale as LocaleCode)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }
    await translateLocale(locale as LocaleCode, opts);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
