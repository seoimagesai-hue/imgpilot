import {describe, expect, it} from "vitest";
import {
  evaluateReadyEligibility,
  isPreviewableStatus,
  isReadyStatus,
  READY_STATUS,
} from "@/server/images/ready-eligibility";
import {
  DELETABLE_STATUSES,
  REPLACEABLE_STATUSES,
  isDeletableStatus,
  isReplaceableStatus,
} from "@/server/images/lifecycle-errors";
import {isEligibleForFutureProcessingReview} from "@/server/images/processing-eligibility";
import {parseLibraryQuery} from "@/server/images/library-query";

function baseImage(overrides: Partial<Parameters<typeof evaluateReadyEligibility>[0]> = {}) {
  return {
    status: "validated" as const,
    deletedAt: null,
    storageKey: "users/u/projects/p/images/i/originals/a.jpg",
    storageSizeBytes: 1200,
    sizeBytes: 1200,
    width: 32,
    height: 32,
    detectedMimeType: "image/jpeg",
    validatedAt: new Date(),
    validationVersion: "image-validation-v1",
    failureCode: null,
    hasOpenReplacement: false,
    projectExists: true,
    ownerExists: true,
    quotaInconsistency: false,
    ...overrides,
  };
}

describe("ready eligibility", () => {
  it("allows validated images with trusted metadata and storage", () => {
    expect(evaluateReadyEligibility(baseImage())).toEqual({eligible: true});
  });

  it("rejects validation_failed", () => {
    const result = evaluateReadyEligibility(baseImage({status: "validation_failed"}));
    expect(result.eligible).toBe(false);
  });

  it("rejects open replacement", () => {
    const result = evaluateReadyEligibility(baseImage({hasOpenReplacement: true}));
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe("open_replacement");
  });

  it("rejects soft-deleted", () => {
    const result = evaluateReadyEligibility(baseImage({deletedAt: new Date()}));
    expect(result.eligible).toBe(false);
  });

  it("rejects deletion statuses", () => {
    const result = evaluateReadyEligibility(baseImage({status: "deletion_pending"}));
    expect(result.eligible).toBe(false);
  });

  it("rejects missing metadata", () => {
    const result = evaluateReadyEligibility(baseImage({width: null, height: null}));
    expect(result.eligible).toBe(false);
  });

  it("rejects quota conflict failure code", () => {
    const result = evaluateReadyEligibility(
      baseImage({failureCode: "UPLOAD_REJECTED_BY_QUOTA"}),
    );
    expect(result.eligible).toBe(false);
  });

  it("rejects orphaned project/owner", () => {
    expect(evaluateReadyEligibility(baseImage({projectExists: false})).eligible).toBe(false);
    expect(evaluateReadyEligibility(baseImage({ownerExists: false})).eligible).toBe(false);
  });
});

describe("ready status helpers", () => {
  it("READY_STATUS constant", () => {
    expect(READY_STATUS).toBe("ready_for_processing");
    expect(isReadyStatus(READY_STATUS)).toBe(true);
    expect(isPreviewableStatus(READY_STATUS)).toBe(true);
    expect(isPreviewableStatus("validated")).toBe(true);
    expect(isPreviewableStatus("uploaded")).toBe(false);
  });

  it("processing eligibility requires Ready, not merely validated", () => {
    expect(isEligibleForFutureProcessingReview({status: "validated", isAnimated: false})).toBe(
      false,
    );
    expect(
      isEligibleForFutureProcessingReview({status: "ready_for_processing", isAnimated: false}),
    ).toBe(true);
  });

  it("ready is deletable and replaceable", () => {
    expect(isDeletableStatus("ready_for_processing")).toBe(true);
    expect(isReplaceableStatus("ready_for_processing")).toBe(true);
    expect(DELETABLE_STATUSES).toContain("ready_for_processing");
    expect(REPLACEABLE_STATUSES).toContain("ready_for_processing");
  });
});

describe("library ready default filter", () => {
  it("defaults to ready_for_processing", () => {
    expect(parseLibraryQuery({}).status).toBe("ready_for_processing");
    expect(parseLibraryQuery({status: "hack"}).status).toBe("ready_for_processing");
  });
});
