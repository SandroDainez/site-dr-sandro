import type { MetadataRoute } from "next";

const SITE_URL = "https://site-dr-sandro.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-login", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
