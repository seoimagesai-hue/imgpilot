import {describe, expect, it} from "vitest";
import {
  DELETABLE_STATUSES,
  DELETION_UNAVAILABLE_STATUSES,
  LifecycleDomainError,
  OPEN_REPLACEMENT_STATUSES,
  REPLACEABLE_STATUSES,
  isDeletableStatus,
  isDeletionUnavailableStatus,
  isOpenReplacementStatus,
  isReplaceableStatus,
} from "@/server/images/lifecycle-errors";
import {
  assertOriginalStorageKeyOwned,
  buildOriginalStorageKey,
  buildReplacementStorageKey,
  isValidOriginalStorageKeyShape,
} from "@/server/storage/keys";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const replacementId = "33333333-3333-4333-8333-333333333333";

describe("lifecycle status policy", () => {
  it("isDeletionUnavailableStatus matches deletion-unavailable set", () => {
    for (const status of DELETION_UNAVAILABLE_STATUSES) {
      expect(isDeletionUnavailableStatus(status)).toBe(true);
    }
    expect(isDeletionUnavailableStatus("validated")).toBe(false);
    expect(isDeletionUnavailableStatus("pending_upload")).toBe(false);
    expect(isDeletionUnavailableStatus("")).toBe(false);
  });

  it("isDeletableStatus matches deletable set", () => {
    for (const status of DELETABLE_STATUSES) {
      expect(isDeletableStatus(status)).toBe(true);
    }
    expect(isDeletableStatus("deleted")).toBe(false);
    expect(isDeletableStatus("deletion_pending")).toBe(false);
    expect(isDeletableStatus("storage_deleting")).toBe(false);
  });

  it("isReplaceableStatus allows validated, ready, and validation_failed", () => {
    for (const status of REPLACEABLE_STATUSES) {
      expect(isReplaceableStatus(status)).toBe(true);
    }
    expect(isReplaceableStatus("uploaded")).toBe(false);
    expect(isReplaceableStatus("pending_upload")).toBe(false);
    expect(isReplaceableStatus("deleted")).toBe(false);
    expect(isReplaceableStatus("ready_for_processing")).toBe(true);
  });

  it("isOpenReplacementStatus matches open replacement set", () => {
    for (const status of OPEN_REPLACEMENT_STATUSES) {
      expect(isOpenReplacementStatus(status)).toBe(true);
    }
    expect(isOpenReplacementStatus("complete")).toBe(false);
    expect(isOpenReplacementStatus("cancelled")).toBe(false);
    expect(isOpenReplacementStatus("promoted")).toBe(false);
  });

  it("deletable and deletion-unavailable sets do not overlap", () => {
    const overlap = DELETABLE_STATUSES.filter((s) =>
      (DELETION_UNAVAILABLE_STATUSES as readonly string[]).includes(s),
    );
    expect(overlap).toEqual([]);
  });

  it("LifecycleDomainError carries safe code", () => {
    const err = new LifecycleDomainError("IMAGE_NOT_DELETABLE");
    expect(err.code).toBe("IMAGE_NOT_DELETABLE");
    expect(err.name).toBe("LifecycleDomainError");
    expect(err.message).toBe("IMAGE_NOT_DELETABLE");
  });
});

describe("replacement storage keys", () => {
  it("buildReplacementStorageKey shares imageId prefix with buildOriginalStorageKey", () => {
    const suffix = "photo.jpg";
    const original = buildOriginalStorageKey({userId, projectId, imageId, safeFilenameSuffix: suffix});
    const replacement = buildReplacementStorageKey({
      userId,
      projectId,
      imageId,
      replacementId,
      safeFilenameSuffix: suffix,
    });

    const expectedPrefix = `users/${userId}/projects/${projectId}/originals/${imageId}/`;
    expect(original.startsWith(expectedPrefix)).toBe(true);
    expect(replacement.startsWith(expectedPrefix)).toBe(true);
    expect(replacement).not.toBe(original);
    expect(replacement).toContain(`r-${replacementId}-`);
  });

  it("buildReplacementStorageKey differs across replacement ids", () => {
    const a = buildReplacementStorageKey({
      userId,
      projectId,
      imageId,
      replacementId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      safeFilenameSuffix: "a.jpg",
    });
    const b = buildReplacementStorageKey({
      userId,
      projectId,
      imageId,
      replacementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      safeFilenameSuffix: "a.jpg",
    });
    expect(a).not.toBe(b);
    expect(a.startsWith(`users/${userId}/projects/${projectId}/originals/${imageId}/`)).toBe(true);
    expect(b.startsWith(`users/${userId}/projects/${projectId}/originals/${imageId}/`)).toBe(true);
  });

  it("assertOriginalStorageKeyOwned accepts replacement-style keys under originals/{imageId}/", () => {
    const replacementKey = buildReplacementStorageKey({
      userId,
      projectId,
      imageId,
      replacementId,
      safeFilenameSuffix: "new-photo.jpg",
    });
    expect(
      assertOriginalStorageKeyOwned({storageKey: replacementKey, userId, projectId, imageId}),
    ).toBe(true);
    expect(isValidOriginalStorageKeyShape(replacementKey)).toBe(true);
  });

  it("assertOriginalStorageKeyOwned rejects wrong owner prefix and traversal", () => {
    const key = buildOriginalStorageKey({
      userId,
      projectId,
      imageId,
      safeFilenameSuffix: "photo.jpg",
    });
    expect(
      assertOriginalStorageKeyOwned({
        storageKey: key,
        userId: "other-user",
        projectId,
        imageId,
      }),
    ).toBe(false);
    expect(
      assertOriginalStorageKeyOwned({
        storageKey: key.replace("/originals/", "/../originals/"),
        userId,
        projectId,
        imageId,
      }),
    ).toBe(false);
  });
});
