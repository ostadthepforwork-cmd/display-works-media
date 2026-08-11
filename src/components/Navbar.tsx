"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle, ArrowUpRight } from "lucide-react";
import { Facebook } from "@/components/BrandIcons";

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
      <div className="navbar-shell max-w-[1380px] mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between h-[64px]">
        {/* Logo */}
        <Link href="/" className="navbar-brand flex min-w-0 items-center gap-3">
          <div className="w-11 h-11 relative flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Display Works Media logo"
              width={44}
              height={44}
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
            style={{ backgroundColor: "#047857", boxShadow: "0 4px 20px rgba(4,120,87,0.24)" }}
          >
            ปรึกษาทาง LINE <MessageCircle size={16} />
          </a>
          <Link
            href="/#quote"
            className="inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-sm text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: "#C2410C", boxShadow: "0 4px 20px rgba(194,65,12,0.22)" }}
          >
            ขอราคา <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="navbar-menu-button"
          style={{
            marginLeft: "auto",
            minWidth: 74,
            height: 44,
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 6,
            background: "#C2410C",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            boxShadow: "0 10px 28px rgba(194,65,12,0.26)",
          }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span>เมนู</span>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
        <Link href="/#quote" className="navbar-mobile-quote">
          ขอราคา
        </Link>
      </div>

    </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
        <button
          type="button"
          className="navbar-mobile-menu-backdrop xl:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="navbar-mobile-menu-panel xl:hidden" aria-label="Mobile navigation">
          <div className="navbar-mobile-menu-title">เมนูหลัก</div>
          <button
            type="button"
            className="navbar-mobile-menu-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
          <div className="navbar-mobile-menu-list">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-mobile-link ${pathname === link.href ? "is-active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{link.label}</span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
          </div>
          <div className="navbar-mobile-actions">
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-mobile-action-line"
              onClick={() => setMobileOpen(false)}
            >
              ปรึกษาทาง LINE ฟรี
            </a>
            <Link
              href="/#quote"
              className="navbar-mobile-action-quote"
              onClick={() => setMobileOpen(false)}
            >
              ส่งข้อมูลขอราคา
            </Link>
          </div>
        </aside>
        </>
      )}
    </>
  );
}
