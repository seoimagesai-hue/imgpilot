import {afterEach, describe, expect, it, vi} from "vitest";
import {
  isExpectedR2ObjectAbsence,
  mapR2SdkError,
} from "@/server/storage/r2-client";

describe("R2 absence vs failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps HeadObject NotFound to OBJECT_NOT_FOUND without console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const mapped = mapR2SdkError({name: "NotFound", $metadata: {httpStatusCode: 404}});
    expect(mapped.code).toBe("OBJECT_NOT_FOUND");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("emits debug absence logs only when R2_DEBUG_ABSENCE=1", () => {
    const prev = process.env.R2_DEBUG_ABSENCE;
    process.env.R2_DEBUG_ABSENCE = "1";
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mapR2SdkError({name: "NoSuchKey"});
      expect(errorSpy).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
      expect(String(debugSpy.mock.calls[0]?.[0] ?? "")).toMatch(/object absent/i);
    } finally {
      if (prev === undefined) delete process.env.R2_DEBUG_ABSENCE;
      else process.env.R2_DEBUG_ABSENCE = prev;
    }
  });

  it("treats NoSuchKey and bare HTTP 404 as expected absence", () => {
    expect(isExpectedR2ObjectAbsence({name: "NoSuchKey"})).toBe(true);
    expect(isExpectedR2ObjectAbsence({name: "TimeoutError", $metadata: {httpStatusCode: 404}})).toBe(
      true,
    );
    expect(isExpectedR2ObjectAbsence({Code: "NoSuchKey"})).toBe(true);
  });

  it("logs genuine R2 failures at error level as STORAGE_UNAVAILABLE", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const mapped = mapR2SdkError({
      name: "TimeoutError",
      message: "socket hang up",
      $metadata: {httpStatusCode: 500},
    });
    expect(mapped.code).toBe("STORAGE_UNAVAILABLE");
    expect(errorSpy).toHaveBeenCalledWith("[r2] storage operation failed");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("logs authorization-style failures at error level", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mapped = mapR2SdkError({
      name: "AccessDenied",
      $metadata: {httpStatusCode: 403},
    });
    expect(mapped.code).toBe("STORAGE_UNAVAILABLE");
    expect(errorSpy).toHaveBeenCalledWith("[r2] storage operation failed");
  });
});
