/**
 * Short-lived cache of a just-confirmed guest original.
 * Confirm already downloaded the bytes; compress/resize would otherwise fetch R2 again.
 */
import type {ObjectBytesResult} from "@/server/storage/provider";
import {getObjectStorageProvider} from "@/server/storage/provider";

const TTL_MS = 3 * 60 * 1000;
const MAX_ENTRIES = 8;

type Entry = {
  value: ObjectBytesResult;
  expiresAt: number;
};

const cache = new Map<string, Entry>();

function prune(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export function rememberGuestSourceObject(result: ObjectBytesResult): void {
  const now = Date.now();
  prune(now);
  cache.delete(result.storageKey);
  cache.set(result.storageKey, {value: result, expiresAt: now + TTL_MS});
}

export async function getGuestSourceObject(
  storageKey: string,
  maxBytes: number,
): Promise<ObjectBytesResult> {
  const now = Date.now();
  const hit = cache.get(storageKey);
  if (hit && hit.expiresAt > now && hit.value.body.byteLength <= maxBytes) {
    return hit.value;
  }
  if (hit) cache.delete(storageKey);
  const storage = await getObjectStorageProvider();
  const fresh = await storage.getObjectBuffer(storageKey, maxBytes);
  rememberGuestSourceObject(fresh);
  return fresh;
}
