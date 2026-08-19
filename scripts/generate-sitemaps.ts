/**
 * Write public/sitemap.xml and public/sitemap/{locale}.xml as static files.
 * Static delivery is more reliable for Google Search Console fetch than dynamic routes.
 */
import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {routing, type AppLocale} from "../src/i18n/routing";
import {
  buildLocaleSitemapXml,
  buildSitemapIndexXml,
  countLocaleSitemapUrls,
} from "../src/lib/marketing/sitemap-xml";
import {listSitemapPaths} from "../src/lib/marketing/tool-landing-registry";
import {getPublicAppOrigin} from "../src/server/marketing/seo";
import {loadLocalEnvFiles} from "./load-local-env";

function resolveSitemapOrigin(): string {
  loadLocalEnvFiles();
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "https://imgpilot.net").trim();
  try {
    const origin = new URL(raw).origin.replace(/\/$/, "");
    if (origin.includes("localhost") && process.env.VERCEL !== "1") {
      return "https://imgpilot.net";
    }
    return origin;
  } catch {
    return "https://imgpilot.net";
  }
}

function main() {
  const origin = resolveSitemapOrigin();
  if (origin.includes("localhost") && process.env.VERCEL === "1") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be the public https://imgpilot.net origin on Vercel before generating sitemaps.",
    );
  }
  const paths = listSitemapPaths();
  if (paths.length === 0) {
    throw new Error("Sitemap path list is empty");
  }

  const publicDir = join(process.cwd(), "public");
  const sitemapDir = join(publicDir, "sitemap");
  mkdirSync(sitemapDir, {recursive: true});

  writeFileSync(join(publicDir, "sitemap.xml"), buildSitemapIndexXml(origin), "utf8");

  let totalUrls = 0;
  for (const locale of routing.locales) {
    const xml = buildLocaleSitemapXml(locale as AppLocale, origin);
    writeFileSync(join(sitemapDir, `${locale}.xml`), xml, "utf8");
    totalUrls += countLocaleSitemapUrls(locale as AppLocale);
  }

  console.log(
    `Wrote public/sitemap.xml and ${routing.locales.length} locale sitemaps (${paths.length} paths, ${totalUrls} indexed URLs, origin=${origin})`,
  );
}

main();
