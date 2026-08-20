import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleSchema, BreadcrumbSchema } from "@/components/SchemaOrg";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { blogSlugCandidates, normalizeBlogSlug } from "@/lib/blog-slug";
import { seoArticleBySlug, seoArticlePlans, seoArticlePlanToPost } from "@/lib/seo-content";
import BlogPostClient from "./BlogPostClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BlogPostRecord = {
  slug?: string | null;
  title: string;
  seo_title?: string | null;
  excerpt?: string | null;
  meta_desc?: string | null;
  focus_keyword?: string | null;
  tags?: string | null;
  cover?: string | null;
  cover_url?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  cover_alt?: string | null;
  image_alt?: string | null;
  category?: string | null;
  date?: string | null;
  last_updated?: string | null;
  ai_summary?: string | null;
  author?: string | null;
};

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

function postCoverUrl(post: BlogPostRecord) {
  return post.cover?.trim() || post.cover_url?.trim() || post.image?.trim() || post.thumbnail?.trim() || "";
}

function withoutCurrentPost<T extends { slug?: string | null }>(posts: T[] | null | undefined, slug: string) {
  const candidates = new Set(blogSlugCandidates(slug));
  return (posts || []).filter((item) => !candidates.has(String(item.slug || "")));
}

function uniquePosts<T extends { id?: string | null; slug?: string | null }>(posts: T[]) {
  const seen = new Set<string>();
  return posts.filter((post) => {
    const key = String(post.id || post.slug || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackPostBySlug(slug: string) {
  const article = seoArticleBySlug(normalizeBlogSlug(slug));
  return article ? seoArticlePlanToPost(article) : null;
}

function fallbackRelatedPosts(slug: string) {
  return seoArticlePlans
    .filter((article) => article.slug !== normalizeBlogSlug(slug))
    .slice(0, 3)
    .map(seoArticlePlanToPost);
}

function pickPostBySlug<T extends { slug?: string | null }>(posts: T[] | null | undefined, slug: string) {
  const normalized = normalizeBlogSlug(slug);
  return (
    (posts || []).find((post) => normalizeBlogSlug(post.slug) === normalized) ||
    (posts || [])[0] ||
    null
  );
}

function metadataFromPost(post: BlogPostRecord, slug: string): Metadata {
  const articleUrl = `https://displayworksmedia.com/blog/${slug}`;
  const title = post.seo_title?.trim() || `${post.title} | Display Works Media`;
  const description =
    post.meta_desc?.trim() ||
    post.excerpt?.trim() ||
    `อ่านบทความเกี่ยวกับ ${post.title} จาก Display Works Media`;
  const keywords = splitKeywords(post.focus_keyword, post.tags, post.category);
  const cover = postCoverUrl(post);
  const coverAlt = post.cover_alt?.trim() || post.image_alt?.trim() || post.title;

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
      ...(cover && {
        images: [
          {
            url: cover,
            width: 1200,
            height: 630,
            alt: coverAlt,
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
      ...(cover && { images: [cover] }),
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeBlogSlug(rawSlug);
  const articleUrl = `https://displayworksmedia.com/blog/${slug}`;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: posts } = await supabase
      .from("posts")
      .select("title, seo_title, excerpt, meta_desc, focus_keyword, tags, cover, cover_url, image, thumbnail, cover_alt, image_alt, category, date")
      .in("slug", blogSlugCandidates(slug))
      .eq("published", true)
      .limit(2);

    const post = pickPostBySlug(posts as BlogPostRecord[] | null, slug);
    if (post) {
      return metadataFromPost(post, slug);
    }
  } catch {
    // Keep a safe fallback if Supabase is temporarily unavailable.
  }

  const fallback = fallbackPostBySlug(slug);
  if (fallback) {
    return metadataFromPost(fallback, slug);
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
  const { slug: rawSlug } = await params;
  const slug = normalizeBlogSlug(rawSlug);

  let post: any = null;
  let related: any[] = [];

  try {
    const supabase = await createSupabaseServerClient();

    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("*")
      .in("slug", blogSlugCandidates(slug))
      .eq("published", true)
      .limit(2);

    if (postError) {
      console.error("Blog post query failed:", { slug, error: postError.message });
      throw postError;
    }

    post = pickPostBySlug(posts, slug);

    if (post) {
      const { data: categoryRelated } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .eq("category", post.category)
        .order("date", { ascending: false })
        .limit(8);

      related = withoutCurrentPost(categoryRelated, slug);

      if (related.length < 3) {
        const { data: latestRelated } = await supabase
          .from("posts")
          .select("*")
          .eq("published", true)
          .order("date", { ascending: false })
          .limit(10);

        related = uniquePosts([
          ...related,
          ...withoutCurrentPost(latestRelated, slug),
        ]);
      }

      related = related.slice(0, 3);
    }
  } catch (error) {
    console.error("Blog post render failed:", error);
  }

  if (!post) {
    post = fallbackPostBySlug(slug);
    related = fallbackRelatedPosts(slug);
  }

  if (!post) notFound();

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
}
