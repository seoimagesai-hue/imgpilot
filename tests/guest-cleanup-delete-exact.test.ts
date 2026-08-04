import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

const objectExists = vi.fn();
const deleteObject = vi.fn();

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    isR2Configured: () => true,
  };
});

vi.mock("@/server/storage/provider", () => ({
  getObjectStorageProvider: async () => ({
    name: "r2" as const,
    objectExists,
    deleteObject,
  }),
}));

import {deleteExactKey} from "@/server/guest/cleanup-service";

const SAMPLE_KEY =
  "guest/00000000-0000-4000-8000-000000000001/originals/11111111-1111-4111-8111-111111111111/photo.jpg";

describe("deleteExactKey post-delete confirmation", () => {
  beforeEach(() => {
    objectExists.mockReset();
    deleteObject.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires confirmed post-delete absence even after deleteObject succeeds", async () => {
    objectExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    deleteObject.mockResolvedValue(undefined);

    await expect(deleteExactKey(SAMPLE_KEY)).resolves.toBe("error");
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(objectExists).toHaveBeenCalledTimes(2);
  });

  it("returns absent when HeadObject confirms the object is gone after delete", async () => {
    objectExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    deleteObject.mockResolvedValue(undefined);

    await expect(deleteExactKey(SAMPLE_KEY)).resolves.toBe("absent");
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(objectExists).toHaveBeenCalledTimes(2);
  });

  it("returns absent when the object was already missing (no delete)", async () => {
    objectExists.mockResolvedValueOnce(false).mockResolvedValueOnce(false);

    await expect(deleteExactKey(SAMPLE_KEY)).resolves.toBe("absent");
    expect(deleteObject).not.toHaveBeenCalled();
    expect(objectExists).toHaveBeenCalledTimes(2);
  });
});
