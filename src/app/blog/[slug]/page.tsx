import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

// Next.js 15 — params ต้องเป็น Promise
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const titleFromSlug = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${titleFromSlug} | Blog Display Works Media`,
    description: `อ่านบทความเกี่ยวกับ ${titleFromSlug} จาก Display Works Media — ความรู้เรื่องงานพิมพ์ป้าย สติ๊กเกอร์ แบ็คดรอป Roll Up`,
    alternates: {
      canonical: `https://displayworksmedia.com/blog/${slug}`,
    },
    openGraph: {
      title: `${titleFromSlug} | Display Works Media`,
      url: `https://displayworksmedia.com/blog/${slug}`,
      type: "article",
    },
  };
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
