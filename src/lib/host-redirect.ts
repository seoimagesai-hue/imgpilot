/** Strip a leading `www.` from the request host, if present. */
export function wwwToApexHostname(host: string): string | null {
  const normalized = host.toLowerCase();
  if (!normalized.startsWith("www.")) return null;
  return normalized.slice(4);
}
