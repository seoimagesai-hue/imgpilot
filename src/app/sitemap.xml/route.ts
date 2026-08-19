import {NextResponse} from "next/server";
import {buildSitemapIndexXml} from "@/lib/marketing/sitemap-index";

/** Explicit index route so `/sitemap.xml` is not captured by `[locale]`. */
export function GET() {
  return new NextResponse(buildSitemapIndexXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
