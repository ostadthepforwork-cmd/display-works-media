import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { blogCategories, blogCategoryBySlug, serviceByHref } from "@/lib/seo-content";
import { safeImageSrc } from "@/lib/image-utils";
import { ArrowRight, Calendar, Clock } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function fmtDateTH(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function readTimeTH(body: string) {
  return `${Math.max(1, Math.round((body || "").length / 5 / 200))} นาที`;
}

async function getPostsByCategory(categoryName: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .eq("category", categoryName)
      .order("date", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return blogCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = blogCategoryBySlug(slug);
  if (!category) return {};
  const url = `https://displayworksmedia.com/blog/category/${category.slug}`;
  return {
    title: `${category.name} | บทความ Display Works Media`,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${category.name} | Display Works Media`,
      description: category.description,
      url,
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = blogCategoryBySlug(slug);
  if (!category) notFound();
  const posts = (await getPostsByCategory(category.name))
    .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)));
  const relatedServices = category.serviceLinks.map(serviceByHref).filter(Boolean);

  return (
    <main className="brand-interior min-h-screen bg-[#050806] text-white" style={{ fontFamily: "'Prompt','Sarabun',sans-serif" }}>
      <Navbar />
      <section className="pt-[120px] pb-14 px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <Link href="/blog" className="text-[#FF7A00] text-sm font-semibold">บทความทั้งหมด</Link>
          <h1 className="font-kanit font-extrabold text-4xl lg:text-6xl mt-5 mb-5 max-w-4xl leading-tight">
            {category.name}
          </h1>
          <p className="text-[#A7B0C0] max-w-3xl leading-relaxed text-base lg:text-lg">{category.description}</p>
        </div>
      </section>

      <section className="py-14 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post: any) => {
                  const cover = safeImageSrc(post.cover);
                  return (
                  <article key={post.id} className="group bg-[#0E1310] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300">
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="relative h-48 bg-[#141A24]">
                        {cover ? (
                          <Image src={cover} alt={post.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#A7B0C0] text-xs">ไม่มีรูปปก</div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-[#A7B0C0] mb-3">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDateTH(post.date)}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {readTimeTH(post.body)}</span>
                        </div>
                        <h2 className="font-kanit font-bold text-lg text-white mb-2 group-hover:text-[#FF7A00] transition-colors">{post.title}</h2>
                        <p className="text-[#A7B0C0] text-sm leading-relaxed mb-4">{post.excerpt}</p>
                        <span className="inline-flex items-center gap-1.5 text-[#FF7A00] text-sm font-semibold">อ่านต่อ <ArrowRight size={14} /></span>
                      </div>
                    </Link>
                  </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0E1310] border border-white/5 p-8 text-[#A7B0C0]">
                <h2 className="font-kanit text-2xl text-white mb-3">กำลังเตรียมบทความในหมวดนี้</h2>
                <p className="leading-relaxed">โครงหมวดบทความพร้อมแล้ว สามารถเพิ่มบทความจาก Admin → CMS และเลือกหมวดนี้เพื่อให้แสดงในหน้านี้ได้ทันที</p>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-[#0E1310] border border-white/5 p-6">
              <h2 className="font-kanit font-bold text-xl mb-4">บริการที่เกี่ยวข้อง</h2>
              <div className="space-y-3">
                {relatedServices.map((service) => (
                  <Link key={service!.href} href={service!.href} className="block rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:border-[#FF7A00]/35 transition-colors">
                    <strong className="text-white">{service!.title}</strong>
                    <p className="mt-2 text-xs leading-relaxed text-[#A7B0C0]">{service!.description}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[#0E1310] border border-white/5 p-6">
              <h2 className="font-kanit font-bold text-xl mb-4">หมวดบทความ</h2>
              <div className="space-y-2">
                {blogCategories.map((item) => (
                  <Link key={item.slug} href={`/blog/category/${item.slug}`} className={`block px-3 py-2 rounded-lg text-sm ${item.slug === slug ? "bg-[#FF7A00] text-white" : "text-[#A7B0C0] hover:bg-white/5 hover:text-white"}`}>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
