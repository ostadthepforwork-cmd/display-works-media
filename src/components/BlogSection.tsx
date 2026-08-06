"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { safeImageSrc } from "@/lib/image-utils";
import { blogPostPath } from "@/lib/blog-slug";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
  cover?: string;
  cover_alt?: string;
  published?: boolean;
  body: string;
}

function formatDate(date: string) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readTime(body: string) {
  return Math.max(1, Math.round((body || "").length / 1000));
}

export default function BlogSection({ initialPosts = [] }: { initialPosts?: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loaded, setLoaded] = useState(initialPosts.length > 0);

  useEffect(() => {
    if (initialPosts.length > 0) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setLoaded(true);
      return;
    }

    const supabase = createClient(url, key);

    async function fetchPosts() {
      const { data } = await supabase
        .from("posts")
        .select("id, title, excerpt, category, date, slug, cover, cover_alt, published, body")
        .eq("published", true)
        .order("date", { ascending: false })
        .limit(3);

      setPosts(data || []);
      setLoaded(true);
    }

    fetchPosts();
  }, [initialPosts.length]);

  if (loaded && posts.length === 0) return null;

  return (
    <section id="blog" className="home-section home-blog-section">
      <div className="home-blog-heading">
        <div className="home-section-title">
          <span>KNOWLEDGE CENTER</span>
          <h2>ความรู้และเทคนิค</h2>
          <p>คำแนะนำจากประสบการณ์ทำงานจริง เพื่อช่วยให้คุณเลือกวัสดุและเตรียมงานได้ง่ายขึ้น</p>
        </div>
        <Link href="/blog" className="home-btn home-btn-dark">
          ดูบทความทั้งหมด <ArrowRight size={14} />
        </Link>
      </div>

      <div className="home-blog-grid">
          {!loaded
            ? [1, 2, 3].map((item) => (
                <div key={item} className="home-blog-card min-h-[360px] animate-pulse" />
              ))
            : posts.map((post, index) => {
                const cover = safeImageSrc(post.cover);
                const coverAlt = post.cover_alt?.trim() || post.title;
                return (
                  <Link
                    key={post.id}
                    href={blogPostPath(post.slug)}
                    className="group home-blog-card reveal-item"
                  >
                    <div className="home-blog-image">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={coverAlt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#9AA4B3]">
                          ไม่มีรูปปก
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#10151D] to-transparent" />
                      {post.category && (
                        <span className="home-blog-category">
                          {post.category}
                        </span>
                      )}
                    </div>

                    <div className="home-blog-copy">
                      <div className="home-blog-meta">
                        <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5"><Clock3 size={13} /> {readTime(post.body)} นาที</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <span className="home-blog-link">
                        อ่านต่อ <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                );
              })}
      </div>
    </section>
  );
}
