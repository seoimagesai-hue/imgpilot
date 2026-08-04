import type {MetadataRoute} from "next";
import {getPublicAppOrigin} from "@/server/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicAppOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/account/", "/admin/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
