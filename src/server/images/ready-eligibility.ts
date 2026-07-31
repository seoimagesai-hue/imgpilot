/**
 * Ready-for-processing eligibility — Milestone 3 closure gate.
 * Ready ≠ processing started. Ready ≠ validated alone.
 */
import type {Image} from "@/db/schema";
import {isDeletionUnavailableStatus} from "@/server/images/lifecycle-errors";

export const READY_STATUS = "ready_for_processing" as const;

/** Product-visible "good" statuses that may show private previews. */
export const PREVIEWABLE_STATUSES = ["validated", "ready_for_processing"] as const;

export type ReadyIneligibilityReason =
  | "wrong_status"
  | "soft_deleted"
  | "deletion_unavailable"
  | "missing_storage_key"
  | "missing_trusted_bytes"
  | "missing_trusted_metadata"
  | "validation_incomplete"
  | "open_replacement"
  | "quota_conflict"
  | "orphaned";

export type ReadyEligibilityInput = Pick<
  Image,
  | "status"
  | "deletedAt"
  | "storageKey"
  | "storageSizeBytes"
  | "sizeBytes"
  | "width"
  | "height"
  | "detectedMimeType"
  | "validatedAt"
  | "validationVersion"
  | "failureCode"
> & {
  hasOpenReplacement?: boolean;
  projectExists?: boolean;
  ownerExists?: boolean;
  quotaInconsistency?: boolean;
};

export function hasTrustedMetadata(image: ReadyEligibilityInput): boolean {
  return (
    image.validatedAt != null &&
    Boolean(image.validationVersion) &&
    image.width != null &&
    image.height != null &&
    Boolean(image.detectedMimeType)
  );
}

export function hasTrustedStorage(image: ReadyEligibilityInput): boolean {
  return Boolean(image.storageKey) && (image.storageSizeBytes ?? image.sizeBytes) > 0;
}

/**
 * Pure eligibility check. Server decides Ready — never trust browser flags.
 */
export function evaluateReadyEligibility(
  image: ReadyEligibilityInput,
): {eligible: true} | {eligible: false; reason: ReadyIneligibilityReason} {
  if (image.projectExists === false || image.ownerExists === false) {
    return {eligible: false, reason: "orphaned"};
  }
  if (image.deletedAt != null) {
    return {eligible: false, reason: "soft_deleted"};
  }
  if (isDeletionUnavailableStatus(image.status)) {
    return {eligible: false, reason: "deletion_unavailable"};
  }
  if (image.hasOpenReplacement) {
    return {eligible: false, reason: "open_replacement"};
  }
  if (image.quotaInconsistency) {
    return {eligible: false, reason: "quota_conflict"};
  }
  if (image.failureCode === "UPLOAD_REJECTED_BY_QUOTA") {
    return {eligible: false, reason: "quota_conflict"};
  }
  if (image.status !== "validated" && image.status !== READY_STATUS) {
    return {eligible: false, reason: "wrong_status"};
  }
  if (!hasTrustedStorage(image)) {
    return {eligible: false, reason: "missing_trusted_bytes"};
  }
  if (!image.storageKey) {
    return {eligible: false, reason: "missing_storage_key"};
  }
  if (!hasTrustedMetadata(image)) {
    return {eligible: false, reason: "missing_trusted_metadata"};
  }
  if (!image.validatedAt || !image.validationVersion) {
    return {eligible: false, reason: "validation_incomplete"};
  }
  return {eligible: true};
}

export function isReadyStatus(status: string): boolean {
  return status === READY_STATUS;
}

export function isPreviewableStatus(status: string): boolean {
  return (PREVIEWABLE_STATUSES as readonly string[]).includes(status);
}

export function isValidatedOrReadyStatus(status: string): boolean {
  return status === "validated" || status === READY_STATUS;
}
