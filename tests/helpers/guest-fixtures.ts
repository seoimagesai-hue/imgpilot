import {createHmac} from "node:crypto";
import {
  assignGuestCohort,
  guestAssetExpiresAt,
  isGuestExpired,
  isGuestToolCode,
  GUEST_ASSET_TTL_MS,
} from "@/server/guest/guest-policy";
import {hashGuestToken, verifyGuestTokenHash} from "@/server/guest/token";
import {canTransitionGuestJob} from "@/server/guest/processing-policy";
import {isValidGuestStorageKeyShape} from "@/server/storage/keys";
import {buildGuestOriginalStorageKey, buildGuestOutputStorageKey} from "@/server/storage/keys";

export function makeRawGuestToken(seed = "test-token"): string {
  return Buffer.from(seed).toString("base64url").padEnd(43, "x").slice(0, 43);
}

export function hmacGuest(raw: string, secret = "x".repeat(32)): string {
  return createHmac("sha256", secret).update(raw, "utf8").digest("hex");
}

export {
  assignGuestCohort,
  guestAssetExpiresAt,
  isGuestExpired,
  isGuestToolCode,
  GUEST_ASSET_TTL_MS,
  hashGuestToken,
  verifyGuestTokenHash,
  canTransitionGuestJob,
  isValidGuestStorageKeyShape,
  buildGuestOriginalStorageKey,
  buildGuestOutputStorageKey,
};
