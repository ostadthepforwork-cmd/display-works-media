import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [];
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ดึง metadata จาก Supabase จริง — Google จะเห็น title/description ตรงกับเนื้อหา
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase env is not configured");
    const { data: post } = await supabase
      .from("posts")
      .select("title, excerpt, cover, category, date")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (post) {
      return {
        title: `${post.title} | Display Works Media`,
        description: post.excerpt || `อ่านบทความเกี่ยวกับ ${post.title} จาก Display Works Media`,
        alternates: {
          canonical: `https://displayworksmedia.com/blog/${slug}`,
        },
        openGraph: {
          title: `${post.title} | Display Works Media`,
          description: post.excerpt || "",
          url: `https://displayworksmedia.com/blog/${slug}`,
          type: "article",
          ...(post.cover && {
            images: [{ url: post.cover, width: 1200, height: 630, alt: post.title }],
          }),
          publishedTime: post.date ? new Date(post.date).toISOString() : undefined,
          tags: post.category ? [post.category] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title: `${post.title} | Display Works Media`,
          description: post.excerpt || "",
          ...(post.cover && { images: [post.cover] }),
        },
      };
    }
  } catch {
    // fallback ถ้า Supabase ล้มเหลว
  }

  // Fallback — ใช้ slug แปลงเป็น title
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  try {
    const supabase = getSupabase();
    if (!supabase) notFound();

    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!post) notFound();

    const { data: related } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .eq("category", post.category)
      .neq("slug", slug)
      .limit(3);

    return <BlogPostClient initialPost={post} initialRelated={related || []} />;
  } catch {
    notFound();
  }
}
