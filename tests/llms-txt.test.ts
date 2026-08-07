import {describe, expect, it} from "vitest";
import {
  listLlmsLinks,
  renderLlmsFullTxt,
  renderLlmsTxt,
  resolveLlmsOrigin,
} from "@/lib/marketing/llms-txt";

describe("llms.txt catalog", () => {
  it("includes required public pages and excludes private prefixes", () => {
    const paths = listLlmsLinks().map((l) => l.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/compress-image");
    expect(paths).toContain("/png-to-webp");
    expect(paths).toContain("/pricing");
    expect(paths).toContain("/docs");
    expect(paths).toContain("/docs/api");
    expect(paths).toContain("/privacy");
    expect(paths).toContain("/terms");
    expect(paths).toContain("/contact");
    expect(paths.every((p) => !p.startsWith("/api"))).toBe(true);
    expect(paths.every((p) => !p.startsWith("/dashboard"))).toBe(true);
    expect(paths.every((p) => !p.startsWith("/account"))).toBe(true);
    expect(paths.every((p) => !p.startsWith("/admin"))).toBe(true);
  });

  it("gives every entry a non-empty title and description", () => {
    for (const link of listLlmsLinks()) {
      expect(link.title.trim().length).toBeGreaterThan(0);
      expect(link.description.trim().length).toBeGreaterThan(10);
    }
  });

  it("renders utf-8 plain text with absolute URLs", () => {
    const origin = resolveLlmsOrigin("https://example.com");
    const short = renderLlmsTxt(origin);
    const full = renderLlmsFullTxt(origin);
    expect(short.startsWith("# Img Pilot")).toBe(true);
    expect(full.startsWith("# Img Pilot")).toBe(true);
    expect(short).toContain("https://example.com/compress-image");
    expect(full).toContain("https://example.com/docs/api");
    expect(short).toContain("llms-full.txt");
    expect(full).toContain("llms.txt");
    expect(short).not.toContain("\u0000");
    expect(listLlmsLinks().map((l) => l.path)).not.toEqual(
      expect.arrayContaining(["/api", "/dashboard", "/account", "/admin"]),
    );
    for (const link of listLlmsLinks()) {
      expect(link.path).not.toMatch(/^\/(api|dashboard|account|admin)(\/|$)/);
    }
  });
});
