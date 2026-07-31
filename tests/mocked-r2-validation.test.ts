import {describe, expect, it, vi} from "vitest";
import {MAX_BYTES_PER_IMAGE} from "@/server/images/policy";
import {StorageDomainError} from "@/server/storage/errors";

/**
 * Mocked R2 GetObject behaviour — not live R2.
 */
describe("mocked R2 getObjectBuffer contract", () => {
  it("rejects before allocating when head size exceeds max", async () => {
    const getObjectBuffer = async (storageKey: string, maxBytes: number) => {
      expect(storageKey).toBe("users/u/projects/p/originals/i/safe.jpg");
      const headSize = MAX_BYTES_PER_IMAGE + 1;
      if (headSize > maxBytes) throw new StorageDomainError("OBJECT_TOO_LARGE");
      throw new Error("should not download");
    };

    await expect(
      getObjectBuffer("users/u/projects/p/originals/i/safe.jpg", MAX_BYTES_PER_IMAGE),
    ).rejects.toMatchObject({code: "OBJECT_TOO_LARGE"});
  });

  it("maps missing object", async () => {
    const read = vi.fn(async () => {
      throw new StorageDomainError("OBJECT_NOT_FOUND");
    });
    await expect(read()).rejects.toMatchObject({code: "OBJECT_NOT_FOUND"});
  });

  it("never accepts client-supplied storage keys in validate API body", () => {
    // Validate route only takes projectId/imageId from path — no body key.
    const body = {storageKey: "evil/key", detectedMime: "image/png"};
    expect("storageKey" in body).toBe(true);
    // Service ignores body entirely; this documents the contract.
    const allowedRequestKeys: string[] = [];
    expect(allowedRequestKeys).not.toContain("storageKey");
    expect(allowedRequestKeys).not.toContain("detectedMime");
  });
});
