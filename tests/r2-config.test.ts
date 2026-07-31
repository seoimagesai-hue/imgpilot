import {describe, expect, it} from "vitest";
import {
  R2_TTL_DEFAULT_SECONDS,
  R2_TTL_MAX_SECONDS,
  R2_TTL_MIN_SECONDS,
  assertCompleteOrEmptyR2Config,
  countSetR2Fields,
  parseSignedUrlTtlSeconds,
} from "../src/server/storage/errors";
import {buildOriginalStorageKey, isValidOriginalStorageKeyShape} from "../src/server/storage/keys";
import {mapWithConcurrency} from "../src/lib/direct-upload";
import {storageKeySchema, parseImageStatusFilter} from "../src/server/images/validation";

describe("R2 configuration validation", () => {
  const empty = {
    R2_ACCOUNT_ID: "",
    R2_ACCESS_KEY_ID: "",
    R2_SECRET_ACCESS_KEY: "",
    R2_BUCKET_NAME: "",
    R2_ENDPOINT: "",
  };
  const complete = {
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "bucket",
    R2_ENDPOINT: "https://acct.r2.cloudflarestorage.com",
  };

  it("accepts complete R2 configuration", () => {
    expect(() => assertCompleteOrEmptyR2Config(complete)).not.toThrow();
    expect(countSetR2Fields(complete)).toBe(5);
  });

  it("accepts empty R2 configuration", () => {
    expect(() => assertCompleteOrEmptyR2Config(empty)).not.toThrow();
  });

  it("rejects missing account id in partial config", () => {
    expect(() =>
      assertCompleteOrEmptyR2Config({...complete, R2_ACCOUNT_ID: ""}),
    ).toThrow(/Partial R2/);
  });

  it("rejects missing access key", () => {
    expect(() =>
      assertCompleteOrEmptyR2Config({...complete, R2_ACCESS_KEY_ID: ""}),
    ).toThrow(/Partial R2/);
  });

  it("rejects missing secret", () => {
    expect(() =>
      assertCompleteOrEmptyR2Config({...complete, R2_SECRET_ACCESS_KEY: ""}),
    ).toThrow(/Partial R2/);
  });

  it("rejects missing bucket", () => {
    expect(() =>
      assertCompleteOrEmptyR2Config({...complete, R2_BUCKET_NAME: ""}),
    ).toThrow(/Partial R2/);
  });

  it("rejects missing endpoint", () => {
    expect(() =>
      assertCompleteOrEmptyR2Config({...complete, R2_ENDPOINT: ""}),
    ).toThrow(/Partial R2/);
  });

  it("enforces TTL bounds", () => {
    expect(parseSignedUrlTtlSeconds("", R2_TTL_DEFAULT_SECONDS)).toBe(R2_TTL_DEFAULT_SECONDS);
    expect(parseSignedUrlTtlSeconds(String(R2_TTL_MIN_SECONDS))).toBe(R2_TTL_MIN_SECONDS);
    expect(parseSignedUrlTtlSeconds(String(R2_TTL_MAX_SECONDS))).toBe(R2_TTL_MAX_SECONDS);
    expect(() => parseSignedUrlTtlSeconds(String(R2_TTL_MIN_SECONDS - 1))).toThrow();
    expect(() => parseSignedUrlTtlSeconds(String(R2_TTL_MAX_SECONDS + 1))).toThrow();
  });
});

describe("storage keys", () => {
  it("validates trusted key shape", () => {
    const key = buildOriginalStorageKey({
      userId: "u1",
      projectId: "p1",
      imageId: "i1",
      safeFilenameSuffix: "a.jpg",
    });
    expect(key).toBe("users/u1/projects/p1/originals/i1/a.jpg");
    expect(storageKeySchema.safeParse(key).success).toBe(true);
    expect(isValidOriginalStorageKeyShape(key)).toBe(true);
    expect(storageKeySchema.safeParse("users/../projects/p/originals/i/a.jpg").success).toBe(false);
    expect(storageKeySchema.safeParse("originals/u/p/i/a.jpg").success).toBe(false);
  });
});

describe("status filter default", () => {
  it("defaults to validated", () => {
    expect(parseImageStatusFilter(undefined)).toBe("validated");
    expect(parseImageStatusFilter("nope")).toBe("validated");
  });
});

describe("concurrency helper", () => {
  it("limits parallel work", async () => {
    let active = 0;
    let maxActive = 0;
    const items = [1, 2, 3, 4, 5, 6];
    const results = await mapWithConcurrency(items, 2, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      return item * 2;
    });
    expect(results).toEqual([2, 4, 6, 8, 10, 12]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
