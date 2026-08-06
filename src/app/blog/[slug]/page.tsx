import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleSchema, BreadcrumbSchema } from "@/components/SchemaOrg";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { blogSlugCandidates, normalizeBlogSlug } from "@/lib/blog-slug";
import BlogPostClient from "./BlogPostClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const { slug: rawSlug } = await params;
  const slug = normalizeBlogSlug(rawSlug);
  const articleUrl = `https://displayworksmedia.com/blog/${slug}`;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: post } = await supabase
      .from("posts")
      .select("title, seo_title, excerpt, meta_desc, focus_keyword, tags, cover, cover_alt, category, date")
      .in("slug", blogSlugCandidates(slug))
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
  const { slug: rawSlug } = await params;
  const slug = normalizeBlogSlug(rawSlug);

  try {
    const supabase = await createSupabaseServerClient();

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .in("slug", blogSlugCandidates(slug))
      .eq("published", true)
      .maybeSingle();

    if (postError) {
      console.error("Blog post query failed:", { slug, error: postError.message });
      throw postError;
    }

    if (!post) notFound();

    const { data: related } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .eq("category", post.category)
      .not("slug", "in", `(${blogSlugCandidates(slug).map((candidate) => `"${candidate}"`).join(",")})`)
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
  } catch (error) {
    console.error("Blog post render failed:", error);
    notFound();
  }
}
