import {describe, expect, it} from "vitest";
import {routing} from "../src/i18n/routing";
import {
  buildLocaleSitemapXml,
  buildSitemapIndexXml,
  countLocaleSitemapUrls,
} from "../src/lib/marketing/sitemap-xml";
import {listSitemapPaths} from "../src/lib/marketing/tool-landing-registry";
import {wwwToApexHostname} from "../src/lib/host-redirect";

describe("www host redirect", () => {
  it("maps www hostnames to the apex domain", () => {
    expect(wwwToApexHostname("www.imgpilot.net")).toBe("imgpilot.net");
    expect(wwwToApexHostname("WWW.ImgPilot.Net")).toBe("imgpilot.net");
  });

  it("ignores apex and other hosts", () => {
    expect(wwwToApexHostname("imgpilot.net")).toBeNull();
    expect(wwwToApexHostname("staging.imgpilot.net")).toBeNull();
  });
});

describe("static sitemap xml", () => {
  it("lists every locale child in the sitemap index", () => {
    const xml = buildSitemapIndexXml("https://imgpilot.net");
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("https://imgpilot.net/sitemap/en.xml");
    expect(xml).toContain("https://imgpilot.net/sitemap/es.xml");
    expect(xml).toContain("https://imgpilot.net/sitemap/ur.xml");
  });

  it("includes generics, landings and docs paths", () => {
    const paths = listSitemapPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/compress-image");
    expect(paths).toContain("/png-to-webp");
    expect(paths).toContain("/docs");
    expect(paths).toContain("/docs/api");
    expect(paths).not.toContain("/resize-jpeg");
  });

  it("builds a non-empty english urlset with hreflang", () => {
    const xml = buildLocaleSitemapXml("en", "https://imgpilot.net");
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://imgpilot.net/compress-image");
    expect(xml).toContain('hreflang="x-default"');
    expect(countLocaleSitemapUrls("en")).toBeGreaterThan(40);
  });

  it("generates one file worth of urls per locale", () => {
    expect(routing.locales.every((locale) => countLocaleSitemapUrls(locale) > 0)).toBe(true);
  });
});
