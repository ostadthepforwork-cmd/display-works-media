"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  Menu, X, Facebook, MessageCircle, Phone, Mail, MapPin,
  Instagram, ArrowRight, Calendar, Clock, ChevronRight,
  Home, Tag, AlertCircle,
} from "lucide-react";

type Post = {
  id: string; title: string; excerpt: string; category: string;
  date: string; slug: string; cover: string; published: boolean; body: string;
};

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "/#services" },
  { label: "ผลงานของเรา", href: "/#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "/#process" },
  { label: "บทความ", href: "/blog" },
  { label: "ติดต่อเรา", href: "/#quote" },
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverBg: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverBg: "#06C755" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverBg: "#E1306C" },
];

function fmtDateTH(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" });
}
function readTimeTH(body: string) {
  return `${Math.max(1, Math.round((body || "").length / 5 / 200))} นาที`;
}
function bodyToHtml(body: string): string {
  if (!body) return "<p>ยังไม่มีเนื้อหา</p>";
  // ถ้าเป็น HTML จาก RichEditor ให้ใช้โดยตรง
  if (body.trim().startsWith("<") && (body.includes("</p>") || body.includes("</h") || body.includes("</ul>") || body.includes("<figure"))) {
    return body;
  }
  // fallback: plain text / markdown
  return body.split(/\n{2,}/).map((para) => {
    const t = para.trim();
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2>${t.slice(3)}</h2>`;
    if (t.startsWith("# ")) return `<h1>${t.slice(2)}</h1>`;
    if (t.split("\n").every((l) => l.trim().startsWith("- "))) {
      return `<ul>${t.split("\n").map((l) => `<li>${l.trim().slice(2)}</li>`).join("")}</ul>`;
    }
    return `<p>${t.replace(/\n/g, "<br/>")}</p>`;
  }).join("");
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050816]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[70px]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 relative flex-shrink-0"><Image src="/images/logo.png" alt="Display Works Media" width={40} height={40} priority className="object-contain" /></div>
          <div>
            <div className="font-bold text-sm tracking-wider leading-none text-white uppercase">DISPLAY WORKS</div>
            <div className="font-bold text-sm tracking-wider leading-none uppercase" style={{ color: "#FF7A00" }}>MEDIA</div>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className={`text-sm transition-colors ${link.href === "/blog" ? "text-[#FF7A00] font-semibold" : "text-[#A7B0C0] hover:text-white"}`}>{link.label}</a>
          ))}
        </div>
        <a href="/#quote" className="hidden lg:block bg-[#FF7A00] hover:bg-[#e56a00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">ขอใบเสนอราคา</a>
        <button className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      {mobileOpen && (
          <div className="lg:hidden bg-[#0B1220] border-t border-white/10 px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (<a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-base" onClick={() => setMobileOpen(false)}>{link.label}</a>))}
            <a href="/#quote" className="mt-2 bg-[#FF7A00] text-white py-3 rounded-lg text-center font-bold" onClick={() => setMobileOpen(false)}>ขอใบเสนอราคา</a>
          </div>
      )}
    </nav>
  );
}

export default function BlogPostPage({
  initialPost = null,
  initialRelated = [],
}: {
  initialPost?: Post | null;
  initialRelated?: Post[];
}) {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(initialPost);
  const [related, setRelated] = useState<Post[]>(initialRelated);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialPost?.slug === decodeURIComponent(slug)) return;

    async function fetchPost() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const decodedSlug = decodeURIComponent(slug);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", decodedSlug)
        .eq("published", true)
        .single();

      if (error || !data) { setNotFound(true); return; }
      setPost(data);

      // บทความที่เกี่ยวข้อง
      const { data: relData } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .eq("category", data.category)
        .neq("slug", decodedSlug)
        .limit(3);
      setRelated(relData || []);
    }
    fetchPost();
  }, [initialPost?.slug, slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center gap-6">
        <AlertCircle size={48} className="text-[#FF7A00]" />
        <h1 className="font-['Kanit'] font-bold text-2xl">ไม่พบบทความนี้</h1>
        <p className="text-[#A7B0C0] text-sm">อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
        <Link href="/blog" className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#e56a00] transition-all">← กลับไปหน้าบทความ</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Prompt',sans-serif] text-white bg-[#050816]">
      <Navbar />

      <div className="pt-[70px] bg-[#050816] border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-[#A7B0C0] flex-wrap">
          <Home size={14} /><ChevronRight size={14} />
          <Link href="/blog" className="hover:text-white transition-colors">บทความ</Link>
          <ChevronRight size={14} />
          <span className="text-[#FF7A00] line-clamp-1">{post.title}</span>
        </div>
      </div>

      {post.cover && (
        <div className="relative w-full h-64 md:h-96">
          <Image src={post.cover} alt={post.title} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />
        </div>
      )}

      <article className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="reveal-section">
          {post.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 mb-5">
              <Tag size={11} /> {post.category}
            </span>
          )}
          <h1 className="font-['Kanit'] font-extrabold text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-6">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#A7B0C0] mb-8 pb-8 border-b border-white/10">
            <span className="flex items-center gap-1.5"><Calendar size={15} /> {fmtDateTH(post.date)}</span>
            <span className="flex items-center gap-1.5"><Clock size={15} /> อ่าน {readTimeTH(post.body)}</span>
          </div>
          {post.excerpt && (
            <p className="text-lg text-[#A7B0C0] leading-relaxed mb-10 border-l-4 border-[#FF7A00] pl-5 italic">{post.excerpt}</p>
          )}
        </div>

        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: bodyToHtml(post.body) }} />

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#FF7A00] font-semibold text-sm hover:gap-3 transition-all">
            <ArrowRight size={16} className="rotate-180" /> กลับไปหน้าบทความทั้งหมด
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-[#080B13] border-t border-white/5 py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className="font-['Kanit'] font-bold text-xl text-white mb-8">บทความที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`}
                  className="group bg-[#0B1220] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF7A00]/30 transition-all duration-300">
                  <div className="relative h-40 bg-[#141A24]">
                    {r.cover ? <Image src={r.cover} alt={r.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="absolute inset-0 flex items-center justify-center text-[#A7B0C0] text-xs">ไม่มีรูปปก</div>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#A7B0C0] mb-2 flex items-center gap-1"><Calendar size={11} /> {fmtDateTH(r.date)}</p>
                    <h3 className="font-['Kanit'] font-bold text-sm text-white group-hover:text-[#FF7A00] transition-colors line-clamp-2">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#080B13] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-5 w-fit">
                <div className="relative w-10 h-10 flex-shrink-0"><Image src="/images/logo.png" alt="Display Works Media" width={40} height={40} className="object-contain" /></div>
                <div>
                  <div className="font-bold text-sm tracking-wider text-white leading-none">DISPLAY WORKS</div>
                  <div className="font-bold text-sm tracking-wider leading-none" style={{ color: "#FF7A00" }}>MEDIA</div>
                </div>
              </Link>
              <p className="text-sm leading-relaxed mb-6 text-[#A7B0C0]">บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ</p>
              <div className="flex gap-2.5">
                {socials.map(({ icon: Icon, href, label, hoverBg }) => (
                  <a key={label} href={href} target="_blank" className="w-10 h-10 rounded-xl bg-[#141A24] border border-white/5 flex items-center justify-center text-[#A7B0C0] transition-all duration-200"
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
                {navLinks.map((link) => (<a key={link.href} href={link.href} className="text-sm text-[#A7B0C0] hover:text-white transition-colors">{link.label}</a>))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">บริการของเรา</h4>
              <div className="flex flex-col gap-3">
                {["ป้ายไวนิล","Sticker Indoor / Outdoor","PP Board / Standee","Roll Up / X-stand","Backdrop","ฉลากสินค้า"].map((s) => (
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

      <style jsx global>{`
        .prose-blog h1 { font-family: 'Kanit', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; margin: 2rem 0 1rem; line-height: 1.3; }
        .prose-blog h2 { font-family: 'Kanit', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #FF7A0033; }
        .prose-blog h3 { font-family: 'Kanit', sans-serif; font-size: 1.2rem; font-weight: 600; color: #fff; margin: 1.5rem 0 0.5rem; }
        .prose-blog h4 { font-size: 1rem; font-weight: 600; color: #FF7A00; margin: 1rem 0 0.5rem; }
        .prose-blog p  { color: #CBD5E1; line-height: 1.9; margin-bottom: 1.25rem; font-size: 1rem; }
        .prose-blog ul { list-style: none; padding: 0; margin: 0 0 1.25rem; }
        .prose-blog ul li { color: #CBD5E1; padding: 0.35rem 0 0.35rem 1.5rem; position: relative; line-height: 1.8; }
        .prose-blog ul li::before { content: '▸'; position: absolute; left: 0; color: #FF7A00; }
        .prose-blog ol { padding-left: 1.5rem; margin: 0 0 1.25rem; }
        .prose-blog ol li { color: #CBD5E1; line-height: 1.8; margin-bottom: 4px; }
        .prose-blog blockquote { border-left: 4px solid #FF7A00; padding: 12px 20px; margin: 1.5rem 0; background: rgba(255,122,0,0.05); border-radius: 0 10px 10px 0; color: #A7B0C0; font-style: italic; }
        .prose-blog a { color: #60A5FA; text-decoration: underline; word-break: break-word; }
        .prose-blog a:hover { color: #FF7A00; }
        .prose-blog figure { margin: 2rem 0; text-align: center; }
        .prose-blog figure img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .prose-blog figcaption { font-size: 13px; color: #64748B; margin-top: 10px; font-style: italic; }
        .prose-blog img { max-width: 100%; height: auto; border-radius: 10px; margin: 1rem 0; }
        .prose-blog strong { color: #fff; font-weight: 700; }
        .prose-blog em { color: #A7B0C0; font-style: italic; }
        .prose-blog u { text-decoration-color: #FF7A00; }
      `}</style>
    </div>
  );
}
