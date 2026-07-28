import type { MetadataRoute } from "next";

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
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "OAI-AdsBot",
          "Claude-Web",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Googlebot",
          "Googlebot-Image",
          "GoogleOther",
          "GoogleOther-Image",
          "GoogleOther-Video",
          "Google-InspectionTool",
          "Google-CloudVertexBot",
          "AdsBot-Google",
          "FacebookBot",
          "Meta-ExternalAgent",
          "Bingbot",
          "BingPreview",
          "Applebot",
          "Applebot-Extended",
          "CCBot",
          "Amazonbot",
          "Bytespider",
          "YouBot",
          "DuckAssistBot",
          "DuckDuckBot",
          "Bravebot",
          "MistralAI-User",
          "cohere-ai",
          "AI2Bot",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/doc/", "/login"],
      },
    ],
    sitemap: "https://displayworksmedia.com/sitemap.xml",
  };
}
