import {describe, expect, it} from "vitest";
import {
  getToolLanding,
  listIndexableToolLandings,
  listSitemapPaths,
  listToolLandingRedirects,
  TOOL_LANDING_REGISTRY,
} from "@/lib/marketing/tool-landing-registry";

describe("tool landing registry", () => {
  it("maps jpeg aliases to jpg primaries", () => {
    expect(getToolLanding("resize-jpeg")?.redirectTo).toBe("resize-jpg");
    expect(getToolLanding("compress-jpeg")?.redirectTo).toBe("compress-jpg");
    expect(getToolLanding("jpeg-to-webp")?.redirectTo).toBe("jpg-to-webp");
  });

  it("does not index redirects or target-kb routes", () => {
    const slugs = listIndexableToolLandings().map((d) => d.slug);
    expect(slugs).not.toContain("resize-jpeg");
    expect(slugs.every((s) => !s.includes("to-20kb"))).toBe(true);
  });

  it("only lists supported convert pairs", () => {
    const converts = TOOL_LANDING_REGISTRY.filter((d) => d.operation === "convert" && !d.redirectTo);
    for (const item of converts) {
      expect(item.sourceFormat).toBeTruthy();
      expect(item.targetFormat).toBeTruthy();
      expect(item.sourceFormat).not.toBe(item.targetFormat);
    }
  });

  it("includes generics and landings in sitemap paths", () => {
    const paths = listSitemapPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/compress-image");
    expect(paths).toContain("/png-to-webp");
    expect(paths).toContain("/privacy");
    expect(paths).toContain("/about");
    expect(paths).toContain("/contact");
    expect(paths).toContain("/docs/api");
    expect(paths).not.toContain("/resize-jpeg");
  });

  it("exposes jpeg redirect list", () => {
    const redirects = listToolLandingRedirects();
    expect(redirects.some((r) => r.from === "jpg-to-png" ? false : r.from === "jpeg-to-png" && r.to === "jpg-to-png")).toBe(
      true,
    );
  });
});
