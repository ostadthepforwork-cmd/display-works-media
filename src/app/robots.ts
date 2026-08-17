import type { MetadataRoute } from "next";
import { aiRobotsUserAgents } from "@/lib/ai-bots";
import { SENSITIVE_PATH_DISALLOW } from "@/lib/sensitive-paths";

const PRIVATE_DISALLOW = ["/admin/", "/api/", "/auth/", "/doc/", "/login", ...SENSITIVE_PATH_DISALLOW];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_DISALLOW,
      },
      // อนุญาต AI crawlers ทุกตัว — จำเป็นสำหรับ GEO/AEO
      {
        userAgent: aiRobotsUserAgents(),
        allow: "/",
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: "https://displayworksmedia.com/sitemap.xml",
  };
}
