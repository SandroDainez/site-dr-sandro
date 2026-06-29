import type { MetadataRoute } from "next";

const SITE_URL = "https://medcampus.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-login", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
