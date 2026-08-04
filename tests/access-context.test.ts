import {describe, expect, it} from "vitest";
import {guestAccessContext} from "@/server/account/access-context";

describe("guestAccessContext", () => {
  it("projects guest least-privilege capabilities", () => {
    const ctx = guestAccessContext();
    expect(ctx.state).toBe("guest");
    expect(ctx.signedIn).toBe(false);
    expect(ctx.capabilities.bulkAi).toBe(false);
    expect(ctx.capabilities.savedFiles).toBe(false);
    expect(ctx.capabilities.savedHistory).toBe(false);
    expect(ctx.capabilities.zipDownload).toBe(true);
    expect(ctx.limits.retentionHours).toBe(1);
    expect(ctx.limits.standardOperationsLimit).toBeGreaterThan(0);
  });
});
