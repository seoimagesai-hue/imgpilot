import {describe, expect, it} from "vitest";
import {generateSitemaps} from "../src/app/sitemap";
import {routing} from "../src/i18n/routing";
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

describe("sitemap index", () => {
  it("generates one child sitemap per locale", async () => {
    const ids = await generateSitemaps();
    expect(ids).toHaveLength(routing.locales.length);
    expect(ids.map((entry) => entry.id)).toEqual([...routing.locales]);
  });

  it("keeps public path coverage across locales", () => {
    const paths = listSitemapPaths();
    expect(paths.length).toBeGreaterThan(20);
    expect(paths).toContain("/compress-image");
  });
});
