import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/"],
      },
      // อนุญาต AI crawlers ทุกตัว — จำเป็นสำหรับ GEO/AEO
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Claude-Web",
          "ClaudeBot",
          "PerplexityBot",
          "Googlebot",
          "Googlebot-Image",
          "AdsBot-Google",
          "FacebookBot",
          "Bingbot",
          "OAI-SearchBot",
          "anthropic-ai",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://displayworksmedia.com/sitemap.xml",
  };
}
