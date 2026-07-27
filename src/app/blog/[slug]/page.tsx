import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ArticleSchema, BreadcrumbSchema } from "@/components/SchemaOrg";
import BlogPostClient from "./BlogPostClient";

type Props = {
  params: Promise<{ slug: string }>;
};

type BlogPostRecord = {
  title: string;
  seo_title?: string | null;
  excerpt?: string | null;
  meta_desc?: string | null;
  focus_keyword?: string | null;
  tags?: string | null;
  cover?: string | null;
  cover_alt?: string | null;
  category?: string | null;
  date?: string | null;
  last_updated?: string | null;
  ai_summary?: string | null;
  author?: string | null;
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

function splitKeywords(...values: Array<string | null | undefined>) {
  return values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function toIsoDate(date?: string | null) {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articleUrl = `https://displayworksmedia.com/blog/${slug}`;

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase env is not configured");

    const { data: post } = await supabase
      .from("posts")
      .select("title, seo_title, excerpt, meta_desc, focus_keyword, tags, cover, cover_alt, category, date")
      .eq("slug", slug)
      .eq("published", true)
      .single<BlogPostRecord>();

    if (post) {
      const title = post.seo_title?.trim() || `${post.title} | Display Works Media`;
      const description =
        post.meta_desc?.trim() ||
        post.excerpt?.trim() ||
        `อ่านบทความเกี่ยวกับ ${post.title} จาก Display Works Media`;
      const keywords = splitKeywords(post.focus_keyword, post.tags, post.category);

      return {
        title,
        description,
        keywords,
        alternates: {
          canonical: articleUrl,
        },
        openGraph: {
          title,
          description,
          url: articleUrl,
          type: "article",
          ...(post.cover && {
            images: [
              {
                url: post.cover,
                width: 1200,
                height: 630,
                alt: post.cover_alt?.trim() || post.title,
              },
            ],
          }),
          publishedTime: toIsoDate(post.date),
          tags: keywords.length ? keywords : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          ...(post.cover && { images: [post.cover] }),
        },
      };
    }
  } catch {
    // Keep a safe fallback if Supabase is temporarily unavailable.
  }

  const titleFromSlug = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    title: `${titleFromSlug} | Blog Display Works Media`,
    description: `อ่านบทความเกี่ยวกับ ${titleFromSlug} จาก Display Works Media`,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: `${titleFromSlug} | Display Works Media`,
      url: articleUrl,
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

    const articleUrl = `https://displayworksmedia.com/blog/${slug}`;
    const description =
      post.meta_desc?.trim() ||
      post.ai_summary?.trim() ||
      post.excerpt?.trim() ||
      "";
    const keywords = splitKeywords(post.focus_keyword, post.tags, post.category);

    return (
      <>
        <ArticleSchema
          headline={post.title}
          description={description}
          url={articleUrl}
          image={post.cover}
          datePublished={toIsoDate(post.date)}
          dateModified={toIsoDate(post.last_updated || post.date)}
          keywords={keywords}
          authorName={post.author || "Display Works Media"}
        />
        <BreadcrumbSchema
          items={[
            { name: "หน้าแรก", url: "https://displayworksmedia.com" },
            { name: "บทความ", url: "https://displayworksmedia.com/blog" },
            { name: post.title, url: articleUrl },
          ]}
        />
        <BlogPostClient initialPost={post} initialRelated={related || []} />
      </>
    );
  } catch {
    notFound();
  }
}
