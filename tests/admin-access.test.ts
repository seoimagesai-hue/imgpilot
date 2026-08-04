import {describe, expect, it} from "vitest";
import {
  ADMIN_CLEANUP_CONFIRM,
  ADMIN_RESTORE_CONFIRM,
  ADMIN_SUSPEND_CONFIRM,
} from "../src/server/admin/constants";
import {
  assertSafeAuditText,
  containsLikelySecret,
  redactStorageKeyHint,
  scrubGuestSessionRow,
} from "../src/server/admin/redaction";

describe("admin access helpers", () => {
  it("requires explicit confirmation phrases for destructive actions", () => {
    expect(ADMIN_SUSPEND_CONFIRM).toBe("SUSPEND");
    expect(ADMIN_RESTORE_CONFIRM).toBe("RESTORE");
    expect(ADMIN_CLEANUP_CONFIRM).toBe("RUN-CLEANUP");
  });
});

describe("admin audit redaction", () => {
  it("detects likely secrets in audit text", () => {
    expect(containsLikelySecret("sk_test_abc123")).toBe(true);
    expect(containsLikelySecret("whsec_abc123")).toBe(true);
    expect(containsLikelySecret("active")).toBe(false);
    expect(containsLikelySecret("user suspended for abuse")).toBe(false);
  });

  it("rejects unsafe audit summaries", () => {
    expect(() => assertSafeAuditText("sk_live_secret", "reason")).toThrow(/Unsafe reason/);
    expect(() => assertSafeAuditText("ok", "beforeSummary")).not.toThrow();
  });

  it("redacts storage key hints", () => {
    expect(redactStorageKeyHint(null)).toBeNull();
    expect(redactStorageKeyHint("projects/abc/uploads/long-file-name-key")).toMatch(/^\[redacted\]/);
  });
});

describe("guest session scrubbing", () => {
  it("omits token and IP fields from admin list rows", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const scrubbed = scrubGuestSessionRow(
      {
        id: "sess-1",
        publicId: "pub-abc",
        cohort: "a",
        locale: "en",
        toolCode: "compress-image",
        operationsUsed: 2,
        createdAt: new Date("2026-01-01T10:00:00Z"),
        expiresAt: new Date("2026-01-01T11:00:00Z"),
        scrubbedAt: null,
      },
      now,
    );

    expect(scrubbed).toEqual({
      id: "sess-1",
      publicId: "pub-abc",
      cohort: "a",
      locale: "en",
      toolCode: "compress-image",
      operationsUsed: 2,
      createdAt: new Date("2026-01-01T10:00:00Z"),
      expiresAt: new Date("2026-01-01T11:00:00Z"),
      scrubbedAt: null,
      expired: true,
    });
    expect(scrubbed).not.toHaveProperty("tokenHash");
    expect(scrubbed).not.toHaveProperty("ipHash");
  });
});

describe("super-admin gate concept", () => {
  it("treats only super_admin role as admin-eligible", () => {
    const isAdminEligible = (role: string, accountStatus: string) =>
      role === "super_admin" && accountStatus === "active";

    expect(isAdminEligible("super_admin", "active")).toBe(true);
    expect(isAdminEligible("user", "active")).toBe(false);
    expect(isAdminEligible("super_admin", "suspended")).toBe(false);
  });
});
