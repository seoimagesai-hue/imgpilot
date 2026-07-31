/**
 * Future processing eligibility helpers.
 * Ready-for-processing is the Milestone 4 intake gate — not a queue claim.
 */
import type {Image} from "@/db/schema";
import {
  isPreviewableStatus,
  isReadyStatus,
  isValidatedOrReadyStatus,
} from "@/server/images/ready-eligibility";

export function isValidatedImage(image: Pick<Image, "status">): boolean {
  return isValidatedOrReadyStatus(image.status);
}

/** Eligible for later processing *intake* — not a processing queue claim. */
export function isEligibleForFutureProcessingReview(
  image: Pick<Image, "status" | "isAnimated">,
): boolean {
  return isReadyStatus(image.status);
}

export function mayGeneratePrivatePreview(image: Pick<Image, "status">): boolean {
  return isPreviewableStatus(image.status);
}
