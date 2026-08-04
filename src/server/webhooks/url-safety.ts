/**
 * Prompt 25 — SSRF defenses for outbound webhook URLs.
 * Applied both when a caller registers/updates an endpoint and again,
 * re-resolving DNS, immediately before every delivery attempt (DNS rebinding
 * protection — an endpoint could point somewhere safe at registration time
 * and be repointed at an internal address later).
 */
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {ApiError} from "@/server/api/errors";

const ALLOWED_PROTOCOL = "https:";
const ALLOWED_PORT = "443";

function unsafe(reason: string): never {
  throw new ApiError("WEBHOOK_URL_UNSAFE", `Webhook URL is not allowed: ${reason}`);
}

function ipv4ToInt(parts: number[]): number {
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    nums.push(n);
  }
  return nums;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = parseIPv4(ip);
  if (!parts) return true; // fail closed
  const int = ipv4ToInt(parts);
  const inRange = (base: string, maskBits: number): boolean => {
    const baseParts = parseIPv4(base);
    if (!baseParts) return false;
    const baseInt = ipv4ToInt(baseParts);
    const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
    return (int & mask) === (baseInt & mask);
  };
  return (
    inRange("0.0.0.0", 8) || // "this" network
    inRange("10.0.0.0", 8) || // private
    inRange("100.64.0.0", 10) || // shared/CGNAT
    inRange("127.0.0.0", 8) || // loopback
    inRange("169.254.0.0", 16) || // link-local (incl. cloud metadata 169.254.169.254)
    inRange("172.16.0.0", 12) || // private
    inRange("192.0.0.0", 24) || // IETF protocol assignments
    inRange("192.0.2.0", 24) || // TEST-NET-1
    inRange("192.168.0.0", 16) || // private
    inRange("198.18.0.0", 15) || // benchmarking
    inRange("198.51.100.0", 24) || // TEST-NET-2
    inRange("203.0.113.0", 24) || // TEST-NET-3
    inRange("224.0.0.0", 4) || // multicast
    inRange("240.0.0.0", 4) // reserved / broadcast
  );
}

/** Expand a (possibly shorthand) IPv6 address into 8 16-bit groups. */
function parseIPv6Groups(ip: string): number[] | null {
  let addr = ip;
  // Embedded IPv4, e.g. ::ffff:192.168.1.1
  const v4Match = /^(.*:)([0-9]{1,3}(?:\.[0-9]{1,3}){3})$/.exec(addr);
  if (v4Match) {
    const v4 = parseIPv4(v4Match[2]);
    if (!v4) return null;
    const hex1 = ((v4[0] << 8) | v4[1]).toString(16);
    const hex2 = ((v4[2] << 8) | v4[3]).toString(16);
    addr = `${v4Match[1]}${hex1}:${hex2}`;
  }

  const [head, tail] = addr.split("::");
  const headGroups = head ? head.split(":").filter((g) => g.length > 0) : [];
  const tailGroups = tail !== undefined && tail.length > 0 ? tail.split(":") : [];

  if (addr.includes("::")) {
    const missing = 8 - headGroups.length - tailGroups.length;
    if (missing < 0) return null;
    const groups = [
      ...headGroups,
      ...Array(missing).fill("0"),
      ...tailGroups,
    ];
    if (groups.length !== 8) return null;
    return groups.map((g) => parseInt(g || "0", 16));
  }

  const groups = addr.split(":");
  if (groups.length !== 8) return null;
  return groups.map((g) => parseInt(g || "0", 16));
}

function isPrivateIPv6(ip: string): boolean {
  const groups = parseIPv6Groups(ip);
  if (!groups || groups.some((g) => Number.isNaN(g))) return true; // fail closed

  const [g0] = groups;
  const isAllZero = groups.every((g) => g === 0);
  const isLoopback = groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1;

  // IPv4-mapped (::ffff:0:0/96) — validate the embedded IPv4 too.
  if (groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0xffff) {
    const v4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    return isPrivateIPv4(v4);
  }

  return (
    isAllZero || // ::
    isLoopback || // ::1
    (g0 & 0xffc0) === 0xfe80 || // fe80::/10 link-local
    (g0 & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    g0 === 0xff00 // multicast ff00::/8 (approximation of ff00::/8 top byte)
  );
}

function isPrivateOrDisallowedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // unknown / unparsable — fail closed
}

const LOCAL_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

/**
 * Validate a webhook URL is HTTPS, on the default port, has no embedded
 * credentials/fragment, and does not resolve to any internal/private/
 * metadata address. Call this again immediately before delivery, not just
 * at registration time.
 */
export async function assertSafeWebhookUrl(urlString: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    unsafe("not a valid URL");
  }

  if (url.protocol !== ALLOWED_PROTOCOL) {
    unsafe("only https:// URLs are allowed");
  }
  if (url.username || url.password) {
    unsafe("URL must not contain credentials");
  }
  if (url.hash) {
    unsafe("URL must not contain a fragment");
  }
  const port = url.port || ALLOWED_PORT;
  if (port !== ALLOWED_PORT) {
    unsafe("only port 443 is allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    unsafe("URL is missing a hostname");
  }
  if (LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    unsafe("localhost is not allowed");
  }

  // Literal IP in the URL — validate directly, no DNS lookup needed.
  const literalVersion = isIP(hostname);
  if (literalVersion) {
    if (isPrivateOrDisallowedIp(hostname)) {
      unsafe("URL resolves to a private/internal IP address");
    }
    return;
  }

  let addresses: {address: string; family: number}[];
  try {
    addresses = await lookup(hostname, {all: true, verbatim: true});
  } catch {
    throw new ApiError("WEBHOOK_URL_UNREACHABLE", "Webhook hostname could not be resolved.");
  }
  if (addresses.length === 0) {
    throw new ApiError("WEBHOOK_URL_UNREACHABLE", "Webhook hostname did not resolve to any address.");
  }
  for (const {address} of addresses) {
    if (isPrivateOrDisallowedIp(address)) {
      unsafe("URL resolves to a private/internal IP address");
    }
  }
}
