import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { blogCategories, seoServices } from "@/lib/seo-content";

const BASE_URL = "https://displayworksmedia.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ดึง blog slugs จาก Supabase เพื่อให้ Google index บทความทุกชิ้น
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: posts } = await supabase
      .from("posts")
      .select("slug, date")
      .eq("published", true)
      .order("date", { ascending: false });

    if (posts) {
      blogEntries = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.date ? new Date(post.date) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // ถ้า Supabase ล้มเหลว ไม่ให้ build พัง — ใช้ static entries อย่างเดียว
  }

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...seoServices.map((service) => ({
      url: `${BASE_URL}${service.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: service.slug === "printing-media" ? 0.85 : 0.9,
    })),
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogCategories.map((category) => ({
      url: `${BASE_URL}/blog/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticEntries, ...blogEntries];
}
