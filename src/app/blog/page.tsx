"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Facebook, MessageCircle, Phone, Mail, MapPin,
  Instagram, ArrowRight, Calendar, Clock, ChevronRight,
  Home, Search
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Post = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
  cover: string;
  published: boolean;
  body: string;
};

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "/#services" },
  { label: "ผลงานของเรา", href: "/#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "/#process" },
  { label: "บทความ", href: "/blog" },
  { label: "ติดต่อเรา", href: "/#quote" },
];

const serviceLinks = [
  "ป้ายไวนิล",
  "Sticker Indoor / Outdoor",
  "PP Board / Standee",
  "Roll Up / X-stand",
  "Backdrop",
  "ฉลากสินค้า",
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverBg: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverBg: "#06C755" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverBg: "#E1306C" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtDateTH(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function readTimeTH(body: string) {
  const words = (body || "").length / 5;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} นาที`;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050816]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[70px]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image src="/images/logo.png" alt="Display Works Media" fill priority className="object-contain" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider leading-none text-white uppercase">DISPLAY WORKS</div>
            <div className="font-bold text-sm tracking-wider text-[#FF7A00] leading-none uppercase">Media</div>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}
              className={`text-sm transition-colors ${link.href === "/blog" ? "text-[#FF7A00] font-semibold" : "text-[#A7B0C0] hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <a href="/#quote" className="bg-[#FF7A00] hover:bg-[#e56a00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">ขอใบเสนอราคา</a>
        </div>
        <button className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0B1220] border-t border-white/10 px-6 py-6 flex flex-col gap-4 overflow-hidden">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-base" onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <a href="/#quote" className="mt-2 bg-[#FF7A00] text-white py-3 rounded-lg text-center font-bold" onClick={() => setMobileOpen(false)}>ขอใบเสนอราคา</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");

  // โหลดบทความจาก localStorage ที่ CMS บันทึกไว้
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cms_posts");
      if (raw) {
        const all: Post[] = JSON.parse(raw);
        // กรองเฉพาะบทความที่ published = true
        setPosts(all.filter((p) => p.published));
      }
    } catch {
      setPosts([]);
    }
  }, []);

  // สร้าง categories จากบทความจริง
  const categories = ["ทั้งหมด", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter((post) => {
    const matchCategory = activeCategory === "ทั้งหมด" || post.category === activeCategory;
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(activeCategory === "ทั้งหมด" && !searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen font-['Prompt',sans-serif] text-white bg-[#050816]">
      <Navbar />

      {/* BREADCRUMB */}
      <div className="pt-[70px] bg-[#050816] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[#A7B0C0]">
          <Home size={14} /><ChevronRight size={14} /><span className="text-[#FF7A00]">บทความ</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative py-16 lg:py-20 overflow-hidden bg-[#050816]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,122,0,0.05) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 border border-[#FF7A00]/30 text-[#FF7A00]">
              KNOWLEDGE CENTER
            </div>
            <h1 className="font-['Kanit'] font-extrabold text-4xl lg:text-6xl text-white mb-4">
              บทความและ<span style={{ color: "#FF7A00" }}>ความรู้</span>
            </h1>
            <p className="text-[#A7B0C0] text-base max-w-xl mx-auto">
              เทคนิค ไอเดีย และความรู้เกี่ยวกับงานพิมพ์และสื่อโฆษณา จากทีมผู้เชี่ยวชาญ
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="max-w-lg mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0C0]" />
              <input
                type="text"
                placeholder="ค้นหาบทความ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm placeholder-[#A7B0C0] focus:border-[#FF7A00]/50 focus:outline-none transition-colors"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="border-b border-white/5 bg-[#050816] sticky top-[70px] z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  activeCategory === cat ? "bg-[#FF7A00] text-white" : "text-[#A7B0C0] hover:text-white hover:bg-white/5"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ไม่มีบทความ */}
      {posts.length === 0 && (
        <div className="text-center py-32 text-[#A7B0C0]">
          <p className="text-2xl mb-2">ยังไม่มีบทความ</p>
          <p className="text-sm">เพิ่มบทความได้ที่หน้า Admin → CMS → บทความ</p>
        </div>
      )}

      {/* FEATURED POST */}
      {featuredPost && activeCategory === "ทั้งหมด" && !searchQuery && (
        <section className="py-12 bg-[#050816]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-xs font-bold tracking-widest text-[#FF7A00] mb-6 uppercase">บทความล่าสุด</p>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="group grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/5 bg-[#0B1220] hover:border-[#FF7A00]/30 transition-all duration-300">
              <div className="relative h-64 lg:h-auto min-h-[300px] bg-[#141A24]">
                {featuredPost.cover ? (
                  <Image src={featuredPost.cover} alt={featuredPost.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#A7B0C0] text-sm">ไม่มีรูปปก</div>
                )}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 mb-4 w-fit">
                  {featuredPost.category}
                </span>
                <h2 className="font-['Kanit'] font-bold text-2xl lg:text-3xl text-white mb-4 leading-snug group-hover:text-[#FF7A00] transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-[#A7B0C0] text-sm leading-relaxed mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-[#A7B0C0] mb-6">
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> {fmtDateTH(featuredPost.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> อ่าน {readTimeTH(featuredPost.body)}</span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-2 text-[#FF7A00] text-sm font-semibold hover:gap-3 transition-all">
                  อ่านบทความ <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* POSTS GRID */}
      <section className="py-12 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {filteredPosts.length === 0 && posts.length > 0 ? (
            <div className="text-center py-20 text-[#A7B0C0]">
              <p className="text-lg">ไม่พบบทความที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, i) => (
                <motion.article key={post.id}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group bg-[#0B1220] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300">
                  <div className="relative h-48 overflow-hidden bg-[#141A24]">
                    {post.cover ? (
                      <Image src={post.cover} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
                      <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDateTH(post.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {readTimeTH(post.body)}</span>
                    </div>
                    <h3 className="font-['Kanit'] font-bold text-base text-white mb-2 leading-snug group-hover:text-[#FF7A00] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#A7B0C0] text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1.5 text-[#FF7A00] text-xs font-semibold hover:gap-2.5 transition-all">
                      อ่านต่อ <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#080B13] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-['Kanit'] font-bold text-white text-lg">พร้อมเริ่มโปรเจกต์แล้วหรือยัง?</p>
              <p className="text-sm text-[#A7B0C0]">ประเมินราคาฟรี ตอบกลับภายใน 24 ชั่วโมง</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="https://lin.ee/O0nPl03" target="_blank" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#06C755] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#06C755]/20">
                <MessageCircle size={18} /> LINE
              </a>
              <a href="/#quote" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#FF7A00] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#FF7A00]/20">
                ขอใบเสนอราคา
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#080B13] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-5 w-fit">
                <div className="relative w-10 h-10 flex-shrink-0"><Image src="/images/logo.png" alt="Display Works Media" fill className="object-contain" /></div>
                <div>
                  <div className="font-bold text-sm tracking-wider text-white leading-none">DISPLAY WORKS</div>
                  <div className="font-bold text-sm tracking-wider leading-none text-[#FF7A00]">MEDIA</div>
                </div>
              </Link>
              <p className="text-sm leading-relaxed mb-6 text-[#A7B0C0]">บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ</p>
              <div className="flex gap-2.5">
                {socials.map(({ icon: Icon, href, label, hoverBg }) => (
                  <a key={label} href={href} target="_blank"
                    className="w-10 h-10 rounded-xl bg-[#141A24] border border-white/5 flex items-center justify-center text-[#A7B0C0] transition-all duration-200"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = hoverBg; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#141A24"; (e.currentTarget as HTMLAnchorElement).style.color = "#A7B0C0"; }}>
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">เมนู</h4>
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-[#A7B0C0] hover:text-white transition-colors">{link.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">บริการของเรา</h4>
              <div className="flex flex-col gap-3">
                {serviceLinks.map((s) => (
                  <a key={s} href="/#services" className="text-sm text-[#A7B0C0] hover:text-white transition-colors">{s}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">ติดต่อเรา</h4>
              <div className="flex flex-col gap-4">
                <a href="https://lin.ee/O0nPl03" target="_blank" className="flex items-start gap-3 text-sm text-[#A7B0C0] hover:text-white transition-colors"><MessageCircle size={16} className="text-[#06C755] flex-shrink-0 mt-0.5" /> LINE @displayworks</a>
                <a href="tel:0659161539" className="flex items-start gap-3 text-sm text-[#A7B0C0] hover:text-white transition-colors"><Phone size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> 065-916-1539</a>
                <a href="mailto:info.displayworksmedia@gmail.com" className="flex items-start gap-3 text-sm text-[#A7B0C0] hover:text-white transition-colors"><Mail size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> info.displayworksmedia@gmail.com</a>
                <div className="flex items-start gap-3 text-sm text-[#A7B0C0]"><MapPin size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> ให้บริการทั่วประเทศไทย</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-8 border-t border-white/5 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Display Works Media. All Rights Reserved.</span>
            <span>ออกแบบและพัฒนาโดยทีมงาน Display Works Media</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
