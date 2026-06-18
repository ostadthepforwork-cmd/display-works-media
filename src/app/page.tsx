import { getCmsSettings } from "@/lib/cms-settings";
import HomeExperience from "@/components/HomeExperience";
import type { BlogPost } from "@/components/BlogSection";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getLatestPosts(): Promise<BlogPost[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key);
    const query = supabase
      .from("posts")
      .select("id, title, excerpt, category, date, slug, cover, cover_alt, published, body")
      .eq("published", true)
      .order("date", { ascending: false })
      .limit(3);

    const result = await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Homepage blog query timed out")), 3000)
      ),
    ]);

    return (result.data || []) as BlogPost[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [cms, posts] = await Promise.all([getCmsSettings(), getLatestPosts()]);

  return <HomeExperience cms={cms} posts={posts} />;
}
