import type { MetadataRoute } from "next";
import { aiRobotsUserAgents } from "@/lib/ai-bots";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/doc/", "/login"],
      },
      // อนุญาต AI crawlers ทุกตัว — จำเป็นสำหรับ GEO/AEO
      {
        userAgent: aiRobotsUserAgents(),
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/doc/", "/login"],
      },
    ],
    sitemap: "https://displayworksmedia.com/sitemap.xml",
  };
}
