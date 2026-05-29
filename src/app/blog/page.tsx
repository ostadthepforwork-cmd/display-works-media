import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Calendar, Clock, ArrowRight, Search, Home, ChevronRight } from "lucide-react";
import BlogClientShell from "./BlogClientShell";

// Server Component — ดึง data ฝั่ง server ให้ Google เห็น content
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata = {
  title: "บทความและความรู้งานพิมพ์ | Display Works Media",
  description: "เทคนิค ไอเดีย และความรู้เกี่ยวกับงานพิมพ์และสื่อโฆษณา จากทีมผู้เชี่ยวชาญ Display Works Media",
  alternates: { canonical: "https://displayworksmedia.com/blog" },
};

function fmtDateTH(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function readTimeTH(body: string) {
  return `${Math.max(1, Math.round((body || "").length / 5 / 200))} นาที`;
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  const allPosts = posts || [];
  const featuredPost = allPosts[0];
  const regularPosts = allPosts.slice(1);
  const categories = ["ทั้งหมด", ...Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean)))];

  return (
    <div className="min-h-screen text-white bg-[#050816]" style={{ fontFamily: "'Prompt', sans-serif" }}>

      {/* BREADCRUMB */}
      <div className="pt-[70px] bg-[#050816] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[#A7B0C0]">
          <Home size={14} aria-hidden="true" />
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-[#FF7A00]">บทความ</span>
        </div>
      </div>

      {/* HERO */}
      <section className="py-16 lg:py-20 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 border border-[#FF7A00]/30 text-[#FF7A00]">
              KNOWLEDGE CENTER
            </div>
            <h1 className="font-kanit font-extrabold text-4xl lg:text-6xl text-white mb-4">
              บทความและ<span style={{ color: "#FF7A00" }}>ความรู้</span>
            </h1>
            <p className="text-[#A7B0C0] text-base max-w-xl mx-auto">
              เทคนิค ไอเดีย และความรู้เกี่ยวกับงานพิมพ์และสื่อโฆษณา จากทีมผู้เชี่ยวชาญ
            </p>
          </div>
          {/* Search + category filter — client component เล็กๆ */}
          <BlogClientShell posts={allPosts} categories={categories} />
        </div>
      </section>

      {/* FEATURED — server-rendered, Google เห็นทันที */}
      {featuredPost && (
        <section className="py-12 bg-[#050816]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-xs font-bold tracking-widest text-[#FF7A00] mb-6 uppercase">บทความล่าสุด</p>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/5 bg-[#0B1220] hover:border-[#FF7A00]/30 transition-all duration-300"
            >
              <div className="relative h-64 lg:h-auto min-h-[300px] bg-[#141A24]">
                {featuredPost.cover ? (
                  <Image
                    src={featuredPost.cover}
                    alt={featuredPost.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#A7B0C0] text-sm">ไม่มีรูปปก</div>
                )}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 mb-4 w-fit">
                  {featuredPost.category}
                </span>
                <h2 className="font-kanit font-bold text-2xl lg:text-3xl text-white mb-4 leading-snug group-hover:text-[#FF7A00] transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-[#A7B0C0] text-sm leading-relaxed mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-[#A7B0C0] mb-6">
                  <span className="flex items-center gap-1.5"><Calendar size={13} aria-hidden="true" /> {fmtDateTH(featuredPost.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} aria-hidden="true" /> อ่าน {readTimeTH(featuredPost.body)}</span>
                </div>
                <span className="inline-flex items-center gap-2 text-[#FF7A00] text-sm font-semibold">
                  อ่านบทความ <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* GRID — server-rendered */}
      {regularPosts.length > 0 && (
        <section className="py-12 bg-[#050816]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article key={post.id} className="group bg-[#0B1220] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300 reveal-item">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative h-48 overflow-hidden bg-[#141A24]">
                      {post.cover ? (
                        <Image
                          src={post.cover}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#A7B0C0] text-xs">ไม่มีรูปปก</div>
                      )}
                      {post.category && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#050816]/80 backdrop-blur-sm text-[#FF7A00] border border-[#FF7A00]/20">
                            {post.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-[#A7B0C0] mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12} aria-hidden="true" /> {fmtDateTH(post.date)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {readTimeTH(post.body)}</span>
                      </div>
                      <h3 className="font-kanit font-bold text-base text-white mb-2 leading-snug group-hover:text-[#FF7A00] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-[#A7B0C0] text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                      <span className="inline-flex items-center gap-1.5 text-[#FF7A00] text-xs font-semibold">
                        อ่านต่อ <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {allPosts.length === 0 && (
        <div className="text-center py-32 text-[#A7B0C0]">
          <p className="text-2xl mb-2">ยังไม่มีบทความ</p>
          <p className="text-sm">เพิ่มบทความได้ที่หน้า Admin → CMS</p>
        </div>
      )}
    </div>
  );
}
