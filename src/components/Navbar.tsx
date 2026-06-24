"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle, Facebook, ArrowUpRight } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "/services" },
  { label: "ผลงานของเรา", href: "/portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "/#process" },
  { label: "บทความ", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/15 bg-[#080b0a]/95 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="max-w-[1380px] mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between h-[64px]">
        {/* Logo */}
        <Link href="/" className="navbar-brand flex min-w-0 items-center gap-3">
          <div className="w-11 h-11 relative flex-shrink-0">
            <img
              src="/images/logo.png"
              alt="Display Works Media logo"
              className="h-11 w-11 object-contain"
              style={{ width: 44, height: 44 }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="navbar-brand-text">
            <div className="font-kanit font-bold text-[13px] tracking-[0.12em] leading-none text-white">
              DISPLAY WORKS
            </div>
            <div className="mt-1 font-kanit font-bold text-[11px] tracking-[0.25em] leading-none" style={{ color: "#FF6500" }}>
              MEDIA
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden xl:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-normal transition-colors duration-200 ${
                pathname === link.href ? "text-[#FF6500]" : "text-[#c0c5c3] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden xl:flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/10 pr-4">
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-green-400 transition-colors"
              aria-label="LINE"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61581015452518"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-blue-400 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>
          <a
            href="https://lin.ee/O0nPl03"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-sm text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: "#06C755", boxShadow: "0 4px 20px rgba(6,199,85,0.2)" }}
          >
            ปรึกษาทาง LINE <MessageCircle size={16} />
          </a>
          <Link
            href="/#quote"
            className="inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-sm text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: "#FF6500", boxShadow: "0 4px 20px rgba(255,101,0,0.18)" }}
          >
            ขอราคา <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="navbar-menu-button"
          style={{
            marginLeft: "auto",
            minWidth: 74,
            height: 38,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 6,
            background: "#FF6500",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            boxShadow: "0 10px 28px rgba(255,101,0,0.22)",
          }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span>เมนู</span>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#080b0a] border-t border-white/[0.12] px-5 py-4 flex flex-col gap-1 max-h-[calc(100vh-64px)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#A0A9B7] hover:text-white text-base py-3 border-b border-white/[0.05] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://lin.ee/O0nPl03"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-white text-center py-3.5 rounded-md font-semibold text-sm"
            style={{ backgroundColor: "#06C755" }}
            onClick={() => setMobileOpen(false)}
          >
            ปรึกษาทาง LINE ฟรี
          </a>
          <Link
            href="/#quote"
            className="text-white text-center py-3 rounded-md font-semibold text-sm border border-white/15"
            onClick={() => setMobileOpen(false)}
          >
            ส่งข้อมูลขอราคา
          </Link>
        </div>
      )}
    </nav>
    </>
  );
}
