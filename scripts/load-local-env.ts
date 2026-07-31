import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";

/**
 * Load KEY=VALUE pairs from local env files into process.env when unset/empty.
 * Never logs values. Intended for CLI scripts and drizzle-kit only.
 */
export function loadLocalEnvFiles(cwd = process.cwd()): void {
  for (const fileName of [".env.local", ".env"]) {
    const fullPath = resolve(cwd, fileName);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separator = line.indexOf("=");
      if (separator <= 0) continue;

      const key = line.slice(0, separator).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      const existing = process.env[key];
      if (existing === undefined || existing.trim() === "") {
        process.env[key] = value;
      }
    }
  }
}

/** Presence-only summary for diagnostics. Never returns secret values. */
export function summarizeDatabaseUrlPresence(): {
  present: boolean;
  length: number;
  hasSslModeHint: boolean;
  providerGuess: "neon" | "supabase" | "unknown" | "absent";
} {
  const raw = process.env.DATABASE_URL?.trim() ?? "";
  if (!raw) {
    return {present: false, length: 0, hasSslModeHint: false, providerGuess: "absent"};
  }

  const lower = raw.toLowerCase();
  let providerGuess: "neon" | "supabase" | "unknown" = "unknown";
  if (lower.includes("neon.tech") || lower.includes("neon.")) providerGuess = "neon";
  else if (lower.includes("supabase.co") || lower.includes("supabase.com")) providerGuess = "supabase";

  return {
    present: true,
    length: raw.length,
    hasSslModeHint: lower.includes("sslmode=") || lower.includes("ssl=true"),
    providerGuess,
  };
}
