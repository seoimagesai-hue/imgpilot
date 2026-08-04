import {describe, expect, it} from "vitest";
import {
  GUEST_BULK_MAX_BATCH_BYTES_DEFAULT,
  GUEST_BULK_MAX_FILES_DEFAULT,
  isGuestBulkToolCode,
  neutralizeCsvCell,
  operationForBulkTool,
  sanitizeZipEntryName,
  uniqueZipNames,
} from "@/lib/guest/bulk-policy";
import {buildGuestBulkArchive} from "@/server/guest/bulk-zip";
import {resolveGuestBulkPolicy} from "@/server/guest/bulk-service";
import {getAiMetadataPolicy} from "@/server/images/ai-metadata-policy";

describe("bulkAi policy alignment", () => {
  it("keeps authenticated Prompt 31 bulkAi enabled", () => {
    expect(getAiMetadataPolicy().bulkAi).toBe(true);
  });
});

describe("guest bulk policy", () => {
  it("exposes compress/resize/convert only", () => {
    expect(isGuestBulkToolCode("compress")).toBe(true);
    expect(isGuestBulkToolCode("crop")).toBe(false);
    expect(operationForBulkTool("compress")).toBe("compress.same_format");
    expect(operationForBulkTool("resize")).toBe("resize.same_format");
    expect(operationForBulkTool("convert")).toBe("convert.format");
  });

  it("uses conservative guest defaults and elevates when authenticated", () => {
    const guest = resolveGuestBulkPolicy({authenticated: false});
    expect(guest.maxFiles).toBe(GUEST_BULK_MAX_FILES_DEFAULT);
    expect(guest.maxBatchBytes).toBe(GUEST_BULK_MAX_BATCH_BYTES_DEFAULT);
    expect(guest.operationsPerFile).toBe(1);
    expect(guest.bulkAiGuestAllowed).toBe(false);
    expect(guest.tools.aiAltText).toBe(false);
    expect(guest.processConcurrency).toBe(1);

    const auth = resolveGuestBulkPolicy({authenticated: true});
    expect(auth.maxFiles).toBeGreaterThan(guest.maxFiles);
  });
});

describe("guest bulk ZIP safety", () => {
  it("sanitizes paths and uniquifies names", () => {
    expect(sanitizeZipEntryName("../etc/passwd", "x.bin")).toBe("passwd");
    expect(sanitizeZipEntryName("a/b\\c.jpg", "x.bin")).toBe("c.jpg");
    expect(uniqueZipNames(["a.webp", "a.webp", "b.png"])).toEqual([
      "a.webp",
      "a (2).webp",
      "b.png",
    ]);
  });

  it("builds zip with formula-safe manifest", async () => {
    const zip = await buildGuestBulkArchive({
      operation: "compress.same_format",
      maxBytes: 5 * 1024 * 1024,
      outputs: [
        {
          originalFilename: "one.jpg",
          outputFilename: "one-bulk.jpg",
          bytes: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
          meta: {
            status: "completed",
            operation: "compress.same_format",
            originalBytes: 10,
            outputBytes: 4,
            width: 1,
            height: 1,
            format: "image/jpeg",
            errorCode: null,
          },
        },
        {
          originalFilename: "=cmd.jpg",
          outputFilename: "=cmd-bulk.jpg",
          bytes: Buffer.from([1, 2, 3, 4]),
          meta: {
            status: "completed",
            operation: "compress.same_format",
            originalBytes: 4,
            outputBytes: 4,
            width: null,
            height: null,
            format: "image/jpeg",
            errorCode: null,
          },
        },
      ],
    });
    expect(zip.length).toBeGreaterThan(20);
    // JSZip local file signature
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(neutralizeCsvCell("=CMD")).toBe(`"'=CMD"`);
  });
});
