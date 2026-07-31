import {describe, expect, it} from "vitest";
import {formatByteSize} from "../src/lib/format-bytes";
import {
  MAX_BYTES_PER_IMAGE,
  MAX_FILES_PER_BATCH,
  SVG_SUPPORTED,
  getExtension,
  isAllowedImageMimeType,
  isRejectedExtension,
  isRejectedMimeType,
} from "../src/server/images/policy";
import {
  buildSafeFilenameSuffix,
  fileDescriptorSchema,
  imageIdSchema,
  imageStatusFilterSchema,
  parseImageStatusFilter,
  sanitizeOriginalFilename,
  storageKeySchema,
  uploadBatchSchema,
} from "../src/server/images/validation";
import {projectIdSchema} from "../src/server/projects/validation";
import {buildOriginalStorageKey, assertOriginalStorageKeyOwned} from "../src/server/storage/keys";
import {
  DisabledObjectStorageProvider,
  StorageNotConfiguredError,
} from "../src/server/storage/provider";

const projectId = "11111111-1111-4111-8111-111111111111";

function file(partial: Partial<{originalFilename: string; mimeType: string; sizeBytes: number}>) {
  return {
    originalFilename: "photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    ...partial,
  };
}

describe("upload policy MIME allowlist", () => {
  it("accepts JPEG", () => {
    expect(isAllowedImageMimeType("image/jpeg")).toBe(true);
    expect(fileDescriptorSchema.safeParse(file({mimeType: "image/jpeg"})).success).toBe(true);
  });

  it("accepts PNG", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.png", mimeType: "image/png"})).success).toBe(
      true,
    );
  });

  it("accepts WebP", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.webp", mimeType: "image/webp"})).success).toBe(
      true,
    );
  });

  it("accepts GIF", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.gif", mimeType: "image/gif"})).success).toBe(
      true,
    );
  });

  it("accepts AVIF", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.avif", mimeType: "image/avif"})).success).toBe(
      true,
    );
  });

  it("rejects SVG", () => {
    expect(SVG_SUPPORTED).toBe(false);
    expect(isRejectedMimeType("image/svg+xml")).toBe(true);
    expect(isRejectedExtension("svg")).toBe(true);
    expect(
      fileDescriptorSchema.safeParse(file({originalFilename: "a.svg", mimeType: "image/svg+xml"})).success,
    ).toBe(false);
  });

  it("rejects PDF", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.pdf", mimeType: "application/pdf"})).success).toBe(
      false,
    );
  });

  it("rejects ZIP", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a.zip", mimeType: "application/zip"})).success).toBe(
      false,
    );
  });

  it("rejects executable type", () => {
    expect(isRejectedExtension("exe")).toBe(true);
    expect(
      fileDescriptorSchema.safeParse(file({originalFilename: "a.exe", mimeType: "application/x-msdownload"})).success,
    ).toBe(false);
  });
});

describe("extensions and mismatches", () => {
  it("normalizes uppercase extensions", () => {
    expect(getExtension("Photo.JPG")).toBe("jpg");
    expect(
      fileDescriptorSchema.safeParse(file({originalFilename: "Photo.JPG", mimeType: "image/jpeg"})).success,
    ).toBe(true);
  });

  it("flags mime/extension mismatch (declared metadata only)", () => {
    expect(
      fileDescriptorSchema.safeParse(file({originalFilename: "a.png", mimeType: "image/jpeg"})).success,
    ).toBe(false);
  });
});

describe("size and batch limits", () => {
  it("rejects zero-byte files", () => {
    expect(fileDescriptorSchema.safeParse(file({sizeBytes: 0})).success).toBe(false);
  });

  it("accepts file exactly at size limit", () => {
    expect(fileDescriptorSchema.safeParse(file({sizeBytes: MAX_BYTES_PER_IMAGE})).success).toBe(true);
  });

  it("rejects file above size limit", () => {
    expect(fileDescriptorSchema.safeParse(file({sizeBytes: MAX_BYTES_PER_IMAGE + 1})).success).toBe(false);
  });

  it("accepts batch exactly at 500 files", () => {
    const files = Array.from({length: MAX_FILES_PER_BATCH}, (_, i) =>
      file({originalFilename: `img-${i}.jpg`}),
    );
    expect(uploadBatchSchema.safeParse({projectId, files}).success).toBe(true);
  });

  it("rejects batch above 500 files", () => {
    const files = Array.from({length: MAX_FILES_PER_BATCH + 1}, (_, i) =>
      file({originalFilename: `img-${i}.jpg`}),
    );
    expect(uploadBatchSchema.safeParse({projectId, files}).success).toBe(false);
  });
});

describe("filename safety", () => {
  it("keeps a safe unicode filename for display sanitization", () => {
    expect(sanitizeOriginalFilename("تصویر.jpg")).toContain(".jpg");
  });

  it("neutralizes path traversal", () => {
    expect(sanitizeOriginalFilename("../../etc/passwd.jpg")).toBe("passwd.jpg");
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "../x.jpg"})).success).toBe(false);
  });

  it("rejects absolute-path filenames", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "/tmp/a.jpg"})).success).toBe(false);
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "C:\\a.jpg"})).success).toBe(false);
  });

  it("rejects null-byte filenames", () => {
    expect(fileDescriptorSchema.safeParse(file({originalFilename: "a\0.jpg"})).success).toBe(false);
  });

  it("rejects excessively long filenames", () => {
    expect(
      fileDescriptorSchema.safeParse(file({originalFilename: `${"a".repeat(300)}.jpg`})).success,
    ).toBe(false);
  });

  it("does not use sanitized display name as unique storage key", () => {
    const suffix = buildSafeFilenameSuffix("My Photo.jpg");
    const key = buildOriginalStorageKey({
      userId: "u",
      projectId: "p",
      imageId: "i",
      safeFilenameSuffix: suffix,
    });
    expect(key.startsWith("users/u/projects/p/originals/i/")).toBe(true);
    expect(key).not.toBe(suffix);
  });
});

describe("ids filters and storage keys", () => {
  it("accepts valid project and image ids", () => {
    expect(projectIdSchema.safeParse(projectId).success).toBe(true);
    expect(imageIdSchema.safeParse(projectId).success).toBe(true);
  });

  it("rejects invalid project id", () => {
    expect(projectIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("parses valid status filters and falls back for invalid", () => {
    expect(imageStatusFilterSchema.parse("uploaded")).toBe("uploaded");
    expect(imageStatusFilterSchema.parse("validated")).toBe("validated");
    expect(parseImageStatusFilter("nope")).toBe("validated");
  });

  it("validates trusted storage keys", () => {
    expect(storageKeySchema.safeParse("users/u/projects/p/originals/i/file.jpg").success).toBe(true);
    expect(storageKeySchema.safeParse("users/../projects/p/originals/i/a.jpg").success).toBe(false);
    expect(storageKeySchema.safeParse("public/file.jpg").success).toBe(false);
  });

  it("checks ownership prefix on keys", () => {
    expect(
      assertOriginalStorageKeyOwned({
        storageKey: "users/u/projects/p/originals/i/a.jpg",
        userId: "u",
        projectId: "p",
        imageId: "i",
      }),
    ).toBe(true);
  });
});

describe("formatByteSize", () => {
  it("formats boundary values safely", () => {
    expect(formatByteSize(0)).toBe("0 B");
    expect(formatByteSize(-1)).toBe("0 B");
    expect(formatByteSize(512)).toContain("B");
    expect(formatByteSize(1024)).toContain("KB");
    expect(formatByteSize(2.4 * 1024 * 1024)).toContain("MB");
  });
});

describe("storage abstraction", () => {
  it("throws StorageNotConfiguredError and never succeeds", async () => {
    const provider = new DisabledObjectStorageProvider();
    await expect(
      provider.createUploadTarget({
        projectId: "p",
        userId: "u",
        imageId: "i",
        mimeType: "image/jpeg",
        sizeBytes: 1,
        originalFilename: "a.jpg",
        storageKey: "users/u/projects/p/originals/i/a.jpg",
      }),
    ).rejects.toBeInstanceOf(StorageNotConfiguredError);
    await expect(provider.confirmUpload("x")).rejects.toBeInstanceOf(StorageNotConfiguredError);
    await expect(provider.objectExists("x")).rejects.toBeInstanceOf(StorageNotConfiguredError);
  });
});
