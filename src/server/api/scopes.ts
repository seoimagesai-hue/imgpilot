/**
 * Prompt 25 — fixed public API scope allow-list.
 * Scopes are never client-invented; only these exact strings are valid.
 */
export const ALL_API_SCOPES = [
  "projects:read",
  "projects:write",
  "images:read",
  "images:upload",
  "images:process",
  "metadata:read",
  "metadata:generate",
  "metadata:write",
  "metadata:approve",
  "exports:read",
  "exports:create",
  "analytics:read",
  "workflows:read",
  "workflows:write",
  "workflows:run",
] as const;

export type ApiScope = (typeof ALL_API_SCOPES)[number];

const SCOPE_SET: ReadonlySet<string> = new Set(ALL_API_SCOPES);

export function isValidScope(value: string): value is ApiScope {
  return SCOPE_SET.has(value);
}

/**
 * Parse + de-duplicate a list of requested scopes.
 * Throws is intentionally avoided here — caller decides how to surface invalid scopes.
 */
export function parseScopes(input: unknown): {valid: ApiScope[]; invalid: string[]} {
  const raw = Array.isArray(input) ? input : [];
  const valid: ApiScope[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") {
      invalid.push(String(item));
      continue;
    }
    const trimmed = item.trim();
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    if (isValidScope(trimmed)) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  }
  return {valid, invalid};
}

export function hasScope(grantedScopes: readonly string[], required: ApiScope): boolean {
  return grantedScopes.includes(required);
}

export function hasAnyScope(grantedScopes: readonly string[], required: readonly ApiScope[]): boolean {
  return required.some((scope) => grantedScopes.includes(scope));
}
