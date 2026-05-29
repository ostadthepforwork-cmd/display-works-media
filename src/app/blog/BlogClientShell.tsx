"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight } from "lucide-react";

type Post = {
  id: string; title: string; excerpt: string; category: string;
  date: string; slug: string; cover: string; published: boolean; body: string;
};

function fmtDateTH(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function readTimeTH(body: string) {
  return `${Math.max(1, Math.round((body || "").length / 5 / 200))} นาที`;
}

export default function BlogClientShell({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");

  const isFiltered = activeCategory !== "ทั้งหมด" || searchQuery !== "";

  const filteredPosts = isFiltered
    ? posts.filter((p) => {
        const matchCat = activeCategory === "ทั้งหมด" || p.category === activeCategory;
        const matchSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      })
    : [];

  return (
    <>
      {/* Search */}
      <div className="max-w-lg mx-auto relative mb-2">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0C0]" aria-hidden="true" />
        <input
          type="text"
          placeholder="ค้นหาบทความ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm placeholder-[#A7B0C0] focus:border-[#FF7A00]/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="border-b border-white/5 bg-[#050816] sticky top-[70px] z-40 -mx-6 lg:-mx-8 px-6 lg:px-8 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  activeCategory === cat ? "bg-[#FF7A00] text-white" : "text-[#A7B0C0] hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtered results — only shown when searching/filtering */}
      {isFiltered && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-[#A7B0C0]">
              <p>ไม่พบบทความที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <article key={post.id} className="group bg-[#0B1220] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300">
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
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#050816]/80 text-[#FF7A00] border border-[#FF7A00]/20">
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
          )}
        </div>
      )}
    </>
  );
}
