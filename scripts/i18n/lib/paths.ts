/**
 * Shared i18n pipeline helpers (CLI-only).
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";

export const REPO_ROOT = path.resolve(__dirname, "../../..");
export const MESSAGES_DIR = path.join(REPO_ROOT, "src/messages");
export const CONTENT_DIR = path.join(REPO_ROOT, "src/content/locales");
export const STATUS_DIR = path.join(CONTENT_DIR, "_status");
export const REPORTS_DIR = path.join(REPO_ROOT, "reports/i18n");
export const GLOSSARY_PATH = path.join(REPO_ROOT, "src/i18n/glossary.json");
export const MEMORY_PATH = path.join(REPO_ROOT, "src/i18n/translation-memory.json");

export const LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "sv",
  "tr",
  "ru",
  "uk",
  "ja",
  "ko",
  "th",
  "id",
  "ms",
  "vi",
  "hi",
  "ar",
  "el",
  "bg",
  "sw",
  "ca",
  "ur",
] as const;

export type LocaleCode = (typeof LOCALES)[number];

export const WAVE: Record<"1" | "2" | "3" | "4", LocaleCode[]> = {
  "1": ["es", "fr", "de", "pt", "ar"],
  "2": ["it", "nl", "pl", "tr", "ru", "ja", "ko"],
  "3": ["uk", "sv", "el", "bg", "ca", "hi", "ur"],
  "4": ["th", "id", "ms", "vi", "sw"],
};

export type TranslationStatus =
  | "missing"
  | "machine_translated"
  | "reviewed"
  | "approved"
  | "stale"
  | "english_fallback";

export type LocaleStatusFile = {
  locale: string;
  updatedAt: string;
  layers: {
    layer1_ui: TranslationStatus;
    layer2_tools: TranslationStatus;
    layer3_homepage: TranslationStatus;
    layer4_seo: TranslationStatus;
  };
  /** Path → status for indexability decisions */
  pages: Record<string, TranslationStatus>;
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {...base};
  for (const [key, value] of Object.entries(overlay)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key] as Record<string, unknown>, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function encodeSegment(key: string): string {
  return key.replace(/~/g, "~0").replace(/\./g, "~1").replace(/\//g, "~2");
}

function decodeSegment(key: string): string {
  return key.replace(/~2/g, "/").replace(/~1/g, ".").replace(/~0/g, "~");
}

export {encodeSegment, decodeSegment};

export function flattenJson(
  value: unknown,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  if (typeof value === "string") {
    out[prefix] = value;
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenJson(item, prefix ? `${prefix}.${index}` : String(index), out);
    });
    return out;
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const seg = encodeSegment(key);
      flattenJson(child, prefix ? `${prefix}.${seg}` : seg, out);
    }
  }
  return out;
}

export function unflattenJson(flat: Record<string, string>): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".").map(decodeSegment);
    let cursor: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const next = parts[i + 1]!;
      const nextIsIndex = /^\d+$/.test(next);
      if (!(part in cursor)) {
        cursor[part] = nextIsIndex ? [] : {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    const leaf = parts[parts.length - 1]!;
    if (Array.isArray(cursor)) {
      (cursor as unknown as string[])[Number(leaf)] = value;
    } else {
      cursor[leaf] = value;
    }
  }
  return root;
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/** Extract ICU / simple `{var}` placeholders from a string. */
export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) {
    found.add(match[1]!);
  }
  return [...found].sort();
}

export function placeholdersMatch(source: string, target: string): boolean {
  const a = extractPlaceholders(source).join(",");
  const b = extractPlaceholders(target).join(",");
  return a === b;
}

export function sha1(text: string): string {
  return createHash("sha1").update(text, "utf8").digest("hex");
}
