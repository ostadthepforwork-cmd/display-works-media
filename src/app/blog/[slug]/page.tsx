import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

// Dynamic metadata สำหรับ blog post แต่ละบทความ
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // slug ใช้เป็น title fallback — production ควร fetch จาก Supabase
  const titleFromSlug = params.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${titleFromSlug} | Blog Display Works Media`,
    description: `อ่านบทความเกี่ยวกับ ${titleFromSlug} จาก Display Works Media — ความรู้เรื่องงานพิมพ์ป้าย สติ๊กเกอร์ แบ็คดรอป Roll Up`,
    alternates: {
      canonical: `https://displayworksmedia.com/blog/${params.slug}`,
    },
    openGraph: {
      title: `${titleFromSlug} | Display Works Media`,
      url: `https://displayworksmedia.com/blog/${params.slug}`,
      type: "article",
    },
  };
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
